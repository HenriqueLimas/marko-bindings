import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { format } from "prettier";
import {
  determineInitialRoutePath,
  physicalGetRouteNodes,
  routePathToVariable,
} from "@tanstack/router-generator";

const componentSuffixes = [
  "component",
  "errorComponent",
  "pendingComponent",
  "notFoundComponent",
];

const defaultConfig = {
  routesDirectory: "./src/routes",
  generatedRouteTree: "./src/routeTree.gen.ts",
  routeFileIgnorePrefix: "-",
  routeFileIgnorePattern: undefined,
  routeFilePrefix: undefined,
  indexToken: "index",
  routeToken: "route",
  disableLogging: false,
  quoteStyle: "single",
  semicolons: false,
};

function tokenRegex(token) {
  if (token instanceof RegExp)
    return new RegExp(`^(?:${token.source})$`, token.flags);
  if (typeof token === "object") {
    return new RegExp(`^(?:${token.regex})$`, token.flags);
  }
  return new RegExp(`^(?:${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})$`);
}

function normalize(value) {
  return value.replaceAll("\\", "/");
}

function withoutExtension(filePath) {
  return filePath.replace(/\.[^.\/]+$/, "");
}

function importPath(fromFile, targetFile, keepExtension = false) {
  let relative = normalize(path.relative(path.dirname(fromFile), targetFile));
  if (!keepExtension) relative = withoutExtension(relative);
  return relative.startsWith(".") ? relative : `./${relative}`;
}

async function findMarkoPieces(routesDirectory, config) {
  const pieces = new Map();
  const ignorePattern = config.routeFileIgnorePattern
    ? new RegExp(config.routeFileIgnorePattern)
    : undefined;

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        if (
          entry.name.startsWith(".") ||
          (config.routeFileIgnorePrefix &&
            entry.name.startsWith(config.routeFileIgnorePrefix)) ||
          (config.routeFilePrefix &&
            !entry.name.startsWith(config.routeFilePrefix)) ||
          ignorePattern?.test(entry.name)
        ) {
          return;
        }

        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await visit(fullPath);
          return;
        }

        for (const suffix of componentSuffixes) {
          const ending = `.${suffix}.marko`;
          if (!entry.name.endsWith(ending)) continue;

          const relative = normalize(path.relative(routesDirectory, fullPath));
          const routeFile = relative.slice(0, -ending.length);
          const routePieces = pieces.get(routeFile) ?? {};
          routePieces[suffix] = fullPath;
          pieces.set(routeFile, routePieces);
          return;
        }
      }),
    );
  }

  await visit(routesDirectory);
  return pieces;
}

function cleanUrlPath(routePath) {
  const trailingSlash = routePath.endsWith("/");
  const segments = routePath
    .split("/")
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
    .filter((segment) => !segment.startsWith("_"))
    .map((segment) => (segment.endsWith("_") ? segment.slice(0, -1) : segment));
  const result = `/${segments.join("/")}`;
  return trailingSlash && result !== "/" ? `${result}/` : result;
}

function routeKey(node) {
  return withoutExtension(normalize(node.filePath));
}

function findParent(node, nodes) {
  const routePath = node.routePath.replace(/\/$/, "");
  return nodes
    .filter(
      (candidate) => candidate !== node && !candidate.routePath.endsWith("/"),
    )
    .filter((candidate) => {
      const candidatePath = candidate.routePath.replace(/\/$/, "");
      return (
        candidatePath &&
        (routePath.startsWith(`${candidatePath}/`) ||
          (node.routePath.endsWith("/") && routePath === candidatePath))
      );
    })
    .sort((a, b) => b.routePath.length - a.routePath.length)[0];
}

function buildGeneratedRouteTree({
  rootNode,
  routeNodes,
  virtualRouteNodes,
  pieces,
  generatedRouteTree,
  generatedRouteComponents,
}) {
  const supportedRouteTypes = new Set(["static", "layout", "pathless_layout"]);
  const nodes = [...routeNodes, ...virtualRouteNodes]
    .filter(
      (node) => node !== rootNode && supportedRouteTypes.has(node._fsRouteType),
    )
    .map((node) => ({
      ...node,
      routePath: node.routePath,
      variableName: `${node.variableName ?? routePathToVariable(node.routePath)}Route`,
      pieces: pieces.get(routeKey(node)) ?? {},
    }))
    .sort((a, b) => a.routePath.localeCompare(b.routePath));

  for (const node of nodes) {
    node.parent = findParent(node, nodes);
    node.children = [];
    node.parent?.children.push(node);
  }

  const rootPieces = pieces.get("__root") ?? {};
  const capitalize = (value) => value[0].toUpperCase() + value.slice(1);
  const componentPieces = [
    { owner: "RootRoute", pieces: rootPieces },
    ...nodes.map((node) => ({ owner: node.variableName, pieces: node.pieces })),
  ].flatMap(({ owner, pieces: routePieces }) =>
    componentSuffixes
      .filter((suffix) => routePieces[suffix])
      .map((suffix) => ({
        getter: `get${owner}${capitalize(suffix)}`,
        identifier: `${owner}${capitalize(suffix)}`,
        path: routePieces[suffix],
      })),
  );
  const lines = [
    "/* eslint-disable */",
    "// @ts-nocheck",
    "// This file was automatically generated by @marko-bindings/tanstack-router.",
    "// Do not edit this file directly.",
    "",
  ];

  const runtimeImports = [
    ...(componentPieces.length ? ["lazyRouteComponent"] : []),
    ...(virtualRouteNodes.length ? ["createFileRoute"] : []),
  ];
  if (runtimeImports.length) {
    lines.push(
      `import { ${runtimeImports.join(", ")} } from '@marko-bindings/tanstack-router'`,
      "",
    );
  }
  if (componentPieces.length) {
    lines.push(
      `import { ${componentPieces.map(({ getter }) => getter).join(", ")} } from '${importPath(
        generatedRouteTree,
        generatedRouteComponents,
        true,
      )}'`,
      "",
    );
  }

  lines.push(
    `import { Route as rootRouteImport } from '${importPath(
      generatedRouteTree,
      rootNode.fullPath,
    )}'`,
  );
  for (const node of nodes) {
    if (!node.isVirtual) {
      lines.push(
        `import { Route as ${node.variableName}Import } from '${importPath(
          generatedRouteTree,
          node.fullPath,
        )}'`,
      );
    }
  }
  lines.push("");
  for (const node of nodes) {
    if (node.isVirtual) {
      lines.push(
        `const ${node.variableName}Import = createFileRoute('${node.routePath}')()`,
      );
    }
  }
  if (virtualRouteNodes.length) lines.push("");

  function componentOptions(routePieces, owner) {
    return componentSuffixes
      .filter((suffix) => routePieces[suffix])
      .map((suffix) => {
        const componentPath = importPath(
          generatedRouteTree,
          routePieces[suffix],
          true,
        );
        return `  ${suffix}: lazyRouteComponent(() => import('${componentPath}'), 'default', get${owner}${capitalize(suffix)}()),`;
      });
  }

  const rootOptions = componentOptions(rootPieces, "RootRoute");
  lines.push(
    rootOptions.length
      ? `const rootRoute = rootRouteImport.update({\n${rootOptions.join("\n")}\n})`
      : "const rootRoute = rootRouteImport",
    "",
  );

  for (const node of nodes) {
    const parentPath = node.parent?.routePath;
    const rawRelativePath = parentPath
      ? node.routePath.slice(parentPath.replace(/\/$/, "").length)
      : node.routePath;
    const pathValue = cleanUrlPath(rawRelativePath);
    const pathless = rawRelativePath
      .split("/")
      .filter(Boolean)
      .some((segment) => segment.startsWith("_"));
    const parent = node.parent ? node.parent.variableName : "rootRoute";
    const routeOptions = [
      `  id: '${rawRelativePath || "/"}',`,
      ...(pathless ? [] : [`  path: '${pathValue}',`]),
      `  getParentRoute: () => ${parent},`,
    ];
    const lazyOptions = componentOptions(node.pieces, node.variableName);
    const lazyUpdate = lazyOptions.length
      ? `.update({\n${lazyOptions.join("\n")}\n})`
      : "";
    lines.push(
      `const ${node.variableName} = ${node.variableName}Import.update({\n${routeOptions.join(
        "\n",
      )}\n} as any)${lazyUpdate}`,
      "",
    );
  }

  const nodesWithChildren = [...nodes]
    .filter((node) => node.children.length > 0)
    .sort((a, b) => b.routePath.length - a.routePath.length);
  const resolvedName = (node) =>
    node.children.length
      ? `${node.variableName}WithChildren`
      : node.variableName;

  for (const node of nodesWithChildren) {
    lines.push(
      `const ${node.variableName}Children = {`,
      ...node.children.map(
        (child) => `  ${child.variableName}: ${resolvedName(child)},`,
      ),
      "}",
      `const ${node.variableName}WithChildren = ${node.variableName}._addFileChildren(${node.variableName}Children)`,
      "",
    );
  }

  const rootChildren = nodes.filter((node) => !node.parent);
  lines.push(
    "const rootRouteChildren = {",
    ...rootChildren.map(
      (child) => `  ${child.variableName}: ${resolvedName(child)},`,
    ),
    "}",
    "",
    "export const routeTree = rootRoute",
    "  ._addFileChildren(rootRouteChildren)",
    "  ._addFileTypes<FileRouteTypes>()",
    "",
  );

  const fullPath = (node) => cleanUrlPath(node.routePath);
  lines.push(
    "declare module '@marko-bindings/tanstack-router' {",
    "  interface FileRoutesByPath {",
  );
  for (const node of nodes) {
    lines.push(
      `    '${node.routePath}': {`,
      `      id: '${node.routePath}'`,
      `      path: '${cleanUrlPath(
        node.parent
          ? node.routePath.slice(
              node.parent.routePath.replace(/\/$/, "").length,
            )
          : node.routePath,
      )}'`,
      `      fullPath: '${fullPath(node)}'`,
      `      preLoaderRoute: typeof ${node.variableName}Import`,
      `      parentRoute: typeof ${node.parent ? node.parent.variableName : "rootRoute"}`,
      "    }",
    );
  }
  lines.push(
    "  }",
    "}",
    "",
    "export interface FileRouteTypes {",
    `  fileRoutesByFullPath: { ${nodes
      .map((node) => `'${fullPath(node)}': typeof ${resolvedName(node)}`)
      .join("; ")} }`,
    `  fullPaths: ${nodes.length ? nodes.map((node) => `'${fullPath(node)}'`).join(" | ") : "never"}`,
    `  fileRoutesByTo: { ${nodes
      .map((node) => `'${fullPath(node)}': typeof ${resolvedName(node)}`)
      .join("; ")} }`,
    `  to: ${nodes.length ? nodes.map((node) => `'${fullPath(node)}'`).join(" | ") : "never"}`,
    `  id: '__root__'${nodes.map((node) => ` | '${node.routePath}'`).join("")}`,
    `  fileRoutesById: { __root__: typeof rootRoute; ${nodes
      .map((node) => `'${node.routePath}': typeof ${resolvedName(node)}`)
      .join("; ")} }`,
    "}",
    "",
  );

  const routeComponents = [
    ...componentPieces.map(
      ({ identifier, path: componentPath }) =>
        `import ${identifier} from '${importPath(
          generatedRouteComponents,
          componentPath,
          true,
        )}' with { load: 'render' }`,
    ),
    "",
    ...componentPieces.flatMap(({ getter, identifier }) => [
      `export function ${getter}() {`,
      `  return ${identifier}`,
      "}",
      "",
    ]),
  ];

  return {
    routeTree: `${lines.join("\n")}\n`,
    routeComponents: routeComponents.join("\n"),
  };
}

async function generate(config, root) {
  const routesDirectory = path.resolve(root, config.routesDirectory);
  const generatedRouteTree = path.resolve(root, config.generatedRouteTree);
  const generatedRouteComponents = generatedRouteTree.replace(
    /\.[^.]+$/,
    ".marko",
  );
  const { rootRouteNode, routeNodes } = await physicalGetRouteNodes(
    { ...config, routesDirectory },
    root,
    {
      indexTokenSegmentRegex: tokenRegex(config.indexToken),
      routeTokenSegmentRegex: tokenRegex(config.routeToken),
    },
  );
  if (!rootRouteNode) {
    throw new Error(`A __root route is required in ${routesDirectory}.`);
  }

  const pieces = await findMarkoPieces(routesDirectory, config);
  const configRouteKeys = new Set(routeNodes.map(routeKey));
  const indexTokenRegex = tokenRegex(config.indexToken);
  const routeTokenRegex = tokenRegex(config.routeToken);
  const virtualRouteNodes = [...pieces.keys()]
    .filter((routeFile) => routeFile !== "__root")
    .filter((routeFile) => !configRouteKeys.has(routeFile))
    .map((routeFile) => {
      let { routePath } = determineInitialRoutePath(routeFile);
      const segments = routePath.split("/").filter(Boolean);
      const lastSegment = segments.at(-1);
      if (lastSegment && routeTokenRegex.test(lastSegment)) {
        segments.pop();
        routePath = `/${segments.join("/")}`;
      } else if (lastSegment && indexTokenRegex.test(lastSegment)) {
        segments.pop();
        routePath = `/${segments.join("/")}/`.replace(/^\/\/$/, "/");
      }
      return {
        filePath: routeFile,
        routePath,
        variableName: routePathToVariable(`/${routeFile}`),
        _fsRouteType: "static",
        isVirtual: true,
      };
    });
  const generated = buildGeneratedRouteTree({
    rootNode: rootRouteNode,
    routeNodes,
    virtualRouteNodes,
    pieces,
    generatedRouteTree,
    generatedRouteComponents,
  });
  const routeTreeOutput = await format(generated.routeTree, {
    parser: "typescript",
    semi: config.semicolons,
    singleQuote: config.quoteStyle === "single",
  });

  await mkdir(path.dirname(generatedRouteTree), { recursive: true });
  async function writeGenerated(file, output) {
    let current;
    try {
      current = await readFile(file, "utf8");
    } catch {}
    if (current !== output) await writeFile(file, output);
  }

  await Promise.all([
    writeGenerated(generatedRouteTree, routeTreeOutput),
    writeGenerated(generatedRouteComponents, generated.routeComponents),
  ]);
}

export function tanstackRouter(options = {}) {
  let root = process.cwd();
  const config = { ...defaultConfig, ...options };
  const routesDirectory = () => path.resolve(root, config.routesDirectory);

  return {
    name: "marko-bindings:tanstack-router",
    enforce: "pre",
    async configResolved(resolved) {
      root = resolved.root;
      await generate(config, root);
    },
    async watchChange(id) {
      if (path.resolve(id).startsWith(routesDirectory())) {
        await generate(config, root);
      }
    },
  };
}

export const TanStackRouterVite = tanstackRouter;
export default tanstackRouter;

# Creating a binding package

Bindings are pnpm workspace projects at `packages/<group>/<library>`.

## Expected layout

```text
packages/<group>/<library>/
├── src/
│   ├── tags/
│   │   └── ...
│   └── index.ts              # optional non-tag utilities and public types
├── test/
├── CHANGELOG.md
├── README.md
├── marko.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Use a package-level `marko.json` to make the tag library explicit:

```json
{
  "taglibId": "@marko-bindings/library",
  "tagsDir": "./src/tags"
}
```

## Package contract

A typical manifest starts with the following shape. Replace `library` and its version range with the real upstream package.

```json
{
  "name": "@marko-bindings/library",
  "version": "0.0.0",
  "description": "Marko 6 bindings for library",
  "type": "module",
  "files": ["src", "marko.json", "README.md", "CHANGELOG.md"],
  "scripts": {
    "build": "marko-type-check",
    "test": "vitest run",
    "typecheck": "marko-type-check"
  },
  "peerDependencies": {
    "library": "^1.0.0",
    "marko": "^6.3.20"
  },
  "devDependencies": {
    "@marko/testing-library": "catalog:",
    "@marko/type-check": "catalog:",
    "@marko/vite": "catalog:",
    "library": "^1.0.0",
    "marko": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:",
    "vitest": "catalog:"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

Extend the shared TypeScript defaults:

```json
{
  "extends": "../../../tsconfig.base.json",
  "include": ["src", "test", "vite.config.ts"]
}
```

## API design checklist

- Can a consumer use the main path entirely from Marko markup?
- Are tag parameters more expressive than callback-heavy configuration?
- Is state passed through an explicit owner/provider rather than a hidden singleton?
- Does teardown happen when the owning tag leaves the document?
- Does SSR avoid browser globals and produce useful output?
- Are upstream types reused instead of copied?
- Can consumers access an escape hatch without making it the primary API?

## Testing

Use `@marko/testing-library` for observable behavior. Cover the package's integration boundary, not the upstream library's internals. At minimum, test initial rendering, reactive updates, and cleanup. Add server-rendering tests whenever the package claims SSR support.

## Releasing

Add a changeset with `pnpm changeset`. Packages are independently versioned; only include packages whose published behavior changed.

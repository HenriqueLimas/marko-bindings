# Developer Experience

Friction in builds, tests, tooling, or repository workflows. Format and rules: [README.md](README.md).

## marko-bindings: Make pnpm validation commands non-interactive after dependency changes

`.npmrc:1` | 2026-07-24 | impact:low | effort:low

After adding a workspace package and changing the lockfile, an ordinary
`pnpm --filter <package> typecheck` triggered an implicit install and aborted
with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. Setting `CI=true` made the
command non-interactive, but also enabled frozen-lockfile behavior during the
preceding install. A later `--offline --frozen-lockfile` verification still
purged `node_modules` and attempted registry requests while checking
supply-chain policy. Investigate pnpm's dependency verification, module-purge,
and policy-check settings and document or configure one repository-safe
non-interactive workflow for agents and CI.

## marko-bindings: Repair the local npm cache ownership used by packaging checks

`package.json:1` | 2026-07-24 | impact:low | effort:low

`npm pack --dry-run` failed before inspecting the new package because
`~/.npm/_cacache` contains root-owned files. Overriding `npm_config_cache` with a
temporary writable directory allowed the packaging check to pass. Repair the
local npm cache ownership using npm's suggested `chown` command so ordinary npm
diagnostics work without per-command cache overrides.

# Agent Feedback

Actionable observations that were out of scope for the task that surfaced them. If something is in scope, fix it instead of recording it here.

## Categories

- suspected bugs → `bugs.md`
- duplication, inconsistencies, and follow-up features → `cleanup.md`
- performance opportunities → `perf.md`
- build, test, and workflow friction → `dx.md`
- unclear behavior or design decisions → `unclear.md`

## Rules

1. Search the category file before adding an entry.
2. Include the affected package name in the heading because this is a monorepo.
3. Make entries self-contained with paths, reasoning, and a concrete direction.
4. Append entries to the end of the category file.
5. Delete entries when resolved; git history is the archive.

## Entry format

```md
## <package-name>: <one-line imperative summary>

`<primary/file/path:line>` | YYYY-MM-DD | impact:<low|med|high> | effort:<low|med|high>

<The problem, why it matters, and a concrete suggested direction in 2–6 sentences.>
```

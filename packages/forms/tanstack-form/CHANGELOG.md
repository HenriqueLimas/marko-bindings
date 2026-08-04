# @marko-bindings/tanstack-form

## 0.1.0

### Minor Changes

- 6282cd3: Add typed field-array actions and `mode="array"` structural subscriptions to `<const-field>`, preserving indexed field metadata across inserts, removals, replacements, moves, swaps, and clears.
- f12e5f5: Make `field.state.value` a writable Marko binding so native inputs can use `value:=` and `checked:=`, while retaining `field.handleChange` as an imperative escape hatch.
- 9068ca2: Add the initial TanStack Form binding with lifecycle-owned `<const-form>` and `<const-field>` declarations, reactive resumable state facades, validation, submission, reset, and SSR defaults.

## 0.0.0

Initial development version.

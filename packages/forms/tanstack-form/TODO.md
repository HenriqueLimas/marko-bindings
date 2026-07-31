# TanStack Form binding TODO

The current binding covers the core form and field lifecycle, but does not yet
provide complete TanStack Form coverage.

## Highest priority

- [x] **Field arrays**
  - Expose reactive structural actions on the field facade.
  - Support declarative indexed `<const-field>` lifecycles and `mode="array"`.
  - Cover index changes and field cleanup in tests and the runnable example.

- [ ] **Native control ergonomics**
  - Establish idiomatic patterns for select, multi-select, radio, numeric, and
    file inputs.
  - Avoid requiring direct core API access for standard native controls.
  - Test controlled values and type conversions for each control.

- [ ] **Schema validation**
  - Verify Standard Schema integrations such as Zod and Valibot across SSR and
    browser resumption.
  - Define a reconstructable input pattern for schema instances that contain
    non-serializable functions.
  - Add server and browser tests for synchronous and asynchronous schemas.

- [ ] **Additional safe facade actions**
  - Field facade: add `reset` and `validate`.
  - Form facade: add `resetField`, `validate`, and `getAllErrors`.
  - Expose resumable wrappers only for common template operations rather than
    duplicating the complete imperative API.

- [ ] **Form and field groups**
  - Add declarative lifecycle bindings for TanStack's `FormGroupApi` and
    `FieldGroupApi`.
  - Cover nested validation and reusable form sections.

- [ ] **Server submission and validation**
  - Design integration with Marko Run handlers or actions.
  - Support native form submission before browser resumption.
  - Restore server validation errors into reactive form state.

## Later improvements

- [ ] Add selector-based state subscriptions for large-form performance.
- [ ] Investigate TanStack Form Devtools integration.
- [ ] Document patterns for reusable preconfigured fields and form sections.
- [ ] Expand browser lifecycle coverage for async cancellation, option changes,
      conditional fields, and field replacement.

## Already covered

- Nested field names and conditional field declarations
- Synchronous, asynchronous, dynamic, and linked-field validation options
- Form and field listeners
- Submission metadata and invalid-submit callbacks
- Default state, reset, and reactive metadata
- Server-rendered initial state and browser reconstruction

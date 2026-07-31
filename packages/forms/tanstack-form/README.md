# @marko-bindings/tanstack-form

TanStack Form bindings for Marko 6. The package owns and re-exports
`@tanstack/form-core`, so applications only need this package and its `marko`
peer dependency.

## Install

```sh
pnpm add @marko-bindings/tanstack-form
```

## Form and field declarations

`<const-form>` owns the form lifecycle and returns reactive form state plus
submission and reset actions. `<const-field>` owns one field lifecycle and
returns its reactive state and input handlers. Neither tag renders DOM.

```marko
<const-form/form
  defaultValues={ firstName: "" }
  onSubmit=({ value }) => console.log(value)
/>

<const-field/firstName
  form=form
  name="firstName"
  validators={
    onBlur: ({ value }) =>
      value.length < 3 ? "First name is too short" : undefined,
  }
/>

<form onSubmit(event) {
  event.preventDefault();
  void form.handleSubmit();
}>
  <label for=firstName.name>First name</label>
  <input
    id=firstName.name
    name=firstName.name
    value:=firstName.state.value
    onBlur=firstName.handleBlur
  >

  <for|error| of=firstName.state.meta.errors>
    <p>${error}</p>
  </for>

  <button type="submit" disabled=!form.state.canSubmit>
    ${form.state.isSubmitting ? "Submitting…" : "Submit"}
  </button>
  <button
    type="button"
    onClick() {
      form.reset();
    }
  >
    Reset
  </button>
</form>
```

`field.state.value` is a writable Marko binding. The `:=` shorthand keeps the
native input controlled and delegates changes to TanStack's `handleChange`.
`field.handleChange` remains available for imperative updates. Checkboxes use
the corresponding checked binding:

```marko
<input type="checkbox" checked:=accepted.state.value onBlur=accepted.handleBlur>
```

Fields support TanStack's deep names and can be declared conditionally. Removing
`<const-field>` unmounts its `FieldApi` and cancels its field-owned work.

## Field arrays

An array is a regular field whose facade also exposes TanStack's typed structural
actions. Declare indexed child fields in the markup so each item owns its field
lifecycle:

```marko
<const-form/form defaultValues={ people: [] as Array<{ name: string }> }/>
<const-field/people form=form name="people" mode="array"/>

<for|_person, index| of=people.state.value by=(_person, index) => String(index)>
  <const-field/name form=form name=`people[${index}].name`/>
  <input value:=name.state.value>
  <button
    type="button"
    onClick() {
      people.removeValue(index);
    }
  >
    Remove
  </button>
</for>

<button
  type="button"
  onClick() {
    people.pushValue({ name: "" });
  }
>
  Add person
</button>
```

The facade provides `pushValue`, `insertValue`, `replaceValue`, `removeValue`,
`swapValues`, `moveValue`, and `clearValues`. These actions preserve TanStack's
indexed field metadata and validation behavior. They accept the same optional
update metadata argument as the core methods.

`mode="array"` is a subscription optimization, not an array declaration. It
updates the outer field for structural changes and its own metadata while child
fields react independently to nested value changes. Render editable nested
properties through indexed `<const-field>` declarations as shown above. Reconcile
the `<for>` by index because TanStack shifts values and field metadata against
those indexed paths during structural actions.

## Core escape hatch

`form.api()` and `field.api()` return their reconstructed TanStack core API
instances in the browser. Prefer the reactive facade for rendering. Core API
instances are intentionally not serialized and the escape hatch must not be
called during server rendering.

## Server rendering

Server rendering creates temporary core instances only to obtain plain initial
state. The live `FormApi` and `FieldApi` instances are reconstructed and mounted
in the browser, while inline and Marko-module validator functions resume with
the form options.

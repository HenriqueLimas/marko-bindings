# TanStack Form registration with Marko Run

This example uses `@marko-bindings/tanstack-form` to build a server-rendered,
resumable workshop registration form. It demonstrates:

- reactive form state and submission with `<const-form>`;
- deep field names, synchronous and asynchronous validation with
  `<const-field>`;
- controlled text and checkbox inputs through Marko's `:=` binding, plus the
  imperative field handler for a native select;
- a conditional guest field whose TanStack lifecycle follows its markup; and
- reset and simulated asynchronous submission actions from the plain form
  facade.

```sh
pnpm --filter @marko-bindings/example-tanstack-form dev
```

Open <http://localhost:3000>, edit the registration, and watch the live state
preview update. Blur the email field to run its asynchronous availability check;
`ada@example.com` demonstrates the unavailable-address result. Enabling “Bring
a guest” declaratively mounts the guest-name field, and disabling it unmounts
the field again.

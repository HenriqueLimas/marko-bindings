import { createAtom, createStore } from "marko-tanstack-store";

interface CartItem {
  id: number;
  name: string;
  detail: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  total: number;
}

export const cartStore = createStore(
  {
    items: [
      {
        id: 1,
        name: "Field Notes Set",
        detail: "Three stitched notebooks",
        price: 14,
        quantity: 2,
      },
      {
        id: 2,
        name: "Brass Desk Clip",
        detail: "Solid brass, hand finished",
        price: 18,
        quantity: 1,
      },
      {
        id: 3,
        name: "Canvas Pencil Case",
        detail: "Natural canvas with zip closure",
        price: 24,
        quantity: 1,
      },
    ],
  } satisfies CartState,
  ({ setState }) => ({
    increment(id: number) {
      setState((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      }));
    },
    decrement(id: number) {
      setState((state) => ({
        items: state.items.map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item,
        ),
      }));
    },
    remove(id: number) {
      setState((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    },
  }),
);

export const memberAtom = createAtom(false);

export const summaryStore = createStore(() => {
  const subtotal = cartStore
    .get()
    .items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = memberAtom.get() ? subtotal * 0.1 : 0;

  return {
    subtotal,
    discount,
    total: subtotal - discount,
  } satisfies CartSummary;
});

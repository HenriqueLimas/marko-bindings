import { gql, type TypedDocumentNode } from "marko-apollo-client";

export interface TickSubscription {
  tick: number;
}

export const TICK_SUBSCRIPTION: TypedDocumentNode<TickSubscription> = gql`
  subscription Tick {
    tick
  }
`;

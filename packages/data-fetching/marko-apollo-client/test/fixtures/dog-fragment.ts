import { gql, type TypedDocumentNode } from "marko-apollo-client";

import type { DogFragment } from "./const-fragment.marko";

export const DOG_FRAGMENT: TypedDocumentNode<DogFragment> = gql`
  fragment DogFields on Dog {
    id
    name
  }
`;

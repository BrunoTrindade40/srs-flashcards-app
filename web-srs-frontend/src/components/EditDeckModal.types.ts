import type { GetDeckDetailsQuery } from "../gql/graphql";

type DeckDetails = NonNullable<GetDeckDetailsQuery["deck"]>;

export interface EditDeckModalProps {
  onClose: () => void;
  deck: DeckDetails;
}

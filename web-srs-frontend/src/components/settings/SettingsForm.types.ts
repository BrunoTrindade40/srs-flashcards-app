import type { GetMeQuery } from "../../gql/graphql";

// Extração Estrutural Estrita (Duck Typing) movida para o contexto lógico
export type UserSettings = NonNullable<GetMeQuery["me"]>;

export interface SettingsFormProps {
  initialData: UserSettings;
  onClose: () => void;
}

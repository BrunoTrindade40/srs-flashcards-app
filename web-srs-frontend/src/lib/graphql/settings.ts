import { gql, type TypedDocumentNode } from "@apollo/client/core";

export interface UserSettings {
  id: string;
  dailyNewCardLimit: number;
  maxDailyReviews: number;
  timezone: string;
}

export interface GetMeResponse {
  me: UserSettings;
}

export const GET_ME: TypedDocumentNode<GetMeResponse, Record<string, never>> = gql`
  query GetMe {
    me {
      id
      dailyNewCardLimit
      maxDailyReviews
      timezone
    }
  }
`;

export interface UpdateMySettingsInput {
  dailyNewCardLimit?: number;
  maxDailyReviews?: number;
  timezone?: string;
}

export interface UpdateMySettingsResponse {
  updateMySettings: UserSettings;
}

export interface UpdateMySettingsVariables {
  data: UpdateMySettingsInput;
}

export const UPDATE_MY_SETTINGS: TypedDocumentNode<
  UpdateMySettingsResponse,
  UpdateMySettingsVariables
> = gql`
  mutation UpdateMySettings($data: UpdateUserSettingsInput!) {
    updateMySettings(data: $data) {
      id
      dailyNewCardLimit
      maxDailyReviews
      timezone
    }
  }
`;

export interface AnonymizeMeResponse {
  anonymizeMe: boolean;
}

export const ANONYMIZE_ME: TypedDocumentNode<
  AnonymizeMeResponse,
  Record<string, never>
> = gql`
  mutation AnonymizeMe {
    anonymizeMe
  }
`;
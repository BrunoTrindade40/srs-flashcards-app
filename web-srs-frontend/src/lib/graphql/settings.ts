import { gql, type TypedDocumentNode } from "@apollo/client/core";

// Tipagem estrutural limpa e idêntica ao Schema do Prisma/NestJS
export interface UserSettings {
  id: string;
  name?: string | null;
  currentStreak: number;
  dailyNewCardLimit: number;
  maxDailyReviews: number;
  timezone: string;
  dailyRolloverTime?: string | null;
}

export interface GetMeResponse {
  me: UserSettings;
}

// Query corrigida para buscar os dados de fato consumidos no Dashboard e Settings
export const GET_ME: TypedDocumentNode<GetMeResponse, Record<string, never>> = gql`
  query GetMe {
    me {
      id
      name
      currentStreak
      dailyNewCardLimit
      maxDailyReviews
      timezone
      dailyRolloverTime
    }
  }
`;

export interface UpdateMySettingsInput {
  dailyNewCardLimit?: number;
  maxDailyReviews?: number;
  timezone?: string;
  dailyRolloverTime?: string;
}

export interface UpdateMySettingsResponse {
  updateMySettings: UserSettings;
}

export interface UpdateMySettingsVariables {
  data: UpdateMySettingsInput;
}

// Mutação corrigida para contemplar a RN06 (Rollover)
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
      dailyRolloverTime
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
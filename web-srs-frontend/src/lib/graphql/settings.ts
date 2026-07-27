import { gql, type TypedDocumentNode } from '@apollo/client/core';

export interface UserSettings {
  id: string;
  dailyNewCardLimit: number;
  maxDailyReviews: number;
  timezone: string;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
}

// --- QUERY: Get Me (Obter usuário logado, configurações e métricas de gamificação) ---
export interface GetMeResponse {
  me: UserSettings;
}

export const GET_ME: TypedDocumentNode<
  GetMeResponse,
  Record<string, never>
> = gql`
  query GetMe {
    me {
      id
      dailyNewCardLimit
      maxDailyReviews
      timezone
      totalXp
      currentStreak
      longestStreak
    }
  }
`;

// --- MUTATION: Update Settings ---
export interface UpdateMySettingsResponse {
  updateMySettings: UserSettings;
}

export interface UpdateMySettingsVariables {
  data: {
    dailyNewCardLimit?: number;
    maxDailyReviews?: number;
    timezone?: string;
  };
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
      totalXp
      currentStreak
      longestStreak
    }
  }
`;
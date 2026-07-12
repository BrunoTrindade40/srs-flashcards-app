// src/lib/graphql/settings.ts
import { gql } from '@apollo/client';

// 1. Tipagens Estritas ancoradas na tabela User
export interface UserSettings {
  dailyNewCardLimit: number;
  maxDailyReviews: number;
}

export interface GetSettingsResponse {
  me: UserSettings; // O backend retorna o próprio User logado
}

export interface UpdateSettingsResponse {
  updateMySettings: UserSettings; // Mutation real exposta pelo backend
}

export interface UpdateSettingsVariables {
  data: {
    dailyNewCardLimit: number;
    maxDailyReviews: number;
  };
}

// 2. Operações GraphQL reais do seu Backend
export const GET_SETTINGS = gql`
  query GetSettings {
    me {
      dailyNewCardLimit
      maxDailyReviews
    }
  }
`;

export const UPDATE_SETTINGS = gql`
  mutation UpdateMySettings($data: UpdateUserSettingsInput!) {
    updateMySettings(data: $data) {
      dailyNewCardLimit
      maxDailyReviews
    }
  }
`;
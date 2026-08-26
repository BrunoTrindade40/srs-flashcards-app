// Padrão Estrito: Utilização exclusiva da função gerada pelo GraphQL Codegen Client Preset
import { graphql } from "../../gql";

export const GET_ME = graphql(`
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
`);

export const UPDATE_MY_SETTINGS = graphql(`
  mutation UpdateMySettings($data: UpdateUserSettingsInput!) {
    updateMySettings(data: $data) {
      id
      dailyNewCardLimit
      maxDailyReviews
      timezone
      dailyRolloverTime
    }
  }
`);

export const ANONYMIZE_ME = graphql(`
  mutation AnonymizeMe {
    anonymizeMe
  }
`);
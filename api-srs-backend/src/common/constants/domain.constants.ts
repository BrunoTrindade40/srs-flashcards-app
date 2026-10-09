export const ANONYMIZED_PAYLOAD = '[DADO_ANONIMIZADO]';

// 🔴 CORREÇÃO CRÍTICA: Aplicação do Padrão "as const"
// Substitui os Enums nativos banidos do Prisma, mantendo o JavaScript (bundle) minificado.
export const STUDY_MODE = {
  STANDARD: 'STANDARD',
  CHAOS: 'CHAOS',
} as const;

export type StudyModeType = typeof STUDY_MODE[keyof typeof STUDY_MODE];

export const DEVICE_TYPE = {
  PWA: 'PWA',
  IOT: 'IOT',
  WEB: 'WEB',
} as const;

export type DeviceTypeEnum = typeof DEVICE_TYPE[keyof typeof DEVICE_TYPE];

export const ENROLLMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  DROPPED: 'DROPPED',
} as const;
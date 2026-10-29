export type PlanFeature =
  | 'devices'
  | 'brandedSharing'
  | 'teamFolders'
  | 'accessControl'
  | 'groupsRoles'
  | 'administration'
  | 'encryption'
  | 'compliance'
  | 'sso';

export interface PricingPlan {
  id: 'plus' | 'standard' | 'advanced';
  name: string;
  monthlyPrice: number;
  billing: 'account' | 'user';
  minimumUsers: number;
  storageTb: number;
  recoveryDays: number;
  features: readonly PlanFeature[];
}

export const plans: readonly PricingPlan[] = [
  {
    id: 'plus',
    name: 'Plus',
    monthlyPrice: 9.99,
    billing: 'account',
    minimumUsers: 1,
    storageTb: 2,
    recoveryDays: 30,
    features: ['devices'],
  },
  {
    id: 'standard',
    name: 'Standard',
    monthlyPrice: 12,
    billing: 'user',
    minimumUsers: 1,
    storageTb: 3,
    recoveryDays: 180,
    features: [
      'devices',
      'brandedSharing',
      'teamFolders',
      'accessControl',
      'groupsRoles',
      'administration',
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    monthlyPrice: 18,
    billing: 'user',
    minimumUsers: 3,
    storageTb: 15,
    recoveryDays: 365,
    features: [
      'devices',
      'brandedSharing',
      'teamFolders',
      'accessControl',
      'groupsRoles',
      'administration',
      'encryption',
      'compliance',
      'sso',
    ],
  },
];

export const comparisonFeatures: readonly PlanFeature[] = [
  'devices',
  'brandedSharing',
  'teamFolders',
  'accessControl',
  'groupsRoles',
  'administration',
  'encryption',
  'compliance',
  'sso',
];

export function formatEuro(amount: number, locale: 'en' | 'ru') {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

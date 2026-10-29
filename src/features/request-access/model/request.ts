export const requestLimits = {
  name: 100,
  organization: 160,
  needs: 1000,
  email: 254,
} as const;

export interface AccessRequest {
  name: string;
  email: string;
  organization?: string;
  needs: string;
  consent: boolean;
}

export function isAccessRequest(value: unknown): value is AccessRequest {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const text = (key: string, limit: number, required: boolean) => {
    const field: unknown = Reflect.get(value, key);

    return (
      (!required && field === undefined) ||
      (typeof field === 'string' &&
        field.length <= limit &&
        (!required || field.trim().length > 0))
    );
  };

  return (
    text('name', requestLimits.name, true) &&
    text('email', requestLimits.email, true) &&
    text('organization', requestLimits.organization, false) &&
    text('needs', requestLimits.needs, true) &&
    'email' in value &&
    typeof value.email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim()) &&
    'consent' in value &&
    value.consent === true
  );
}

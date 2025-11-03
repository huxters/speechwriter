export interface Policy {
  id: string;
  name: string;
  rules: PolicyRule[];
}

export interface PolicyRule {
  action: string;
  resource: string;
  conditions?: Record<string, unknown>;
}

export function canAccess(policy: Policy, action: string, resource: string): boolean {
  return policy.rules.some(
    (rule) => rule.action === action && rule.resource === resource
  );
}


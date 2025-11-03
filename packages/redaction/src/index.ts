export interface RedactionRule {
  pattern: RegExp | string;
  replacement: string;
}

export function redactText(text: string, rules: RedactionRule[]): string {
  let result = text;
  for (const rule of rules) {
    const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'g') : rule.pattern;
    result = result.replace(pattern, rule.replacement);
  }
  return result;
}

export function redactEmail(text: string): string {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return text.replace(emailPattern, '[REDACTED]');
}


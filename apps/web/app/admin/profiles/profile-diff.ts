export interface DiffRow {
  path: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toTitleCase(value: string) {
  return value
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replaceAll('.', ' / ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => formatValue(item)).join(', ') : 'Not provided';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'string') {
    return value.trim() || 'Not provided';
  }
  if (isPlainObject(value)) {
    return Object.keys(value).length > 0 ? JSON.stringify(value) : 'Not provided';
  }
  return Object.prototype.toString.call(value);
}

function flattenSnapshot(
  value: unknown,
  prefix = '',
  output = new Map<string, unknown>(),
): Map<string, unknown> {
  if (Array.isArray(value) || !isPlainObject(value)) {
    output.set(prefix || 'value', value);
    return output;
  }

  const entries = Object.entries(value);
  if (entries.length === 0 && prefix) {
    output.set(prefix, value);
    return output;
  }

  for (const [key, nested] of entries) {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(nested) || !isPlainObject(nested)) {
      output.set(nextPath, nested);
      continue;
    }
    flattenSnapshot(nested, nextPath, output);
  }

  return output;
}

export function buildProfileDiffRows(previous: unknown, current: unknown): DiffRow[] {
  const previousMap = flattenSnapshot(previous ?? {});
  const currentMap = flattenSnapshot(current ?? {});
  const allPaths = Array.from(new Set([...previousMap.keys(), ...currentMap.keys()])).sort((left, right) =>
    left.localeCompare(right),
  );

  return allPaths
    .map((path) => {
      const beforeValue = previousMap.get(path);
      const afterValue = currentMap.get(path);
      const before = formatValue(beforeValue);
      const after = formatValue(afterValue);
      return {
        path,
        label: toTitleCase(path),
        before,
        after,
        changed: before !== after,
      };
    })
    .filter((row) => row.changed);
}

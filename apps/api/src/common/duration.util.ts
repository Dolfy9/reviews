export function durationToMs(input: string): number {
  const match = input.trim().match(/^(\d+)([smhdw]?)$/);
  if (!match) {
    throw new Error(`Invalid duration: ${input}`);
  }

  const msPerUnit: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };

  const value = Number(match[1]);
  const unit = match[2];

  if (!unit) {
    return value;
  }

  if (msPerUnit[unit] === undefined) {
    throw new Error(`Invalid duration unit: ${unit}`);
  }

  return value * msPerUnit[unit];
}

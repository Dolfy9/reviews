export function serializeDate<T extends { createdAt: Date; updatedAt: Date }>(
  entity: T,
): Omit<T, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
} {
  return {
    ...entity,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

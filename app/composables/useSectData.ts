export type SectRow = {
  id: number;
  name: string | null;
  legacy_id: number | null;
  legacy_name: string | null;
};

export type SectFindQuery =
  | { id: number }
  | { name: string }
  | { legacyId: number }
  | { legacyName: string };

const sectFindCache = new Map<string, SectRow | null>();

export function useSectData() {
  const { queryRows } = useWikiDb();

  async function querySect(field: "id" | "name" | "legacy_id" | "legacy_name", value: number | string) {
    const sql = `SELECT id, name, legacy_id, legacy_name FROM sects WHERE ${field} = ? LIMIT 1`;
    const rows = await queryRows<SectRow>(sql, [value]);
    return rows[0] || null;
  }

  async function findSect(query: SectFindQuery) {
    const field = "id" in query
      ? "id"
      : "legacyId" in query
        ? "legacy_id"
        : "legacyName" in query
          ? "legacy_name"
          : "name";
    const rawValue = "id" in query
      ? query.id
      : "legacyId" in query
        ? query.legacyId
        : "legacyName" in query
          ? query.legacyName
          : query.name;
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
    if (value === "") return null;

    const cacheKey = `${field}:${value}`;
    if (sectFindCache.has(cacheKey)) return sectFindCache.get(cacheKey) || null;

    const sect = await querySect(field, value);
    sectFindCache.set(cacheKey, sect);
    return sect;
  }

  return {
    findSect,
  };
}

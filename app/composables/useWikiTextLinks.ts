import type { WikiNameMap } from "~/lib/wiki/text";

type LinkKind = "characters" | "items" | "martialArts";
type NameRow = { id: number; name: string | null };

const cache: Partial<Record<LinkKind, Promise<WikiNameMap>>> = {};

const TABLES: Record<LinkKind, string> = {
  characters: "characters",
  items: "items",
  martialArts: "martial_arts",
};

export function useWikiTextLinks() {
  const { queryRows } = useWikiDb();

  function loadWikiTextLinkNames(kind: LinkKind) {
    cache[kind] ||= queryRows<NameRow>(`SELECT id, name FROM ${TABLES[kind]} ORDER BY id`)
      .then((rows) => Object.fromEntries(rows.map((row) => [String(row.id), row.name])));
    return cache[kind];
  }

  return { loadWikiTextLinkNames };
}

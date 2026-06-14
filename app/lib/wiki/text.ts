export type WikiEnums = Record<string, Record<string, string | null>>;
export type WikiNameMap = Record<string, string | null>;

export type WikiTextPart =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "character"; id: number; text: string }
  | { type: "martialArt"; id: number; text: string }
  | { type: "item"; id: number; text: string };

export function wikiText(text: string): WikiTextPart {
  return { type: "text", text };
}

export function wikiStrong(text: string): WikiTextPart {
  return { type: "strong", text };
}

export function wikiCharacter(id: number, text: string): WikiTextPart {
  return { type: "character", id, text };
}

export function wikiMartialArt(id: number, text: string): WikiTextPart {
  return { type: "martialArt", id, text };
}

export function wikiItem(id: number, text: string): WikiTextPart {
  return { type: "item", id, text };
}

export function wikiPartsToText(parts: WikiTextPart[]) {
  return parts.map((part) => part.text).join("");
}

export function joinWikiPartGroups(groups: WikiTextPart[][], separator: string) {
  return groups.flatMap((group, index) => (index === 0 ? group : [wikiText(separator), ...group]));
}

type WikiLinkEntry = {
  id: number;
  label: string;
  part: (id: number, text: string) => WikiTextPart;
};

function nameMapLinkEntries(
  names: WikiNameMap | null | undefined,
  part: (id: number, text: string) => WikiTextPart,
) {
  return Object.entries(names || {})
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([id, label]) => ({ id: Number(id), label, part }))
    .filter((item) => Number.isFinite(item.id) && item.label.length > 1);
}

export function linkWikiEntriesInText(text: string | null | undefined, entries: WikiLinkEntry[]) {
  const source = text || "";
  if (!source) return [];

  const sortedEntries = [...entries]
    .sort((a, b) => b.label.length - a.label.length || a.id - b.id);

  const parts: WikiTextPart[] = [];
  let pending = "";
  let index = 0;

  while (index < source.length) {
    const match = sortedEntries.find((item) => source.startsWith(item.label, index));
    if (!match) {
      pending += source[index];
      index += 1;
      continue;
    }

    if (pending) {
      parts.push(wikiText(pending));
      pending = "";
    }
    parts.push(match.part(match.id, match.label));
    index += match.label.length;
  }

  if (pending) parts.push(wikiText(pending));
  return parts;
}

export async function linkCharactersInText(text: string | null | undefined) {
  const { loadWikiTextLinkNames } = useWikiTextLinks();
  const names = await loadWikiTextLinkNames("characters");
  return linkWikiEntriesInText(text, nameMapLinkEntries(names, wikiCharacter));
}

export async function linkMartialArtsInText(text: string | null | undefined) {
  const { loadWikiTextLinkNames } = useWikiTextLinks();
  const names = await loadWikiTextLinkNames("martialArts");
  return linkWikiEntriesInText(text, nameMapLinkEntries(names, wikiMartialArt));
}

export async function linkItemsInText(text: string | null | undefined) {
  const { loadWikiTextLinkNames } = useWikiTextLinks();
  const names = await loadWikiTextLinkNames("items");
  return linkWikiEntriesInText(text, nameMapLinkEntries(names, wikiItem));
}

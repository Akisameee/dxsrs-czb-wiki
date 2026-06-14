import { enumMapFromRows } from "~/lib/utils";
import type { WikiEnums } from "~/lib/wiki/text";

type EnumRow = { type: string; id: number; label: string | null };

let enumsPromise: Promise<WikiEnums> | null = null;

export function useWikiEnums() {
  const { queryRows } = useWikiDb();

  function loadWikiEnums() {
    enumsPromise ||= queryRows<EnumRow>("SELECT type, id, label FROM enums ORDER BY type, id")
      .then((rows) => enumMapFromRows(rows));
    return enumsPromise;
  }

  return { loadWikiEnums };
}

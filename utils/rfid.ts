export const TAG_LOOKUP_TABLE = process.env.NEXT_PUBLIC_RFID_LOOKUP_TABLE || "rfid_tags";
export const TAG_COLUMN = process.env.NEXT_PUBLIC_RFID_TAG_COLUMN || "tag";
export const NAME_COLUMN = process.env.NEXT_PUBLIC_RFID_NAME_COLUMN || "name";

export type TagMap = Record<string, string>;
type RFIDRow = Record<string, unknown>;

export function normalizeTag(tag: unknown): string {
  if (tag === null || tag === undefined) return "";
  const str = String(tag).trim();
  return str;
}

export function rowsToTagMap(rows: RFIDRow[]): TagMap {
  const map: TagMap = {};
  rows.forEach((row: RFIDRow) => {
    const tagValue = row?.[TAG_COLUMN];
    const nameValue = row?.[NAME_COLUMN];

    const tagIsValid = typeof tagValue === "string" || typeof tagValue === "number";
    const nameIsValid = typeof nameValue === "string" || typeof nameValue === "number";

    if (!tagIsValid || !nameIsValid) return;

    const raw = normalizeTag(tagValue);
    const name = String(nameValue);
    map[raw] = name;

    const noZeros = raw.replace(/^0+/, "");
    if (noZeros && noZeros !== raw) {
      map[noZeros] = name;
    }
  });
  return map;
}

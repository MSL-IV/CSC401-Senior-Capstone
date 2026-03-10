export const TAG_LOOKUP_TABLE = process.env.NEXT_PUBLIC_RFID_LOOKUP_TABLE || "rfid_tags";
export const TAG_COLUMN = process.env.NEXT_PUBLIC_RFID_TAG_COLUMN || "tag";
export const NAME_COLUMN = process.env.NEXT_PUBLIC_RFID_NAME_COLUMN || "name";

export type TagMap = Record<string, string>;

export function normalizeTag(tag: unknown): string {
  if (tag === null || tag === undefined) return "";
  const str = String(tag).trim();
  // Common RFID dumps may include spaces or leading zeros; keep the raw string as-is,
  // but also strip leading zeros for a secondary key.
  return str;
}

export function rowsToTagMap(rows: any[]): TagMap {
  const map: TagMap = {};
  rows.forEach((row) => {
    const tagValue = row?.[TAG_COLUMN];
    const nameValue = row?.[NAME_COLUMN];
    if (tagValue && nameValue) {
      const raw = normalizeTag(tagValue);
      const name = String(nameValue);
      map[raw] = name;
      // Also store a version without leading zeros to handle numeric scans
      const noZeros = raw.replace(/^0+/, "");
      if (noZeros && noZeros !== raw) {
        map[noZeros] = name;
      }
    }
  });
  return map;
}

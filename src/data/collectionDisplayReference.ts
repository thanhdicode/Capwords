export const collectionCountCopy = {
  singular: "Word",
  plural: "Words",
  source033Snapshot: "1 Words",
} as const;

export function formatCollectionWordCount(
  count: number,
  unitOverride?: string,
): string {
  const unit =
    unitOverride ??
    (count === 1 ? collectionCountCopy.singular : collectionCountCopy.plural);
  return `${count} ${unit}`;
}

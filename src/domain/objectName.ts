import type { NewWord } from "./types";

export type ObjectName = Pick<NewWord, "target" | "native">;

/** Null means incomplete or unchanged. Recognition-backed renames keep meaning. */
export function commitObjectNameDraft(
  draft: ObjectName,
  initial: ObjectName,
  manual: boolean,
): ObjectName | null {
  const target = draft.target.trim();
  const native = manual ? draft.native.trim() : initial.native;
  if (!target || (manual && !native)) return null;
  if (
    target === initial.target.trim() &&
    (!manual || native === initial.native.trim())
  )
    return null;
  return { target, native };
}

import test from "node:test";
import assert from "node:assert/strict";
import { commitObjectNameDraft } from "../src/domain/objectName";

const original = { target: "La Fleur", native: "Flower" };

test("recognized renames reject blank/unchanged names and preserve meaning", () => {
  assert.equal(
    commitObjectNameDraft({ target: "  ", native: "Ignored" }, original, false),
    null,
  );
  assert.equal(
    commitObjectNameDraft(
      { target: " La Fleur ", native: "Ignored" },
      original,
      false,
    ),
    null,
  );
  assert.deepEqual(
    commitObjectNameDraft(
      { target: " Tulipe ", native: "Ignored" },
      original,
      false,
    ),
    { target: "Tulipe", native: "Flower" },
  );
});

test("manual photo labels require both target and meaning", () => {
  for (const draft of [
    { target: "Objet", native: "  " },
    { target: " ", native: "Object" },
    { target: "", native: "" },
  ]) {
    assert.equal(
      commitObjectNameDraft(draft, { target: "New word", native: "" }, true),
      null,
    );
  }
});

test("manual names trim both fields and allow a meaning-only correction", () => {
  assert.deepEqual(
    commitObjectNameDraft(
      { target: " Objet ", native: " Object " },
      original,
      true,
    ),
    { target: "Objet", native: "Object" },
  );
  assert.deepEqual(
    commitObjectNameDraft(
      { target: "La Fleur", native: "A flower" },
      original,
      true,
    ),
    { target: "La Fleur", native: "A flower" },
  );
  assert.equal(
    commitObjectNameDraft(
      { target: " La Fleur ", native: " Flower " },
      original,
      true,
    ),
    null,
  );
});

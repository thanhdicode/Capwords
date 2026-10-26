import assert from "node:assert/strict";
import test from "node:test";
import { speechVoiceMatchesLanguage } from "../src/domain/speechVoice";

test("speech voices match complete or base language tags without crossing locales", () => {
  assert.equal(speechVoiceMatchesLanguage("ko-KR", "ko"), true);
  assert.equal(speechVoiceMatchesLanguage("en_US", "en-GB"), false);
  assert.equal(speechVoiceMatchesLanguage("en-GB", "en"), true);
  assert.equal(speechVoiceMatchesLanguage("en", "en-GB"), true);
  assert.equal(speechVoiceMatchesLanguage("fr-FR", "ko"), false);
  assert.equal(speechVoiceMatchesLanguage("ko-KR", ""), false);
});

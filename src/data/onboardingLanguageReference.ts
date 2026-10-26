export const onboardingLanguageReferences = {
  "080": {
    nativeLanguageCode: "en",
    logoArtwork: "source080Sticker",
  },
} as const;

export type OnboardingLanguageReference =
  (typeof onboardingLanguageReferences)[keyof typeof onboardingLanguageReferences];

export function getOnboardingLanguageReference(
  sourceId: string | null,
): OnboardingLanguageReference | undefined {
  return sourceId === "080" ? onboardingLanguageReferences["080"] : undefined;
}

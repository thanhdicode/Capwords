import { lazy } from "react";

export const WelcomeScreen = lazy(() =>
  import("../screens/OnboardingScreen").then(({ WelcomeScreen }) => ({
    default: WelcomeScreen,
  })),
);
export const IntroScreen = lazy(() =>
  import("../screens/OnboardingScreen").then(({ IntroScreen }) => ({
    default: IntroScreen,
  })),
);
export const LanguagesScreen = lazy(() =>
  import("../screens/OnboardingScreen").then(({ LanguagesScreen }) => ({
    default: LanguagesScreen,
  })),
);

export const HomeScreen = lazy(() =>
  import("../screens/HomeScreen").then(({ HomeScreen }) => ({
    default: HomeScreen,
  })),
);
export const CollectionScreen = lazy(() =>
  import("../screens/HomeScreen").then(({ CollectionScreen }) => ({
    default: CollectionScreen,
  })),
);

export const WordDetailScreen = lazy(() =>
  import("../screens/WordScreen").then(({ WordDetailScreen }) => ({
    default: WordDetailScreen,
  })),
);

export const CaptureScreen = lazy(() =>
  import("../screens/CaptureScreen").then(({ CaptureScreen }) => ({
    default: CaptureScreen,
  })),
);
export const ConfirmScreen = lazy(() =>
  import("../screens/CaptureScreen").then(({ ConfirmScreen }) => ({
    default: ConfirmScreen,
  })),
);
export const ResultScreen = lazy(() =>
  import("../screens/CaptureScreen").then(({ ResultScreen }) => ({
    default: ResultScreen,
  })),
);

export const MemoryIntroScreen = lazy(() =>
  import("../screens/ReviewScreen").then(({ MemoryIntroScreen }) => ({
    default: MemoryIntroScreen,
  })),
);
export const ReviewScreen = lazy(() =>
  import("../screens/ReviewScreen").then(({ ReviewScreen }) => ({
    default: ReviewScreen,
  })),
);
export const StreakScreen = lazy(() =>
  import("../screens/ReviewScreen").then(({ StreakScreen }) => ({
    default: StreakScreen,
  })),
);

export const ProfileScreen = lazy(() =>
  import("../screens/ProfileScreen").then(({ ProfileScreen }) => ({
    default: ProfileScreen,
  })),
);
export const PaywallScreen = lazy(() =>
  import("../screens/PaywallScreen").then(({ PaywallScreen }) => ({
    default: PaywallScreen,
  })),
);
export const StoryScreen = lazy(() =>
  import("../screens/StoryScreen").then(({ StoryScreen }) => ({
    default: StoryScreen,
  })),
);

export const WebStudio = lazy(() =>
  import("../dev/WebStudio").then(({ WebStudio }) => ({
    default: WebStudio,
  })),
);

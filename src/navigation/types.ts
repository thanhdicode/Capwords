export type RouteName =
  | "welcome"
  | "intro"
  | "languages"
  | "home"
  | "collection"
  | "camera"
  | "confirm"
  | "result"
  | "detail"
  | "examples"
  | "memoryIntro"
  | "review"
  | "reviewResult"
  | "streak"
  | "profile"
  | "paywall"
  | "story";
export type Navigate = (route: RouteName, wordId?: string) => void;

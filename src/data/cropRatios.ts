export const defaultCropRatioId = "four-three" as const;

export const cropRatioOptions = [
  { id: "original", label: "Original", aspectRatio: null },
  { id: "square", label: "Square", aspectRatio: 1 },
  { id: "three-two", label: "3:2", aspectRatio: 3 / 2 },
  { id: "five-three", label: "5:3", aspectRatio: 5 / 3 },
  { id: "four-three", label: "4:3", aspectRatio: 4 / 3 },
  { id: "five-four", label: "5:4", aspectRatio: 5 / 4 },
  { id: "seven-five", label: "7:5", aspectRatio: 7 / 5 },
  { id: "sixteen-nine", label: "16:9", aspectRatio: 16 / 9 },
] as const;

export type CropRatioId = (typeof cropRatioOptions)[number]["id"];

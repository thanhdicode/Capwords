import { Query } from "react-native-appwrite";

export type CloudQueryMethod = "limit" | "offset";

export function createCloudQuery(
  method: CloudQueryMethod,
  value: number,
): string {
  return Query[method](value);
}

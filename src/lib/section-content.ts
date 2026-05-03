import { Content } from "@prisma/client";

export function byKey(contents: Content[], key: string) {
  return contents.filter((item) => item.key === key);
}

export function firstValue(contents: Content[], key: string, fallback = "") {
  return byKey(contents, key)[0]?.value ?? fallback;
}

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

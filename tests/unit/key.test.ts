import { describe, expect, it } from "vitest";
import { extractKey, generateGardenKey, isValidKeyShape, sha256Hex } from "@/lib/key";

describe("garden keys", () => {
  it("are 32 random bytes in base64url", () => {
    const k = generateGardenKey();
    expect(k).toHaveLength(43);
    expect(isValidKeyShape(k)).toBe(true);
    expect(generateGardenKey()).not.toBe(k);
  });
  it("extracts from links", () => {
    const k = generateGardenKey();
    expect(extractKey(`https://x.vercel.app/join#k=${k}`)).toBe(k);
    expect(extractKey(k)).toBe(k);
    expect(extractKey("hello")).toBeNull();
  });
  it("hashes to hex", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

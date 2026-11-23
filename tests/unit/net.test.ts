// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isPrivateAddress, normaliseFeedUrl, safeFetchText } from "@/lib/server/net";

describe("feed safety", () => {
  it("knows private, loopback and link-local addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "0.0.0.0", "::1", "fe80::1", "fd00::1", "::ffff:127.0.0.1", "100.64.0.1"])
      expect(isPrivateAddress(ip), ip).toBe(true);
    for (const ip of ["8.8.8.8", "142.250.180.14", "2a00:1450:4009:80b::200e"]) expect(isPrivateAddress(ip), ip).toBe(false);
  });
  it("turns webcal into https and refuses other schemes", () => {
    expect(normaliseFeedUrl("webcal://p01-caldav.icloud.com/x.ics").protocol).toBe("https:");
    expect(() => normaliseFeedUrl("file:///etc/passwd")).toThrow();
    expect(() => normaliseFeedUrl("ftp://example.com/a.ics")).toThrow();
  });
  it("refuses the metadata endpoint and loopback before connecting", async () => {
    await expect(safeFetchText("http://169.254.169.254/latest/meta-data")).rejects.toThrow(/allowed/);
    await expect(safeFetchText("http://127.0.0.1/cal.ics")).rejects.toThrow(/allowed/);
    await expect(safeFetchText("http://localhost:3000/x.ics")).rejects.toThrow(/allowed/);
  });
});

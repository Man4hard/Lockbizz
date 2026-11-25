import { describe, expect, it } from "vitest";
import { generateOfflineCode } from "@/lib/offline-code";
import { installmentState } from "@/lib/format";

// Reference values computed independently (Python hmac) with the same algorithm as OfflineCode.kt.
const SECRET = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";

describe("offline unlock code", () => {
  it("matches the Android reference for an unlock code", async () => {
    expect(await generateOfflineCode(SECRET, "dev1", 3, 490024, "unlock")).toBe("03802651");
  });
  it("matches the Android reference for a release code", async () => {
    expect(await generateOfflineCode(SECRET, "dev1", 4, 490005, "release")).toBe("04461665");
  });
  it("prefixes the counter modulo 100", async () => {
    expect(await generateOfflineCode(SECRET, "dev1", 103, 490024, "extend")).toBe("03890164");
  });
  it("differs per device", async () => {
    const a = await generateOfflineCode(SECRET, "dev1", 3, 490024);
    const b = await generateOfflineCode(SECRET, "dev2", 3, 490024);
    expect(a).not.toBe(b);
  });
});

describe("installment state", () => {
  it("is overdue when unpaid and past due date", () => {
    expect(installmentState({ due_date: "2026-01-01", status: "pending" }, "2026-01-02")).toBe("overdue");
  });
  it("is not overdue on the due date itself", () => {
    expect(installmentState({ due_date: "2026-01-02", status: "pending" }, "2026-01-02")).toBe("pending");
  });
  it("partial past due is overdue", () => {
    expect(installmentState({ due_date: "2026-01-01", status: "partial" }, "2026-02-01")).toBe("overdue");
  });
  it("paid stays paid", () => {
    expect(installmentState({ due_date: "2020-01-01", status: "paid" }, "2026-01-01")).toBe("paid");
  });
});

import { describe, expect, it } from "vitest";
import { setupProgress } from "@/lib/setup-steps";

describe("setupProgress", () => {
  it("phone with no ticked steps needs setup", () => {
    expect(setupProgress({})).toEqual({ done: 0, total: 5, complete: false });
  });
  it("phone with all 5 steps ticked is complete", () => {
    expect(setupProgress({ agreement: true, reset: true, qr: true, checkin: true, locktest: true }).complete).toBe(true);
  });
  it("unticked step keeps phone in needs setup", () => {
    expect(setupProgress({ agreement: true, reset: true, qr: true, checkin: true, locktest: false }).complete).toBe(false);
  });
});

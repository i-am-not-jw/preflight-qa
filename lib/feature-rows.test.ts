import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { draftFeatureRows } from "./feature-rows.ts";
import type { ClickCapture } from "./types.ts";

const click = (text: string, href: string, to: string): ClickCapture => ({ text, href, to, note: "" });

describe("feature rows", () => {
  it("turns kab clicks into one table instead of one row per route", () => {
    const rows = draftFeatureRows(
      [
        {
          clicks: [
            click("Skip to content", "#main-content", "click_failed"),
            click("Korea Airport Bus", "", "https://kab.kogenote.com/#find"),
            click("English", "", "same_page"),
            click("Find a bus", "#find", "https://kab.kogenote.com/#find"),
            click("Map", "#map", "https://kab.kogenote.com/#map"),
            click("Google Maps link", "", "same_page"),
            click("Key attractions", "", "same_page"),
            click("Incheon Airport to Myeongdong", "/incheon-airport-to-myeongdong", "https://kab.kogenote.com/incheon-airport-to-myeongdong"),
            click("Incheon Airport to Hongdae", "/incheon-airport-to-hongdae", "https://kab.kogenote.com/incheon-airport-to-hongdae"),
            click("Which Incheon Airport bus runs at night?", "/incheon-airport-night-bus", "https://kab.kogenote.com/incheon-airport-night-bus"),
          ],
        },
      ],
      "ko",
    );
    assert.equal(rows.some((row) => row.middle === "language" && row.major === "Find a bus"), true);
    assert.equal(rows.filter((row) => row.minor === "route").length, 1);
    assert.equal(rows.some((row) => row.minor === "google maps link"), true);
    assert.equal(rows.some((row) => row.minor === "Key attractions"), true);
    assert.equal(rows.some((row) => row.major === "Map"), true);
    assert.equal(rows.some((row) => row.description.includes("Skip")), false);
    assert.equal(rows.length < 8, true);
  });
});
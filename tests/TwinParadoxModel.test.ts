import { Vector2 } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { TwinParadoxModel } from "../src/twin-paradox/model/TwinParadoxModel.js";

describe("TwinParadoxModel playback", () => {
  it("rewinds immediately from the displayed reunion after shortening the trip", () => {
    const model = new TwinParadoxModel();
    model.stepForward(7);
    model.turnaround.positionProperty.value = new Vector2(1, 2);
    expect(model.currentLabTimeProperty.value).toBe(4);
    model.stepBackward(0.1);
    expect(model.currentLabTimeProperty.value).toBeCloseTo(3.9, 10);
    model.dispose();
  });
});

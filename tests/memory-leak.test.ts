/**
 * Fleet-standard memory-leak regression suite (SceneryStackTemplate / QubitSketch pattern).
 *
 * Creates a disposable model object inside a function boundary, disposes it, forces
 * garbage collection via global.gc (--expose-gc in vitest.config.ts), then asserts via
 * WeakRef that the object was collected. V8 requires a function boundary (not merely
 * a block scope) so local strong references die when the helper returns.
 */

import { describe, expect, it } from "vitest";
import { SpecialRelativityModel } from "../src/common/model/SpecialRelativityModel.js";
import { TimeModel } from "../src/common/TimeModel.js";
import { LengthContractionModel } from "../src/length-contraction/model/LengthContractionModel.js";
import { LightClockModel } from "../src/light-clock/model/LightClockModel.js";
import { RelativisticDopplerModel } from "../src/relativistic-doppler/model/RelativisticDopplerModel.js";
import { SpacetimeDiagramModel } from "../src/spacetime/model/SpacetimeDiagramModel.js";
import { TwinParadoxModel } from "../src/twin-paradox/model/TwinParadoxModel.js";
import { describeDisposalLeaks, forceGC } from "./helpers/memoryLeak.js";

function createAndDisposeTimeModel(): WeakRef<object> {
  const model = new TimeModel();
  const ref = new WeakRef<object>(model);
  model.dispose();
  return ref;
}

/**
 * Every disposable model in the sim, each behind its own function boundary. The
 * screen models are the ones worth watching: they each build a handful of
 * DerivedProperties over their sub-models, and a DerivedProperty that is not
 * disposed keeps a listener on its dependencies — which keeps the whole graph
 * alive.
 */
const DISPOSABLE_MODELS: { readonly name: string; readonly createAndDispose: () => WeakRef<object> }[] = [
  { name: "TimeModel", createAndDispose: createAndDisposeTimeModel },
  {
    name: "SpecialRelativityModel",
    createAndDispose: () => {
      const model = new SpecialRelativityModel();
      const ref = new WeakRef<object>(model);
      model.dispose();
      return ref;
    },
  },
  {
    name: "LightClockModel",
    createAndDispose: () => {
      const model = new LightClockModel();
      const ref = new WeakRef<object>(model);
      model.dispose();
      return ref;
    },
  },
  {
    name: "SpacetimeDiagramModel",
    createAndDispose: () => {
      const model = new SpacetimeDiagramModel();
      const ref = new WeakRef<object>(model);
      model.dispose();
      return ref;
    },
  },
  {
    name: "LengthContractionModel",
    createAndDispose: () => {
      const model = new LengthContractionModel();
      const ref = new WeakRef<object>(model);
      model.dispose();
      return ref;
    },
  },
  {
    name: "TwinParadoxModel",
    createAndDispose: () => {
      const model = new TwinParadoxModel();
      const ref = new WeakRef<object>(model);
      model.dispose();
      return ref;
    },
  },
  {
    name: "RelativisticDopplerModel",
    createAndDispose: () => {
      const model = new RelativisticDopplerModel();
      const ref = new WeakRef<object>(model);
      model.dispose();
      return ref;
    },
  },
];

describe("Memory leak regression", () => {
  for (const { name, createAndDispose } of DISPOSABLE_MODELS) {
    it(`${name} is collected after dispose`, async () => {
      const ref = createAndDispose();
      await forceGC(ref);
      expect(ref.deref()).toBeUndefined();
    });
  }

  it("double dispose() does not throw", () => {
    const model = new TimeModel();
    model.dispose();
    expect(() => model.dispose()).not.toThrow();
  });

  it("repeated create/dispose cycles leave no survivors", async () => {
    const refs: WeakRef<object>[] = [];
    for (let i = 0; i < 10; i++) {
      refs.push(createAndDisposeTimeModel());
    }
    await forceGC(refs);
    const survivors = refs.filter((r) => r.deref() !== undefined).length;
    expect(survivors).toBe(0);
  });
});

describeDisposalLeaks([
  { name: "LengthContractionModel", create: () => new LengthContractionModel() },
  { name: "LightClockModel", create: () => new LightClockModel() },
  { name: "RelativisticDopplerModel", create: () => new RelativisticDopplerModel() },
  { name: "SpacetimeDiagramModel", create: () => new SpacetimeDiagramModel() },
  { name: "TwinParadoxModel", create: () => new TwinParadoxModel() },
  { name: "TimeModel", create: () => new TimeModel(), idempotentDispose: true },
  { name: "SpecialRelativityModel", create: () => new SpecialRelativityModel() },
]);

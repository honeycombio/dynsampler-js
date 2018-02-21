jest.mock("nanotimer");
import Sampler, { PerKey, Avg } from ".";

describe("Sampler", () => {
  test("initializes with default values", () => {
    const sampler = new Sampler();
    expect(sampler.clearFrequencySec).toEqual(30);
    expect(sampler.id).toBeUndefined();
    expect(sampler.getSampleRateCalledTimes).toBeUndefined();
  });
});
describe("PerKey", () => {
  test("initializes with default values", () => {
    const sampler = new PerKey();
    expect(sampler.clearFrequencySec).toEqual(30);
    expect(sampler.perKeyThroughputSec).toEqual(5);
    expect(sampler.id).toBeUndefined();
    expect(sampler.getSampleRateCalledTimes).toBeUndefined();
  });

  test("gets a sample rate", () => {
    const sampler = new PerKey();
    new Array(1500).fill(1).forEach(() => sampler.getSampleRate("my-key"));
    // manual tick is equal to ""
    sampler.timer.tick();
    const a = sampler.getSampleRate("my-key");
    expect(a).toEqual(10);
  });
});

describe("Avg", () => {
  test("initializes with default values", () => {
    const sampler = new Avg();
    console.log(sampler);
    expect(sampler.clearFrequencySec).toEqual(30);
    expect(sampler.goalSampleRate).toEqual(10);
    expect(sampler.id).toBeUndefined();
    expect(sampler.getSampleRateCalledTimes).toBeUndefined();
  });

  test.skip("gets a sample rate", () => {
    const sampler = new Avg();
    new Array(1500).fill(1).forEach(() => sampler.getSampleRate("my-key"));
    // manual tick is equal to ""
    sampler.timer.tick();
    const a = sampler.getSampleRate("my-key");
    // No traffic means this is the goal sample rate
    expect(a).toEqual(10);
    sampler.timer.tick();
    expect(sampler.getSampleRate("my-key")).toEqual(1);
  });
});

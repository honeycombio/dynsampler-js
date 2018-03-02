jest.mock("nanotimer");
import { Sampler, PerKeyThroughput, AvgSampleRate } from ".";

describe("Sampler", () => {
  test("initializes with default values", () => {
    const sampler = new Sampler();
    expect(sampler.clearFrequencySec).toEqual(30);
    expect(sampler.id).toBeUndefined();
    expect(sampler.getSampleRateCalledTimes).toBeUndefined();
  });
});
describe("PerKeyThroughput", () => {
  test("initializes with default values", () => {
    const sampler = new PerKeyThroughput();
    expect(sampler.clearFrequencySec).toEqual(30);
    expect(sampler.perKeyThroughputSec).toEqual(10);
    expect(sampler.id).toBeUndefined();
    expect(sampler.getSampleRateCalledTimes).toBeUndefined();
  });

  test("gets a sample rate", () => {
    const sampler = new PerKeyThroughput();
    // Fake a bunch of traffic for a specific key
    new Array(1500).fill(1).forEach(() => sampler.getSampleRate("my-key"));
    // Mocked tick() is equal to clearFrequencySec
    // Moves time forward by enough to run `updateMaps()`
    sampler.timer.tick();
    // get the resulting sample rate after updating maps
    const a = sampler.getSampleRate("my-key");
    expect(a).toEqual(5);
  });
});

describe("AvgSampleRate", () => {
  test("initializes with default values", () => {
    const sampler = new AvgSampleRate();
    console.log(sampler);
    expect(sampler.clearFrequencySec).toEqual(30);
    expect(sampler.goalSampleRate).toEqual(10);
    expect(sampler.id).toBeUndefined();
    expect(sampler.getSampleRateCalledTimes).toBeUndefined();
  });

  test("gets a sample rate", () => {
    const sampler = new AvgSampleRate();
    expect(sampler.hasReceivedTraffic).toEqual(false);
    new Array(1500).fill(1).forEach(() => sampler.getSampleRate("my-key"));
    // manual tick is equal to ""
    sampler.timer.tick();
    expect(sampler.hasReceivedTraffic).toEqual(true);
    const a = sampler.getSampleRate("my-key");
    // No traffic means this is the goal sample rate
    expect(a).toEqual(10);
    sampler.timer.tick();
    expect(sampler.getSampleRate("my-key")).toEqual(1);
  });
});

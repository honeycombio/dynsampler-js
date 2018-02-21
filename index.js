import NanoTimer from "nanotimer";
const debug = require("debug")("dynamic-sampler");

// A Sampler handles construction, timer initialization, and getting the sample
// rate.
export default class Sampler {
  constructor({ clearFrequencySec } = {}) {
    // TODO: runtime validate inputs; make sure they're numbers
    this.clearFrequencySec = clearFrequencySec || 30;
    this.savedSampleRates = new Map();
    this.currentCounts = new Map();

    if (debug.enabled) {
      // if debug is enabled, add a unique id to help debug
      this.id = (Math.random() * 100000).toFixed();
      this.getSampleRateCalledTimes = 0;
      debug("created new perKey sampler with id", this.id);
    } else {
      debug("created new perKey sampler");
    }

    // Set up timer to run updateMaps() on an interval
    this.timer = new NanoTimer();
    this.timer.setInterval(
      this.updateMaps.bind(this),
      [this.id],
      `${this.clearFrequencySec}s`
    );
  }
  getSampleRate(key) {
    // initialize or increment an existing counter
    const { currentCounts, savedSampleRates } = this;
    if (currentCounts.has(key)) {
      const value = currentCounts.get(key);
      currentCounts.set(key, value + 1);
    } else {
      currentCounts.set(key, 1);
    }
    if (savedSampleRates.has(key)) {
      return savedSampleRates.get(key);
    } else {
      return 1;
    }
  }
  updateMaps() {
    throw new Error(
      "Classes which extend `Sampler` must define `updateMaps()`"
    );
  }
}

//const sampler = new PerKey({clearFrequencySec: 100, perKeyThroughputSec: 2})
export class PerKey extends Sampler {
  constructor(opts = {}) {
    super(opts);
    this.perKeyThroughputSec = opts.perKeyThroughputSec || 5;
  }
  updateMaps() {
    debug("PerKey.updateMaps()", this.id && this.id);
    if (this.currentCounts.size == 0) {
      //no traffic in the last 30s. clear the result Map
      this.savedSampleRates.clear();
      return;
    }
    const actualPerKeyRate = this.perKeyThroughputSec * this.clearFrequencySec;

    const newRates = new Map();
    this.currentCounts.forEach((val, key) => {
      newRates.set(key, Math.max(1, val / actualPerKeyRate));
    });
    this.savedSampleRates = newRates;
  }
}

export class Avg extends Sampler {
  constructor(opts = {}) {
    super(opts);
    this.goalSampleRate = opts.goalSampleRate || 10;
    this.hasReceivedTraffic = false;
  }
  updateMaps() {
    debug("Avg.updateMaps()", this.id && this.id);
    if (this.currentCounts.size == 0) {
      //no traffic in the last 30s. clear the result Map
      this.savedSampleRates.clear();
      return;
    }

    let sumEvents = 0;
    let logSum = 0;
    this.currentCounts.forEach((val, key) => {
      sumEvents += val;
      logSum += Math.log10(val);
    });
    const goalCount = sumEvents / this.goalSampleRate;
    const goalRatio = goalCount / logSum;

    const newRates = new Map();
    let keysRemaining = this.currentCounts.size;
    let extra = 0;
    this.currentCounts.forEach((count, key) => {
      let goalForKey = Math.max(1, Math.log10(count) * goalRatio);
      const extraForKey = extra / keysRemaining;
      goalForKey += extraForKey;
      extra -= extraForKey;
      keysRemaining--;
      if (count <= goalForKey) {
        newRates.set(key, 1);
        extra += goalForKey - count;
      } else {
        newRates.set(key, Math.ceil(count / goalForKey));
        extra += goalForKey - count / newRates.get(key);
      }
    });
  }
  getSampleRate(key) {
    // TODO: how well supported is this syntax
    // (basically no IE native support. what about babel/etc?)
    const superSampleRate = super.getSampleRate(key);
    if (!this.hasReceivedTraffic) {
      return this.goalSampleRate;
    } else {
      return superSampleRate;
    }
  }
}

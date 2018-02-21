# Dynamic Sampler

This is a collection of samplers that can be used to provide sample
rates when sending data to services like [honeycomb](https://honeycomb.io)

# Usage

```javascript
import { PerKey } from "dynamic-sampler";
const sampler = new PerKey();

const rate = sampler.getSampleRate("my key");
```

## Choosing a Sampler

TODO

# Implementing New Samplers

The `Sampler` class includes:

* timer setup
* construction of initial state (`Map`s)
* `getSampleRate` returns the rate for a given key

You can extend it to create new samplers. `updateMaps` is the only
function that needs to be defined, but it is often useful to collect
additional configuration from the constructor:

```javascript
import Sampler from "dynamic-sampler";

export class PerKey extends Sampler {
  constructor(opts = {}) {
    super(opts);
    this.perKeyThroughputSec = opts.perKeyThroughputSec || 5;
  }
  updateMaps() {
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
```

## Modifying getSampleRate

Sometimes it makes sense to check additional state in `getSampleRate`
and return a different result based on that. When overriding the
function call `super.getSampleRate`.

```javascript
class MySampler extends Sampler {
  constructor(opts = {}) {
    super(opts);
    this.hasReceivedTraffic = false;
  }
  updateMaps() {
    // other logic
    this.hasReceivedTraffic = true;
  }
  getSampleRate(key) {
    const superSampleRate = super.getSampleRate(key);
    if (!this.hasReceivedTraffic) {
      return this.goalSampleRate;
    } else {
      return superSampleRate;
    }
  }
}
```

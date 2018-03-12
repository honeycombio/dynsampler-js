# Dynamic Sampler

This is a collection of samplers that can be used to provide sample
rates when sending data to services like [honeycomb](https://honeycomb.io)

`dynsampler` is a javascript library for doing dynamic sampling of traffic
before sending it on to [Honeycomb](https://honeycomb.io) (or another
analytics system). It contains several sampling algorithms to help you
select a representative set of events instead of a full stream.

A "sample rate" of 100 means that for every 100 requests, we capture a
single event and indicate that it represents 100 similar requests.

For more information about using Honeycomb, see our
[docs](https://honeycomb.io/docs).

# Installation

```shell
yarn add dynsampler
```

# Usage

### With defaults:

```javascript
import { AvgSampleRate } from "dynsampler";
const sampler = new AvgSampleRate();

const rate = sampler.getSampleRate("my key");
```

### With options

```javascript
import { AvgSampleRate } from "dynsampler";
const sampler = new AvgSampleRate({
  clearFrequencySec: 100,
  goalSampleRate: 50
});
```

## Choosing a Sampler

This package is intended to help sample a stream of tracking events,
where events are typically created in response to a stream of traffic
(for the purposes of logging or debugging). In general, sampling is
used to reduce the total volume of events necessary to represent the
stream of traffic in a meaningful way.

There are a variety of available techniques for reducing a high-volume
stream of incoming events to a lower-volume, more manageable stream of
events. Depending on the shape of your traffic, one may serve better
than another, or you may need to write a new one! Please consider
contributing it back to this package if you do.

* If your system has a exponential falloff of frequency given a specific key
  set, (and this describes most cases in which dynamic sampling is useful),
  AvgSampleRate is your best bet. It will try and reduce the most frequent
  traffic while highlighting the less frequent traffic based on the logarithm of
  the traffic's frequency.

* If your system has a rough cap on the rate it can receive events and
  your partitioned keyspace is fairly steady, use PerKeyThroughput,
  which will calculate sample rates based on keeping the event
  throughput roughly constant per key/partition (e.g. per user id)

# Implementing New Samplers

The `Sampler` class includes:

* timer setup
* construction of initial state (`Map`s)
* `getSampleRate` returns the rate for a given key

You can extend it to create new samplers. `updateMaps` is the only
function that needs to be defined, but it is often useful to collect
additional configuration from the constructor:

```javascript
import { Sampler } from "dynsampler";

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
      newRates.set(key, Math.floor(Math.max(1, val / actualPerKeyRate)));
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

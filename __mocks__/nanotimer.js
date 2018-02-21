// Mock nanotimer so we can manually tick()
export default class NanoTimer {
  setInterval(fn, args, timeInSeconds) {
    this.fn = fn;
    this.args = args;
  }
  // custom function that is only for testing
  tick() {
    if (this.args) {
      this.fn(this.args);
    } else {
      this.fn();
    }
  }
}

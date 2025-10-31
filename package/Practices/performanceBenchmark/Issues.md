# Correct Placement of CPU Timing in WebGPU Submission

Context: primitive.mjs (around line 883). We measure CPU-side latency for a compute pass in `execute(...)`. The current timer placement undercounts CPU work and should be adjusted.

## Summary

- Problem: `cpuStartTime` is recorded after awaiting previous GPU work but before submitting the current work. This excludes CPU overhead for `submit()` and JS-side orchestration.
- Fix: Start the CPU timer immediately before `queue.submit(...)`, then await completion and record `cpuEndTime` after `onSubmittedWorkDone()`.

## Original (Problematic) Timing

```js
if (args.encoder) {
  // user passed in an encoder, return it, don't submit it
  return encoder;
} else {
  // TODO: Is this the right way to do timing?
  const commandBuffer = encoder.finish();
  if (args?.enableCPUTiming) {
    await this.device.queue.onSubmittedWorkDone();
    this.cpuStartTime = performance.now();
  }
  this.device.queue.submit([commandBuffer]);
  if (args?.enableCPUTiming) {
    await this.device.queue.onSubmittedWorkDone();
    this.cpuEndTime = performance.now();
  }
}
```

### Why This Is Incorrect

- Starts timing after waiting for prior GPU work, but before the current `submit()`.
- Excludes CPU cost of `submit()` and any command submission overhead.
- Under-reports the CPU latency for “initiate + wait” for this pass.

## Correct Timing Placement

```js
if (args.encoder) {
  // user passed in an encoder, return it, don't submit it
  return encoder;
} else {
  const commandBuffer = encoder.finish();

  // Start CPU timer immediately before submission
  if (args?.enableCPUTiming) {
    this.cpuStartTime = performance.now();
  }

  // Submit the command buffer
  this.device.queue.submit([commandBuffer]);

  // Stop after GPU signals completion (includes CPU submit + GPU execution + driver latency)
  if (args?.enableCPUTiming) {
    await this.device.queue.onSubmittedWorkDone();
    this.cpuEndTime = performance.now();
  }
}
```

### Rationale

- Measures end-to-end CPU-observed latency to kick off GPU work and wait for its completion.
- Includes:
  - JS-side overhead (encoder finish, submit)
  - Driver queuing and any sync needed by the implementation
  - Wait-for-completion (`onSubmittedWorkDone`) latency

This provides a consistent CPU-side “submit-and-wait” wall time.

## Best Practices for Timing

- Decide what you want to measure:
  - CPU latency (submit + wait): use the corrected placement above.
  - Pure GPU execution time: use timestamp queries (GPU-side timing).
- Warm-up runs: perform at least 1–3 warm-up iterations to avoid JIT/first-use noise.
- Repeat and aggregate: run N trials; report median and variability (IQR or stddev).
- Avoid extra waits: do not call `onSubmittedWorkDone()` before starting the timer.
- External encoder: if `args.encoder` is provided, you cannot measure submit/wait here—document that callers must time externally.
- Feature checks: GPU timestamps require support (timestamp-query feature, proper pipeline/query setup).

## GPU Timing (If Needed)

For precise GPU execution time, use timestamp queries (your TimingHelper already aligns with this approach):

- Begin/End timestamps per pass
- Resolve to buffer
- Convert ticks to nanoseconds using the device timestamp period
- Report `gpuTotalTimeNS` alongside `cpuTotalTimeNS`

## Interpretation Guidance

- cpuTotalTimeNS ~= CPU overhead to finalize + submit + wait + any driver/bus latency.
- gpuTotalTimeNS ~= pure GPU execution (no JS or submit overhead).
- Expect cpuTotalTimeNS ≥ gpuTotalTimeNS. If not, verify timer placement or unintended waits.

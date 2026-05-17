/**
 * Run async tasks with a fixed concurrency limit, preserving input
 * order in the result array. Each task is invoked lazily - the
 * `concurrency`+1th task is only awaited once one of the in-flight
 * tasks resolves, so we never over-commit even when one project's
 * scan is many times slower than its siblings.
 */
export const runWithConcurrency = async <Input, Output>(
  inputs: ReadonlyArray<Input>,
  concurrency: number,
  taskFactory: (input: Input, index: number) => Promise<Output>,
): Promise<Output[]> => {
  if (inputs.length === 0) return [];
  if (concurrency <= 1 || inputs.length === 1) {
    const serialOutputs: Output[] = [];
    for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
      // HACK: intentional sequential await — concurrency<=1 means the
      // caller explicitly opted into one-at-a-time execution (default
      // for monorepo scans). `Promise.all` would defeat the back-pressure
      // every scan is sized around.
      // eslint-disable-next-line react-doctor/async-await-in-loop
      serialOutputs.push(await taskFactory(inputs[inputIndex], inputIndex));
    }
    return serialOutputs;
  }

  const outputs: Output[] = new Array(inputs.length);
  let nextIndexToDispatch = 0;
  const workerCount = Math.min(concurrency, inputs.length);

  const dispatchNext = async (): Promise<void> => {
    // HACK: each worker pulls the next task only after the previous one
    // finishes — that's how the concurrency limit is enforced. The pool
    // of `workerCount` workers runs in parallel via `Promise.all` below;
    // the per-worker loop must stay sequential.
    while (true) {
      const dispatchIndex = nextIndexToDispatch;
      if (dispatchIndex >= inputs.length) return;
      nextIndexToDispatch += 1;
      // eslint-disable-next-line react-doctor/async-await-in-loop
      outputs[dispatchIndex] = await taskFactory(inputs[dispatchIndex], dispatchIndex);
    }
  };

  const workerPromises: Promise<void>[] = [];
  for (let workerIndex = 0; workerIndex < workerCount; workerIndex++) {
    workerPromises.push(dispatchNext());
  }
  await Promise.all(workerPromises);
  return outputs;
};

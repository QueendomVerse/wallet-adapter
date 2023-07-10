export const createPipelineExecutor = async <T>(
    data: IterableIterator<T>,
    executor: (d: T) => Promise<void>,
    {
        delay = 0,
        jobsCount = 1,
        sequence = 1,
    }: {
        delay?: number;
        jobsCount?: number;
        sequence?: number;
    } = {}
): Promise<void> => {
    const execute = async (iter: IteratorResult<T>): Promise<void> => {
        if (!iter.done) {
            await executor(iter.value);
        }
    };

    const next = async (): Promise<void> => {
        if (sequence <= 1) {
            await execute(data.next());
        } else {
            const promises: Promise<void>[] = Array(sequence)
                .fill(undefined)
                .map(() => execute(data.next()));

            await Promise.all(promises);
        }

        if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        if (!data.next().done) {
            await next();
        }
    };

    await Promise.all(Array(jobsCount).fill(next()));
};

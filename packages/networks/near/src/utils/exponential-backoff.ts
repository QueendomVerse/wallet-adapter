export async function exponentialBackoff(
    startWaitTime: any,
    retryNumber: number,
    waitBackoff: number,
    getResult: () => any
) {
    // TODO: jitter?

    let waitTime = startWaitTime;
    for (let i = 0; i < retryNumber; i++) {
        const result = await getResult();
        if (result) {
            return result;
        }

        await sleep(waitTime);
        waitTime *= waitBackoff;
    }

    return null;
}

// Sleep given number of millis.
function sleep(millis: number): Promise<any> {
    return new Promise((resolve) => setTimeout(resolve, millis));
}

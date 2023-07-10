export const decodeLength = (bytes: Array<number>): number => {
    let [len, size] = [0, 0];
    while (bytes.length > 0) {
        const elem = bytes.shift();
        if (!elem) return 0;

        len |= (elem & 0x7f) << (size * 7);
        size++;

        if ((elem & 0x80) === 0) return len;
    }
    return 0;
};

export const encodeLength = (bytes: Array<number>, len: number): void => {
    let rem_len = len;
    while (rem_len !== 0) {
        let elem = rem_len & 0x7f;
        rem_len >>= 7;
        if (rem_len) elem |= 0x80;
        bytes.push(elem);
    }
};

/**
 * Determines if the majority of RSI values indicate an uptrend.
 * @param {number[]} rsiArray - Array of 10 one-day RSI values.
 * @returns {boolean} True if majority are above 50 (uptrend), else false (downtrend).
 */
export function isUptrendByRSI(rsiArray) {
    if (!Array.isArray(rsiArray) || rsiArray.length !== 10) {
        throw new Error("Input must be an array of 10 RSI values.");
    }
    const above50 = rsiArray.filter(val => val > 50).length;
    return above50 > 5;
}

/**
 * Identifies RSI crossovers at the 70 (overbought) and 30 (oversold) marks.
 * Returns:
 *   1  - Bullish crossover (crosses above 30)
 *   -1 - Bearish crossover (crosses below 70)
 *   0  - Neutral (no crossover)
 * @param {number[]} rsiArray - Array of RSI values (at least 2 values).
 * @returns {number} Signal: 1 (bullish), 0 (neutral), -1 (bearish)
 */
export function rsiCrossoverSignal(rsiArray) {
    if (!Array.isArray(rsiArray) || rsiArray.length < 2) {
        throw new Error("Input must be an array of at least 2 RSI values.");
    }
    const prev = rsiArray[rsiArray.length - 2];
    const curr = rsiArray[rsiArray.length - 1];

    // Bullish crossover: crosses above 30
    if (prev <= 30 && curr > 30) return 1;
    // Bearish crossover: crosses below 70
    if (prev >= 70 && curr < 70) return -1;
    // Neutral: no crossover
    return 0;
}

/**
 * Checks if the most recent RSI value is overbought (>70), oversold (<30), or neutral.
 * Returns:
 *   1  - Oversold (RSI < 30)
 *   -1 - Overbought (RSI > 70)
 *   0  - Neutral (RSI between 30 and 70, inclusive)
 * @param {number[]} rsiArray - Array of RSI values (at least 1 value).
 * @returns {number} Signal: 1 (oversold), 0 (neutral), -1 (overbought)
 */
export function rsiOverboughtOversoldSignal(rsiArray) {
    if (!Array.isArray(rsiArray) || rsiArray.length < 1) {
        throw new Error("Input must be an array of at least 1 RSI value.");
    }
    const curr = rsiArray[rsiArray.length - 1];

    if (curr > 70) return -1; // Overbought
    if (curr < 30) return 1;  // Oversold
    return 0;                 // Neutral
}


import { bsGreeks } from './optionAnalysis';

describe('optionAnalysis.bsGreeks delta', () => {
  test('put-call parity relationship for delta holds', () => {
    const S = 100;
    const K = 100;
    const T = 0.5;
    const r = 0.03;
    const q = 0.01;
    const sigma = 0.25;

    const call = bsGreeks(S, K, T, r, q, sigma, 'call');
    const put = bsGreeks(S, K, T, r, q, sigma, 'put');

    // Under Black-Scholes with continuous dividend yield q:
    // Δ_call - Δ_put = e^{-qT}
    const expected = Math.exp(-q * T);
    expect(call.delta - put.delta).toBeCloseTo(expected, 10);

    // Sanity: call delta in (0, 1), put delta in (-1, 0)
    expect(call.delta).toBeGreaterThan(0);
    expect(call.delta).toBeLessThan(1);
    expect(put.delta).toBeLessThan(0);
    expect(put.delta).toBeGreaterThan(-1);
  });
});

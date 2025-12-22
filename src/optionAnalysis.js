export function calculatePutCallRatio(optionRows) {
  let totalPutVolume = 0;
  let totalCallVolume = 0;
  optionRows.forEach(row => {
    // Handle missing or non-numeric values (like "--")
    const putVol = Number(row.p_Volume && row.p_Volume !== '--' ? row.p_Volume : 0);
    const callVol = Number(row.c_Volume && row.c_Volume !== '--' ? row.c_Volume : 0);
    totalPutVolume += putVol;
    totalCallVolume += callVol;
  });
  return totalCallVolume === 0 ? null : totalPutVolume / totalCallVolume;
}

export function groupOptionRowsByExpiry(optionRows) {
    if (!Array.isArray(optionRows) || optionRows.length === 0) return [];

    const groups = [];
    let currentGroup = null;

    optionRows.forEach((row) => {
        if (typeof row.expirygroup === 'string' && row.expirygroup.trim()) {
            const parsed = Date.parse(row.expirygroup);
            if (!Number.isNaN(parsed)) {
                currentGroup = {
                    key: row.expirygroup.trim(),
                    date: new Date(parsed),
                    rows: []
                };
                groups.push(currentGroup);
            } else {
                currentGroup = null;
            }
        }

        if (currentGroup) {
            currentGroup.rows.push(row);
        }
    });

    return groups.filter((g) => g.date instanceof Date && !Number.isNaN(g.date.getTime()));
}

export function getNearestExpiryGroup(optionRows) {
    const groups = groupOptionRowsByExpiry(optionRows);
    if (!groups.length) return null;
    return groups.reduce((best, g) => (g.date < best.date ? g : best), groups[0]);
}

export function getFurthestExpiryGroup(optionRows) {
    const groups = groupOptionRowsByExpiry(optionRows);
    if (!groups.length) return null;
    return groups.reduce((best, g) => (g.date > best.date ? g : best), groups[0]);
}

export function getNearestExpiryRows(optionRows) {
    const g = getNearestExpiryGroup(optionRows);
    return g?.rows || [];
}

export function getFurthestExpiryRows(optionRows) {
    const g = getFurthestExpiryGroup(optionRows);
    return g?.rows || [];
}

export function formatExpiryLabel(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'N/A';
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', opts);
}

function phi(x) {
    //std normal pdf
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function Phi(x) {
    //std normal cdf using erf approximation
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x) {
    // Approximation of the error function using Abramowitz and Stegun formula 7.1.26
    const sign = x < 0 ? -1 : 1;
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const ax = Math.abs(x);
    const t = 1 / (1 + p * ax);
    const y = 1 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1) * t * Math.exp(-ax * ax);
    return sign * y;
}

export function bsPrice( S, K, T, r, q, sigma, optionType = 'call') {
    if ( T <=0 ) {
        if (optionType === 'call') {
            return Math.max(S - K, 0);
        }
        return Math.max(K - S, 0);
    }
    if ( sigma <= 0 ) {
        if (optionType === 'call') {
            return Math.max(S * Math.exp(-q * T) - K * Math.exp(-r * T), 0);
        }
        return Math.max(K * Math.exp(-r * T) - S * Math.exp(-q * T), 0);
    }
    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;

    if (optionType === 'call') {
        return S * Math.exp(-q * T) * Phi(d1) - K * Math.exp(-r * T) * Phi(d2);
    } else {
        return K * Math.exp(-r * T) * Phi(-d2) - S * Math.exp(-q * T) * Phi(-d1);
    }
}

export function bsGreeks(S, K, T, r, q, sigma, optionType = 'call') {
    if ( T <= 0) {
        const intrinsic = optionType === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
        return {
            delta : optionType === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
            gamma : 0,
            theta : 0,
            vega : 0,
            rho : 0
        };
    }

    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;

    const pdfD1 = phi(d1);
    const delta = optionType === 'call' ? Math.exp(-q * T) * Phi(d1) : -Math.exp(-q * T) * (Phi(-d1) - 1);

    const gamma = Math.exp(-q * T) * pdfD1 / (S * sigma * sqrtT);

    const theta_call = (
        - (S * pdfD1 * sigma * Math.exp(-q * T)) / (2 * sqrtT)
        - r * K * Math.exp(-r * T) * Phi(d2)
        + q * S * Math.exp(-q * T) * Phi(d1)
    );

    const theta_put = (
        - (S * pdfD1 * sigma * Math.exp(-q * T)) / (2 * sqrtT)
        + r * K * Math.exp(-r * T) * Phi(-d2)
        - q * S * Math.exp(-q * T) * Phi(-d1)
    );

    const theta = optionType === 'call' ? theta_call : theta_put;

    const vega = S * Math.exp(-q * T) * pdfD1 * sqrtT;

    const rho_call = K * T * Math.exp(-r * T) * Phi(d2);
    const rho_put = -K * T * Math.exp(-r * T) * Phi(-d2);
    const rho = optionType === 'call' ? rho_call : rho_put;

    return {delta , gamma, theta, vega, rho};

}

function parseNumeric(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function midPrice(row, optionType) {
    if (!row) return null;
    const bid = parseNumeric(optionType === 'call' ? row.c_Bid : row.p_Bid);
    const ask = parseNumeric(optionType === 'call' ? row.c_Ask : row.p_Ask);
    const last = parseNumeric(optionType === 'call' ? row.c_Last : row.p_Last);

    if (bid !== null && ask !== null && ask >= bid) {
        return (bid + ask) / 2;
    }
    if (last !== null) return last;
    if (bid !== null) return bid;
    if (ask !== null) return ask;
    return null;
}

function parseExpiryDateFromRows(rows) {
    const withGroup = (rows || []).find((row) => typeof row.expirygroup === 'string' && row.expirygroup.trim());
    if (!withGroup) return null;
    const parsed = Date.parse(withGroup.expirygroup);
    if (Number.isNaN(parsed)) return null;
    return new Date(parsed);
}

function getTimeToExpiryYears(rows) {
    const expiry = parseExpiryDateFromRows(rows);
    if (!expiry) return null;
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return null;
    const msInYear = 365 * 24 * 60 * 60 * 1000;
    return diffMs / msInYear;
}

export function computeRowDelta(row, S, rows, optionType = 'call', r = 0.05, q = 0) {
    const K = parseNumeric(row?.strike);
    if (!row || !K || !S) return null;
    const T = getTimeToExpiryYears(rows);
    if (!T) return null;
    const marketPrice = midPrice(row, optionType);
    if (!marketPrice || marketPrice <= 0) return null;

    const iv = getImpliedVolatility({
        S,
        K,
        T,
        r,
        q,
        marketPrice,
        optionType
    });

    if (iv === null) return null;
    const greeks = bsGreeks(S, K, T, r, q, iv, optionType);
    const delta = greeks?.delta;
    return Number.isFinite(delta) ? Math.abs(delta) : null;
}

export function buildDeltaAsymmetry(optionRows, spotPrice, otmDistance = 10) {
    if (!spotPrice || !Array.isArray(optionRows)) {
        return { status: 'unavailable' };
    }

    const findClosestRow = (targetStrike) => {
        return optionRows.reduce((best, row) => {
            const strike = parseNumeric(row?.strike);
            if (strike === null) return best;
            const diff = Math.abs(strike - targetStrike);
            if (diff < best.diff) {
                return { diff, row };
            }
            return best;
        }, { diff: Infinity, row: null }).row;
    };

    const callRow = findClosestRow(spotPrice + otmDistance);
    const putRow = findClosestRow(spotPrice - otmDistance);

    const callDelta = computeRowDelta(callRow, spotPrice, optionRows, 'call');
    const putDelta = computeRowDelta(putRow, spotPrice, optionRows, 'put');

    if (callDelta === null || putDelta === null) {
        return {
            status: 'pending',
            callDelta,
            putDelta,
            strikes: {
                call: parseNumeric(callRow?.strike),
                put: parseNumeric(putRow?.strike)
            },
            otmDistance
        };
    }

    const tolerance = 0.05;
    let signal = 'Neutral';
    let signalClass = 'neutral';
    if (callDelta - putDelta > tolerance) {
        signal = 'Bullish';
        signalClass = 'bullish';
    } else if (putDelta - callDelta > tolerance) {
        signal = 'Bearish';
        signalClass = 'bearish';
    }

    return {
        status: 'ready',
        signal,
        signalClass,
        callDelta,
        putDelta,
        strikes: {
            call: parseNumeric(callRow?.strike),
            put: parseNumeric(putRow?.strike)
        },
        otmDistance,
        timeToExpiry: getTimeToExpiryYears(optionRows)
    };
}

function intrinsicValue(S, K, optionType = 'call') {
    if (optionType === 'call') {
        return Math.max(S - K, 0);
    } else {
        return Math.max(K - S, 0);
    }
}

export function getImpliedVolatility({
    S,
    K,
    T,
    r,
    q=0,
    marketPrice,
    optionType = 'call',
    tol = 1e-6,
    maxIter = 100
}) {
    if (T <= 0) {
        console.log('Option has expired, no implied volatility can be calculated.');
        return null;
    }
    if (marketPrice <= 0) {
        console.log('Invalid market price.');
        return null;
    }

    const intrinsic = intrinsicValue(S * Math.exp(-q * T), K * Math.exp(-r * T), optionType);
    console.log('Intrinsic value:', intrinsic);
    if (marketPrice < intrinsic  - 1e-8) {
        console.log('Market price is below intrinsic value, no implied volatility can be calculated.');
        return null;
    }

    const priceAtSigma = (sigma) => bsPrice(S, K, T, r, q, sigma, optionType);
    const vegaAtSigma = (sigma) => {
        return bsGreeks(S, K, T, r, q, sigma, optionType).vega;
    };

    let sigma = 0.2; // Initial guess
    sigma = Math.max(sigma, 1e-6); // Ensure sigma is positive

    for (let i = 0; i < maxIter; i++) {
        const price = priceAtSigma(sigma);
        const diff = price - marketPrice;

        if (Math.abs(diff) < tol) {
            return sigma; // Found a solution
        }
        const vega = vegaAtSigma(sigma);
        if (vega < 1e-8) {
            break;
        }

        const increment = diff / vega; // Newton's method step
        sigma -= increment;
        if (sigma <=0 || !isFinite(sigma)) {
            break;
        }
    }

    let low = 1e-6;
    let high = 5.0;
    let priceLow = priceAtSigma(low);
    let priceHigh = priceAtSigma(high);

    let iterExpand = 0;
    while ((priceLow - marketPrice) * (priceHigh - marketPrice) > 0 && iterExpand < 50) {
        high *= 2;
        priceHigh = priceAtSigma(high);
        iterExpand++;
        if (high > 1e3) {
            break;
        }
    }

    for (let i = 0; i < maxIter; i++) {
        const mid = (low + high) * 0.5;
        const priceMid = priceAtSigma(mid);

        if (!isFinite(priceMid)) {
            return null;
        }
        const diff = priceMid - marketPrice;
        if (Math.abs(diff) < tol) {
            return mid; // Found a solution
        }

        if ((priceLow - marketPrice) * diff < 0) {
            high = mid;
            priceHigh = priceMid;
        } else {
            low = mid;
            priceLow = priceMid;
        }
    }

    return (low + high) * 0.5; // Return the best estimate
}
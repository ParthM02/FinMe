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
        return null;
    }
    if (marketPrice <= 0) {
        return null;
    }

    const intrinsic = intrinsicValue(S * Math.exp(-q * T), K * Math.exp(-r * T), optionType);
    if (marketPrice < intrinsic  - 1e-8) {
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
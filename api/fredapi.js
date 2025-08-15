export async function fetchRiskFreeRateFromFRED({
    seriesID = 'DGS3MO',
    apiKey = process.env.FRED_KEY
} = {}) {
    if (!apiKey) {
        throw new Error("FRED API key is missing in environment variables");
    }
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesID}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch data from FRED: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.observations || data.observations.length === 0) {
        throw new Error("No observations found for the given series ID");
    }
    const value = data.observations[0].value;
    const rate = parseFloat(value);
    if (isNaN(rate)) {
        throw new Error(`Invalid rate value: ${value}`);
    }
    return rate/100;
}
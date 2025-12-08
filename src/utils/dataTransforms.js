// src/utils/dataTransforms.js

// Simple rolling average (e.g. 7-day for cases)
export function rollingAverage(values, windowSize = 7) {
    if (!values) return [];
    const result = [];
    let sum = 0;

    for (let i = 0; i < values.length; i++) {
        const v = values[i] ?? 0;
        sum += v;

        if (i >= windowSize) {
            const old = values[i - windowSize] ?? 0;
            sum -= old;
        }

        if (i >= windowSize - 1) {
            result.push(sum / windowSize);
        } else {
            result.push(null); // not enough data yet
        }
    }

    return result;
}

// Short-term trend (up / down / flat), like a stock
export function computeTrend(series, window = 7) {
    if (!series || series.length < 2) return null;
    const n = series.length;
    const start = Math.max(0, n - window);

    let first = null;
    let last = null;

    for (let i = start; i < n; i++) {
        const v = series[i];
        if (v == null || Number.isNaN(v)) continue;
        if (first === null) first = v;
        last = v;
    }

    if (first === null || last === null) return null;

    const change = last - first;
    const pct = first !== 0 ? (change / Math.abs(first)) * 100 : null;

    let direction;
    if (Math.abs(change) < 1e-6 || (pct != null && Math.abs(pct) < 2)) {
        direction = "flat";
    } else if (change > 0) {
        direction = "up";
    } else {
        direction = "down";
    }

    return { direction, change, pct };
}

// src/utils/formatters.js

export function formatNumber(n) {
    if (n == null) return "—";
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toLocaleString();
}

// src/pages/Dashboard.js
import React, { useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title,
} from "chart.js";
import { useCovidGdpApiData } from "../hooks/useCovidGdpApiData";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title
);

const COUNTRY_CONFIG = [
    { key: "US", label: "United States" },
    { key: "DE", label: "Germany" },
    { key: "IT", label: "Italy" },
    { key: "JP", label: "Japan" },
    { key: "CA", label: "Canada" },
    { key: "FR", label: "France" },
    { key: "SE", label: "Sweden" },
    { key: "MX", label: "Mexico" },
    { key: "NZ", label: "New Zealand" },
    { key: "TH", label: "Thailand" },
];

function formatNumber(n) {
    if (n == null) return "—";
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toLocaleString();
}

function Dashboard() {
    const [selectedCountry, setSelectedCountry] = useState("US");
    const [covidSource, setCovidSource] = useState("who"); // "who" | "te"

    const { loading, error, combined, covidDaily } = useCovidGdpApiData(
        selectedCountry,
        covidSource
    );

    const latest = useMemo(() => {
        if (!covidDaily || covidDaily.length === 0) return null;
        return covidDaily[covidDaily.length - 1];
    }, [covidDaily]);

    const latestGdp = useMemo(() => {
        if (!combined || combined.length === 0) return null;
        const lastWithGdp = [...combined]
            .reverse()
            .find((d) => d.gdpGrowth != null);
        return lastWithGdp || null;
    }, [combined]);

    const covidSourceLabel =
        covidSource === "who"
            ? "WHO / Pomber timeseries"
            : "TradingEconomics (fallback to WHO)";

    // Prepare chart data
    const labels = combined ? combined.map((d) => d.date) : [];

    const chartData = {
        labels,
        datasets: [
            {
                label: "New cases",
                data: combined ? combined.map((d) => d.newCases) : [],
                borderColor: "#1976d2",
                backgroundColor: "rgba(25, 118, 210, 0.15)",
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.25,
                yAxisID: "yCases",
            },
            {
                label: "New deaths",
                data: combined ? combined.map((d) => d.newDeaths || 0) : [],
                borderColor: "#d32f2f",
                backgroundColor: "rgba(211, 47, 47, 0.15)",
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.25,
                yAxisID: "yCases",
            },
            {
                label: "GDP growth (%)",
                data: combined ? combined.map((d) => d.gdpGrowth) : [],
                borderColor: "#388e3c",
                backgroundColor: "rgba(56, 142, 60, 0.15)",
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.25,
                yAxisID: "yGdp",
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: {
                position: "top",
                labels: { font: { size: 11 } },
            },
            title: {
                display: true,
                text: "COVID–GDP co-dynamics over time",
                font: { size: 14 },
            },
            tooltip: {
                callbacks: {
                    label: function (ctx) {
                        const label = ctx.dataset.label || "";
                        const value = ctx.raw;
                        if (label === "New cases") {
                            return `${label}: ${formatNumber(value)}`;
                        }
                        if (label === "New deaths") {
                            return `${label}: ${formatNumber(value)}`;
                        }
                        if (label === "GDP growth (%)") {
                            if (value == null) return `${label}: —`;
                            return `${label}: ${value.toFixed(2)}%`;
                        }
                        return `${label}: ${value}`;
                    },
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    maxTicksLimit: 10,
                    font: { size: 10 },
                },
            },
            yCases: {
                type: "linear",
                position: "left",
                title: { display: true, text: "New cases / deaths" },
                ticks: {
                    callback: (v) => formatNumber(v),
                    font: { size: 10 },
                },
            },
            yGdp: {
                type: "linear",
                position: "right",
                title: { display: true, text: "GDP growth (%)" },
                grid: { drawOnChartArea: false },
                ticks: {
                    callback: (v) => (v == null ? "" : `${v.toFixed(1)}%`),
                    font: { size: 10 },
                },
            },
        },
    };

    return (
        <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
            {/* Header */}
            <header
                style={{
                    marginBottom: 24,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                }}
            >
                <div>
                    <h1 style={{ margin: 0 }}>COVID–GDP Dashboard</h1>
                    <p
                        style={{
                            margin: "4px 0",
                            color: "#555",
                            maxWidth: 520,
                        }}
                    >
                        Exploring Lotka–Volterra-style co-dynamics between{" "}
                        <strong>COVID-19 spread</strong> and{" "}
                        <strong>economic activity (GDP growth)</strong> using
                        real data.
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#777" }}>
                        COVID source: {covidSourceLabel}
                    </p>
                </div>

                {/* COVID Source Toggle */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#f5f5f5",
                        padding: "4px 8px",
                        borderRadius: 999,
                    }}
                >
                    <span style={{ fontSize: 12, color: "#555" }}>
                        COVID data:
                    </span>
                    <button
                        type="button"
                        onClick={() => setCovidSource("who")}
                        style={{
                            borderRadius: 999,
                            border: "none",
                            padding: "6px 10px",
                            fontSize: 12,
                            cursor: "pointer",
                            background:
                                covidSource === "who"
                                    ? "#1976d2"
                                    : "transparent",
                            color: covidSource === "who" ? "white" : "#1976d2",
                        }}
                    >
                        WHO
                    </button>
                    <button
                        type="button"
                        onClick={() => setCovidSource("te")}
                        style={{
                            borderRadius: 999,
                            border: "none",
                            padding: "6px 10px",
                            fontSize: 12,
                            cursor: "pointer",
                            background:
                                covidSource === "te"
                                    ? "#1976d2"
                                    : "transparent",
                            color: covidSource === "te" ? "white" : "#1976d2",
                        }}
                    >
                        TE
                    </button>
                </div>
            </header>

            {/* Country cards */}
            <section style={{ marginBottom: 24 }}>
                <h2 style={{ marginBottom: 8, fontSize: 18 }}>
                    Select country
                </h2>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: 12,
                    }}
                >
                    {COUNTRY_CONFIG.map((c) => {
                        const active = c.key === selectedCountry;
                        return (
                            <button
                                key={c.key}
                                type="button"
                                onClick={() => setSelectedCountry(c.key)}
                                style={{
                                    padding: "10px 12px",
                                    textAlign: "left",
                                    borderRadius: 12,
                                    border: active
                                        ? "2px solid #1976d2"
                                        : "1px solid #ddd",
                                    background: active ? "#e3f2fd" : "white",
                                    cursor: "pointer",
                                    fontSize: 14,
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>{c.label}</div>
                                <div style={{ fontSize: 11, color: "#777" }}>
                                    {c.key}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Loading / Error */}
            {loading && <div style={{ marginTop: 24 }}>Loading data…</div>}
            {error && !loading && (
                <div style={{ marginTop: 24, color: "crimson" }}>
                    Error loading data: {error.message}
                </div>
            )}

            {/* Main content */}
            {!loading && !error && (
                <>
                    {/* Summary cards */}
                    <section
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 16,
                            marginBottom: 24,
                        }}
                    >
                        <div
                            style={{
                                background: "white",
                                borderRadius: 12,
                                padding: 16,
                                border: "1px solid #eee",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "#777",
                                    marginBottom: 4,
                                }}
                            >
                                Latest new cases
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700 }}>
                                {latest ? formatNumber(latest.newCases) : "—"}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: "#999",
                                    marginTop: 4,
                                }}
                            >
                                Source:{" "}
                                {covidSource === "who" ? "WHO / Pomber" : "TE"}
                            </div>
                        </div>

                        <div
                            style={{
                                background: "white",
                                borderRadius: 12,
                                padding: 16,
                                border: "1px solid #eee",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "#777",
                                    marginBottom: 4,
                                }}
                            >
                                Total confirmed
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700 }}>
                                {latest ? formatNumber(latest.confirmed) : "—"}
                            </div>
                        </div>

                        <div
                            style={{
                                background: "white",
                                borderRadius: 12,
                                padding: 16,
                                border: "1px solid #eee",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "#777",
                                    marginBottom: 4,
                                }}
                            >
                                Total deaths
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700 }}>
                                {latest && latest.deaths != null
                                    ? formatNumber(latest.deaths)
                                    : "—"}
                            </div>
                        </div>

                        <div
                            style={{
                                background: "white",
                                borderRadius: 12,
                                padding: 16,
                                border: "1px solid #eee",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "#777",
                                    marginBottom: 4,
                                }}
                            >
                                Latest GDP growth
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700 }}>
                                {latestGdp && latestGdp.gdpGrowth != null
                                    ? `${latestGdp.gdpGrowth.toFixed(1)}%`
                                    : "—"}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: "#999",
                                    marginTop: 4,
                                }}
                            >
                                GDP: World Bank + TradingEconomics (token)
                            </div>
                        </div>
                    </section>

                    {/* Time-series chart */}
                    <section
                        style={{
                            background: "white",
                            borderRadius: 12,
                            padding: 16,
                            border: "1px solid #eee",
                            marginBottom: 24,
                        }}
                    >
                        <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>
                            COVID vs GDP over time
                        </h2>
                        <p
                            style={{
                                margin: "0 0 12px",
                                fontSize: 12,
                                color: "#777",
                            }}
                        >
                            Left axis: new COVID cases and deaths per day. Right
                            axis: GDP growth (%). Peaks in GDP often precede
                            peaks in cases, echoing the predator–prey intuition
                            from Lotka–Volterra models.
                        </p>
                        <div style={{ width: "100%", height: 380 }}>
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </section>

                    {/* Optional raw data preview */}
                    <section style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: 18, marginBottom: 8 }}>
                            Sample of joined data
                        </h2>
                        <div
                            style={{
                                maxHeight: 260,
                                overflow: "auto",
                                borderRadius: 8,
                                border: "1px solid #eee",
                                background: "white",
                            }}
                        >
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: 12,
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            background: "#fafafa",
                                            position: "sticky",
                                            top: 0,
                                        }}
                                    >
                                        <th style={thCell}>Date</th>
                                        <th style={thCell}>New cases</th>
                                        <th style={thCell}>New deaths</th>
                                        <th style={thCell}>Confirmed</th>
                                        <th style={thCell}>Deaths</th>
                                        <th style={thCell}>GDP growth (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(combined || []).slice(-50).map((row) => (
                                        <tr key={row.date}>
                                            <td style={tdCell}>{row.date}</td>
                                            <td style={tdCell}>
                                                {formatNumber(row.newCases)}
                                            </td>
                                            <td style={tdCell}>
                                                {row.newDeaths != null
                                                    ? formatNumber(
                                                          row.newDeaths
                                                      )
                                                    : "—"}
                                            </td>
                                            <td style={tdCell}>
                                                {row.confirmed != null
                                                    ? formatNumber(
                                                          row.confirmed
                                                      )
                                                    : "—"}
                                            </td>
                                            <td style={tdCell}>
                                                {row.deaths != null
                                                    ? formatNumber(row.deaths)
                                                    : "—"}
                                            </td>
                                            <td style={tdCell}>
                                                {row.gdpGrowth != null
                                                    ? row.gdpGrowth.toFixed(2)
                                                    : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

const thCell = {
    padding: "6px 8px",
    textAlign: "left",
    borderBottom: "1px solid #eee",
    position: "sticky",
    top: 0,
};

const tdCell = {
    padding: "6px 8px",
    textAlign: "left",
    borderBottom: "1px solid #f3f3f3",
};

export default Dashboard;

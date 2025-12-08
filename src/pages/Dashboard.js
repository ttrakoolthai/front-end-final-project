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
import SummaryCard from "../components/SummaryCard";
import DataPreviewTable from "../components/DataPreviewTable";
import { formatNumber } from "../utils/formatters";
import { rollingAverage, computeTrend } from "../utils/dataTransforms";

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

const lightTheme = {
    background: "#f5f5f5",
    textPrimary: "#111",
    textSecondary: "#555",
    textMuted: "#555",
    cardBg: "#ffffff",
    border: "#e0e0e0",
};

function applyDateRange(data, range) {
    if (!data || data.length === 0) return [];
    if (range === "max") return data;

    const n =
        range === "30d" ? 30 : range === "90d" ? 90 : range === "1y" ? 365 : 0;
    if (n === 0 || data.length <= n) return data;

    return data.slice(-n);
}

function Dashboard() {
    const [selectedCountry, setSelectedCountry] = useState("US");
    const [compareCountry, setCompareCountry] = useState("DE");
    const [covidSource, setCovidSource] = useState("who"); // "who" | "te"
    const [viewMode, setViewMode] = useState("single"); // "single" | "compare"
    const [showRolling, setShowRolling] = useState(false);
    const [dateRange, setDateRange] = useState("max"); // "30d" | "90d" | "1y" | "max"

    const theme = lightTheme;

    // ---------- Primary country data ----------
    const {
        loading: loadingA,
        error: errorA,
        combined: combinedA,
        covidDaily: covidDailyA,
    } = useCovidGdpApiData(selectedCountry, covidSource);

    const covidSourceLabel =
        covidSource === "who"
            ? "WHO / Pomber timeseries"
            : "TradingEconomics (fallback to WHO)";

    const combinedAFiltered = useMemo(
        () => applyDateRange(combinedA || [], dateRange),
        [combinedA, dateRange]
    );

    const latestA = useMemo(() => {
        if (!covidDailyA || covidDailyA.length === 0) return null;
        return covidDailyA[covidDailyA.length - 1];
    }, [covidDailyA]);

    const latestGdpA = useMemo(() => {
        if (!combinedA || combinedA.length === 0) return null;
        const lastWithGdp = [...combinedA]
            .reverse()
            .find((d) => d.gdpGrowth != null);
        return lastWithGdp || null;
    }, [combinedA]);

    const newCasesSeriesA = combinedA ? combinedA.map((d) => d.newCases) : [];
    const gdpSeriesA = combinedA ? combinedA.map((d) => d.gdpGrowth) : [];

    const casesTrend = useMemo(
        () => computeTrend(newCasesSeriesA, 7),
        [newCasesSeriesA]
    );
    const gdpTrend = useMemo(() => computeTrend(gdpSeriesA, 8), [gdpSeriesA]);

    // ---------- Single view datasets ----------
    const labelsA = combinedAFiltered.map((d) => d.date);
    const newCasesA = combinedAFiltered.map((d) => d.newCases);
    const gdpA = combinedAFiltered.map((d) => d.gdpGrowth);

    const newCasesPlotA = showRolling
        ? rollingAverage(newCasesA, 7)
        : newCasesA;

    const timeSeriesDataSingle = {
        labels: labelsA,
        datasets: [
            {
                label: showRolling ? "New cases (7-day avg)" : "New cases",
                data: newCasesPlotA,
                borderColor: "#1976d2",
                backgroundColor: "rgba(25, 118, 210, 0.15)",
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.25,
                yAxisID: "yCases",
            },
            {
                label: "GDP growth (%)",
                data: gdpA,
                borderColor: "#388e3c",
                backgroundColor: "rgba(56, 142, 60, 0.15)",
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.25,
                yAxisID: "yGdp",
            },
        ],
    };

    const timeSeriesOptionsSingle = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: {
                position: "top",
                labels: { font: { size: 11 }, color: theme.textPrimary },
            },
            title: {
                display: true,
                text: "COVID-19 & GDP over time",
                font: { size: 14 },
                color: theme.textPrimary,
            },
            tooltip: {
                callbacks: {
                    label: function (ctx) {
                        const label = ctx.dataset.label || "";
                        const value = ctx.raw;
                        if (label.toLowerCase().includes("cases")) {
                            return `${label}: ${formatNumber(value)}`;
                        }
                        if (label.includes("GDP growth")) {
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
                    color: theme.textSecondary,
                },
                grid: { color: theme.border },
            },
            yCases: {
                type: "linear",
                position: "left",
                title: {
                    display: true,
                    text: "New cases",
                    color: theme.textSecondary,
                },
                ticks: {
                    callback: (v) => formatNumber(v),
                    font: { size: 10 },
                    color: theme.textSecondary,
                },
                grid: { color: theme.border },
            },
            yGdp: {
                type: "linear",
                position: "right",
                title: {
                    display: true,
                    text: "GDP growth (%)",
                    color: theme.textSecondary,
                },
                grid: { drawOnChartArea: false, color: theme.border },
                ticks: {
                    callback: (v) => (v == null ? "" : `${v.toFixed(1)}%`),
                    font: { size: 10 },
                    color: theme.textSecondary,
                },
            },
        },
    };

    // ---------- Comparison view data ----------
    const {
        loading: loadingB,
        error: errorB,
        combined: combinedB,
        covidDaily: covidDailyB,
    } = useCovidGdpApiData(compareCountry, covidSource);

    const combinedBFiltered = useMemo(
        () => applyDateRange(combinedB || [], dateRange),
        [combinedB, dateRange]
    );

    const latestB = useMemo(() => {
        if (!covidDailyB || covidDailyB.length === 0) return null;
        return covidDailyB[covidDailyB.length - 1];
    }, [covidDailyB]);

    const latestGdpB = useMemo(() => {
        if (!combinedB || combinedB.length === 0) return null;
        const lastWithGdp = [...combinedB]
            .reverse()
            .find((d) => d.gdpGrowth != null);
        return lastWithGdp || null;
    }, [combinedB]);

    const labelsCompare = combinedAFiltered.map((d) => d.date);
    const mapB = new Map(combinedBFiltered.map((d) => [d.date, d]));

    const casesACompare = combinedAFiltered.map((d) => d.newCases);
    const casesBCompare = labelsCompare.map((date) => {
        const row = mapB.get(date);
        return row ? row.newCases : null;
    });

    const gdpACompare = combinedAFiltered.map((d) => d.gdpGrowth);
    const gdpBCompare = labelsCompare.map((date) => {
        const row = mapB.get(date);
        return row ? row.gdpGrowth : null;
    });

    const timeSeriesDataCompare = {
        labels: labelsCompare,
        datasets: [
            {
                label: `New cases (${selectedCountry})`,
                data: casesACompare,
                borderColor: "#1976d2",
                backgroundColor: "rgba(25, 118, 210, 0.15)",
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.25,
                yAxisID: "yCases",
            },
            {
                label: `New cases (${compareCountry})`,
                data: casesBCompare,
                borderColor: "#ff9800",
                backgroundColor: "rgba(255, 152, 0, 0.12)",
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.25,
                yAxisID: "yCases",
            },
            {
                label: `GDP growth (%) (${selectedCountry})`,
                data: gdpACompare,
                borderColor: "#388e3c",
                backgroundColor: "rgba(56, 142, 60, 0.15)",
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.25,
                yAxisID: "yGdp",
            },
            {
                label: `GDP growth (%) (${compareCountry})`,
                data: gdpBCompare,
                borderColor: "#9c27b0",
                backgroundColor: "rgba(156, 39, 176, 0.15)",
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.25,
                yAxisID: "yGdp",
            },
        ],
    };

    const timeSeriesOptionsCompare = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: {
                position: "top",
                labels: { font: { size: 11 }, color: theme.textPrimary },
            },
            title: {
                display: true,
                text: "Country comparison: COVID-19 & GDP",
                font: { size: 14 },
                color: theme.textPrimary,
            },
            tooltip: {
                callbacks: {
                    label: function (ctx) {
                        const label = ctx.dataset.label || "";
                        const value = ctx.raw;
                        if (label.toLowerCase().includes("cases")) {
                            return `${label}: ${formatNumber(value)}`;
                        }
                        if (label.includes("GDP growth")) {
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
                    color: theme.textSecondary,
                },
                grid: { color: theme.border },
            },
            yCases: {
                type: "linear",
                position: "left",
                title: {
                    display: true,
                    text: "New cases",
                    color: theme.textSecondary,
                },
                ticks: {
                    callback: (v) => formatNumber(v),
                    font: { size: 10 },
                    color: theme.textSecondary,
                },
                grid: { color: theme.border },
            },
            yGdp: {
                type: "linear",
                position: "right",
                title: {
                    display: true,
                    text: "GDP growth (%)",
                    color: theme.textSecondary,
                },
                grid: { drawOnChartArea: false, color: theme.border },
                ticks: {
                    callback: (v) => (v == null ? "" : `${v.toFixed(1)}%`),
                    font: { size: 10 },
                    color: theme.textSecondary,
                },
            },
        },
    };

    const loading = viewMode === "single" ? loadingA : loadingA || loadingB;
    const error = viewMode === "single" ? errorA : errorA || errorB;

    return (
        <main role="main" className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div>
                    <h1 style={{ margin: 0 }}>COVID–GDP Dashboard</h1>
                    <p
                        style={{
                            margin: "4px 0",
                            color: theme.textSecondary,
                            maxWidth: 520,
                            fontSize: 14,
                        }}
                    >
                        Visualizing how <strong>COVID-19</strong> affects{" "}
                        <strong>economic activity (GDP growth)</strong> across
                        various countries.
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 8,
                    }}
                >
                    {/* COVID Source Toggle */}
                    <div className="pill-toggle" aria-label="COVID data source">
                        <span className="pill-toggle-label">Data Source:</span>
                        <button
                            type="button"
                            onClick={() => setCovidSource("who")}
                            className={covidSource === "who" ? "is-active" : ""}
                        >
                            WHO
                        </button>
                        <button
                            type="button"
                            onClick={() => setCovidSource("te")}
                            className={covidSource === "te" ? "is-active" : ""}
                        >
                            TE
                        </button>
                    </div>
                </div>
            </header>

            {/* View mode toggle */}
            <section className="section" aria-label="View mode">
                <div className="pill-toggle">
                    <button
                        type="button"
                        onClick={() => setViewMode("single")}
                        className={viewMode === "single" ? "is-active" : ""}
                    >
                        Single country
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("compare")}
                        className={viewMode === "compare" ? "is-active" : ""}
                    >
                        Compare countries
                    </button>
                </div>
            </section>

            {/* Date range filter */}
            <section className="section" aria-label="Date range">
                <div className="pill-toggle">
                    <span className="pill-toggle-label">Date range:</span>
                    <button
                        type="button"
                        onClick={() => setDateRange("30d")}
                        className={dateRange === "30d" ? "is-active" : ""}
                    >
                        30d
                    </button>
                    <button
                        type="button"
                        onClick={() => setDateRange("90d")}
                        className={dateRange === "90d" ? "is-active" : ""}
                    >
                        90d
                    </button>
                    <button
                        type="button"
                        onClick={() => setDateRange("1y")}
                        className={dateRange === "1y" ? "is-active" : ""}
                    >
                        1y
                    </button>
                    <button
                        type="button"
                        onClick={() => setDateRange("max")}
                        className={dateRange === "max" ? "is-active" : ""}
                    >
                        Max
                    </button>
                </div>
            </section>

            {/* Country selection */}
            <section className="section" aria-label="Select country">
                <h2 className="section-title">Select country</h2>

                <div className="country-grid">
                    {COUNTRY_CONFIG.map((c) => {
                        const active = c.key === selectedCountry;
                        return (
                            <button
                                key={c.key}
                                type="button"
                                onClick={() => setSelectedCountry(c.key)}
                                className={`country-card ${
                                    active ? "is-active" : ""
                                }`}
                            >
                                <div style={{ fontWeight: 600 }}>{c.label}</div>
                                <div className="country-card-code">{c.key}</div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Compare country selection */}
            {viewMode === "compare" && (
                <section
                    className="section"
                    aria-label="Compare with another country"
                >
                    <h3 className="section-title" style={{ fontSize: 16 }}>
                        Compare with another country
                    </h3>
                    <div className="chip-row">
                        {COUNTRY_CONFIG.filter(
                            (c) => c.key !== selectedCountry
                        ).map((c) => {
                            const active = c.key === compareCountry;
                            return (
                                <button
                                    key={c.key}
                                    type="button"
                                    onClick={() => setCompareCountry(c.key)}
                                    className={`chip ${
                                        active ? "is-active" : ""
                                    }`}
                                >
                                    {c.label}
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Loading / Error */}
            {loading && (
                <>
                    <div className="loading-text">Loading data…</div>
                    <section
                        className="section summary-grid"
                        aria-hidden="true"
                    >
                        <div className="card skeleton-card" />
                        <div className="card skeleton-card" />
                        <div className="card skeleton-card" />
                        <div className="card skeleton-card" />
                    </section>
                    <section className="chart-card section" aria-hidden="true">
                        <div className="skeleton-chart" />
                    </section>
                </>
            )}

            {error && !loading && (
                <div className="error-text">
                    Error loading data: {error.message}
                </div>
            )}

            {/* SINGLE VIEW */}
            {!loading && !error && viewMode === "single" && (
                <>
                    {/* Summary cards */}
                    <section
                        className="section summary-grid"
                        aria-label="Key metrics"
                    >
                        <SummaryCard
                            theme={theme}
                            title="Latest new cases"
                            value={
                                latestA ? formatNumber(latestA.newCases) : "—"
                            }
                            subtitle={`Source: ${
                                covidSource === "who" ? "WHO / Pomber" : "TE"
                            }`}
                            trend={casesTrend}
                            trendLabel="7-day trend"
                        />
                        <SummaryCard
                            theme={theme}
                            title="Total confirmed"
                            value={
                                latestA ? formatNumber(latestA.confirmed) : "—"
                            }
                        />
                        <SummaryCard
                            theme={theme}
                            title="Total deaths"
                            value={
                                latestA && latestA.deaths != null
                                    ? formatNumber(latestA.deaths)
                                    : "—"
                            }
                        />
                        <SummaryCard
                            theme={theme}
                            title="Latest GDP growth"
                            value={
                                latestGdpA && latestGdpA.gdpGrowth != null
                                    ? `${latestGdpA.gdpGrowth.toFixed(1)}%`
                                    : "—"
                            }
                            subtitle="GDP: World Bank + TradingEconomics (token)"
                            trend={gdpTrend}
                            trendLabel="Recent trend"
                        />
                    </section>

                    {/* Rolling toggle */}
                    <section className="rolling-toggle">
                        <button
                            type="button"
                            onClick={() => setShowRolling((v) => !v)}
                        >
                            {showRolling
                                ? "Show daily values"
                                : "Show 7-day averages"}
                        </button>
                    </section>

                    {/* Time-series chart */}
                    <section className="chart-card section">
                        <h2 className="section-title">
                            COVID vs GDP Over Time
                        </h2>
                        <figure aria-label="Line chart showing COVID cases and GDP growth over time for the selected country.">
                            <div className="chart-container">
                                <Line
                                    data={timeSeriesDataSingle}
                                    options={timeSeriesOptionsSingle}
                                />
                            </div>
                            <figcaption
                                style={{
                                    fontSize: 11,
                                    color: "#555",
                                    marginTop: 4,
                                }}
                            >
                                Visual summary of the joined COVID–GDP dataset
                                shown in the table below.
                            </figcaption>
                        </figure>
                    </section>

                    {/* Data preview + CSV export */}
                    <DataPreviewTable
                        theme={theme}
                        combined={combinedAFiltered}
                        title="COVID-GDP Data"
                    />
                </>
            )}

            {/* COMPARE VIEW */}
            {!loading && !error && viewMode === "compare" && (
                <>
                    {/* Summary cards */}
                    <section
                        className="section summary-grid"
                        aria-label="Key metrics (comparison)"
                    >
                        <SummaryCard
                            theme={theme}
                            title={`Latest new cases (${selectedCountry})`}
                            value={
                                latestA ? formatNumber(latestA.newCases) : "—"
                            }
                            subtitle={`Confirmed: ${
                                latestA ? formatNumber(latestA.confirmed) : "—"
                            }`}
                        />
                        <SummaryCard
                            theme={theme}
                            title={`Latest new cases (${compareCountry})`}
                            value={
                                latestB ? formatNumber(latestB.newCases) : "—"
                            }
                            subtitle={`Confirmed: ${
                                latestB ? formatNumber(latestB.confirmed) : "—"
                            }`}
                        />
                        <SummaryCard
                            theme={theme}
                            title={`Latest GDP growth (${selectedCountry})`}
                            value={
                                latestGdpA && latestGdpA.gdpGrowth != null
                                    ? `${latestGdpA.gdpGrowth.toFixed(1)}%`
                                    : "—"
                            }
                        />
                        <SummaryCard
                            theme={theme}
                            title={`Latest GDP growth (${compareCountry})`}
                            value={
                                latestGdpB && latestGdpB.gdpGrowth != null
                                    ? `${latestGdpB.gdpGrowth.toFixed(1)}%`
                                    : "—"
                            }
                        />
                    </section>

                    {/* Comparison chart */}
                    <section className="chart-card section">
                        <h2 className="section-title">
                            Country comparison: COVID & GDP
                        </h2>
                        <p className="section-subtitle">
                            Compare daily new cases and GDP growth between two
                            countries.
                        </p>
                        <figure aria-label="Line chart comparing COVID cases and GDP growth between two countries.">
                            <div className="chart-container">
                                <Line
                                    data={timeSeriesDataCompare}
                                    options={timeSeriesOptionsCompare}
                                />
                            </div>
                            <figcaption
                                style={{
                                    fontSize: 11,
                                    color: "#555",
                                    marginTop: 4,
                                }}
                            >
                                Both countries are shown on the same date axis
                                for direct comparison.
                            </figcaption>
                        </figure>
                    </section>

                    {/* Data preview */}
                    <DataPreviewTable
                        theme={theme}
                        combined={combinedAFiltered}
                        title={`Sample data (${selectedCountry})`}
                    />
                </>
            )}

            {/* Footer */}
            <footer className="app-footer">
                <div>
                    Data sources: WHO, World Bank, TradingEconomics
                    (token-protected GDP API).
                </div>
            </footer>
        </main>
    );
}

export default Dashboard;

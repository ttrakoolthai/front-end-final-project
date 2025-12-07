import React, { useState } from "react";
import { useCovidGdpApiData } from "../hooks/useCovidGdpApiData";

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
import { Line, Scatter } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title
);

// Countries: 6 using World Bank, 4 using TradingEconomics (API key)
const COUNTRY_OPTIONS = [
    { key: "US", label: "United States (World Bank)" },
    { key: "DE", label: "Germany (World Bank)" },
    { key: "IT", label: "Italy (World Bank)" },
    { key: "JP", label: "Japan (World Bank)" },
    { key: "CA", label: "Canada (World Bank)" },
    { key: "FR", label: "France (World Bank)" },

    { key: "SE", label: "Sweden (TradingEconomics)" },
    { key: "MX", label: "Mexico (TradingEconomics)" },
    { key: "NZ", label: "New Zealand (TradingEconomics)" },
    { key: "TH", label: "Thailand (TradingEconomics)" },
];

// Compute some summary metrics from the joined dataset
function computeMetrics(combined) {
    if (!combined || combined.length === 0) return null;

    let peakCases = combined[0].newCases;
    let peakCasesDate = combined[0].date;

    let worstGdp = null;
    let worstGdpDate = null;

    combined.forEach((row) => {
        if (row.newCases > peakCases) {
            peakCases = row.newCases;
            peakCasesDate = row.date;
        }
        if (row.gdpGrowth != null) {
            if (worstGdp == null || row.gdpGrowth < worstGdp) {
                worstGdp = row.gdpGrowth;
                worstGdpDate = row.date;
            }
        }
    });

    // correlation between new cases and GDP growth (only where GDP is not null)
    let corr = null;
    const valid = combined.filter(
        (r) => r.gdpGrowth != null && !Number.isNaN(r.gdpGrowth)
    );
    if (valid.length > 1) {
        const xs = valid.map((r) => r.newCases);
        const ys = valid.map((r) => r.gdpGrowth);

        const n = xs.length;
        const meanX = xs.reduce((a, b) => a + b, 0) / n;
        const meanY = ys.reduce((a, b) => a + b, 0) / n;

        let cov = 0;
        let varX = 0;
        let varY = 0;

        for (let i = 0; i < n; i++) {
            const dx = xs[i] - meanX;
            const dy = ys[i] - meanY;
            cov += dx * dy;
            varX += dx * dx;
            varY += dy * dy;
        }

        if (varX > 0 && varY > 0) {
            corr = cov / Math.sqrt(varX * varY);
        }
    }

    return { peakCases, peakCasesDate, worstGdp, worstGdpDate, corr };
}

function Dashboard() {
    const [selectedCountryKey, setSelectedCountryKey] = useState("US");

    const selectedCountry =
        COUNTRY_OPTIONS.find((c) => c.key === selectedCountryKey) ||
        COUNTRY_OPTIONS[0];

    const { loading, error, combined, covidDaily, gdpSeries } =
        useCovidGdpApiData(selectedCountryKey);

    if (loading) {
        return (
            <main className="page dashboard">
                <Header />
                <CountryCards
                    selectedKey={selectedCountryKey}
                    onSelect={setSelectedCountryKey}
                />
                <p>Loading live COVID + GDP data…</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page dashboard">
                <Header />
                <CountryCards
                    selectedKey={selectedCountryKey}
                    onSelect={setSelectedCountryKey}
                />
                <p style={{ color: "red" }}>
                    Error loading data: {error.message}
                </p>
            </main>
        );
    }

    if (!combined || combined.length === 0) {
        return (
            <main className="page dashboard">
                <Header />
                <CountryCards
                    selectedKey={selectedCountryKey}
                    onSelect={setSelectedCountryKey}
                />
                <p>No matched COVID + GDP data for this country.</p>
            </main>
        );
    }

    const metrics = computeMetrics(combined);

    // Prepare chart data
    const labels = combined.map((row) => row.date);
    const newCases = combined.map((row) => row.newCases);
    const gdpGrowth = combined.map((row) =>
        row.gdpGrowth != null ? row.gdpGrowth : null
    );

    const timeSeriesData = {
        labels,
        datasets: [
            {
                label: "New COVID-19 cases (daily)",
                data: newCases,
                yAxisID: "yCases",
                tension: 0.25,
                borderColor: "#d9534f",
                pointRadius: 0,
            },
            {
                label: "GDP growth (%)",
                data: gdpGrowth,
                yAxisID: "yGdp",
                tension: 0.25,
                borderColor: "#0275d8",
                pointRadius: 0,
            },
        ],
    };

    const timeSeriesOptions = {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: { position: "top" },
            title: {
                display: true,
                text: `${selectedCountry.label}: COVID-19 vs GDP growth`,
            },
        },
        scales: {
            x: {
                ticks: { maxTicksLimit: 10 },
            },
            yCases: {
                type: "linear",
                position: "left",
                title: { display: true, text: "New cases (daily)" },
            },
            yGdp: {
                type: "linear",
                position: "right",
                title: { display: true, text: "GDP growth (%)" },
                grid: { drawOnChartArea: false },
            },
        },
    };

    const phaseData = {
        datasets: [
            {
                label: "GDP growth vs new cases",
                data: combined
                    .filter((r) => r.gdpGrowth != null)
                    .map((r) => ({
                        x: r.gdpGrowth,
                        y: r.newCases,
                    })),
                pointRadius: 3,
                backgroundColor: "#5bc0de",
            },
        ],
    };

    const phaseOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" },
            title: {
                display: true,
                text: `Scatter: GDP growth vs COVID-19 cases (${selectedCountry.label})`,
            },
        },
        scales: {
            x: { title: { display: true, text: "GDP growth (%)" } },
            y: { title: { display: true, text: "New COVID-19 cases (daily)" } },
        },
    };

    const previewRows = combined.slice(0, 30);

    return (
        <main className="page dashboard">
            <Header />

            <CountryCards
                selectedKey={selectedCountryKey}
                onSelect={setSelectedCountryKey}
            />

            <SummaryCards
                countryName={selectedCountry.label}
                metrics={metrics}
                totalCovidRecords={covidDaily.length}
                totalGdpRecords={gdpSeries.length}
            />

            <section style={{ marginTop: "2rem", maxWidth: "1000px" }}>
                <Line data={timeSeriesData} options={timeSeriesOptions} />
            </section>

            <section style={{ marginTop: "2rem", maxWidth: "800px" }}>
                <Scatter data={phaseData} options={phaseOptions} />
            </section>

            <section style={{ marginTop: "2rem" }}>
                <h2>Sample of joined data</h2>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>New Cases</th>
                                <th>Total Confirmed</th>
                                <th>Total Deaths</th>
                                <th>GDP growth (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewRows.map((row) => (
                                <tr key={row.date}>
                                    <td>{row.date}</td>
                                    <td>{row.newCases.toLocaleString()}</td>
                                    <td>{row.confirmed.toLocaleString()}</td>
                                    <td>{row.deaths.toLocaleString()}</td>
                                    <td>
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
        </main>
    );
}

function Header() {
    return (
        <header>
            <h1>COVID-19 & Economic Activity Dashboard</h1>
            <p>
                COVID-19 daily cases from{" "}
                <a href="https://pomber.github.io/covid19/timeseries.json">
                    pomber / WHO
                </a>{" "}
                and GDP growth from{" "}
                <a href="https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG">
                    World Bank
                </a>{" "}
                (for most countries) plus{" "}
                <a href="https://developer.tradingeconomics.com/">
                    TradingEconomics API
                </a>{" "}
                (token-protected, used for Sweden, Mexico, New Zealand, and
                Thailand).
            </p>
        </header>
    );
}

function CountryCards({ selectedKey, onSelect }) {
    return (
        <section className="country-section">
            <h2>Select a country</h2>
            <div className="country-list">
                {COUNTRY_OPTIONS.map((c) => {
                    const active = c.key === selectedKey;
                    return (
                        <button
                            key={c.key}
                            onClick={() => onSelect(c.key)}
                            className={
                                active ? "country-card active" : "country-card"
                            }
                        >
                            <strong>{c.label}</strong>
                            <div className="country-sub">
                                {active ? "Selected" : "Click to view"}
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function SummaryCards({
    countryName,
    metrics,
    totalCovidRecords,
    totalGdpRecords,
}) {
    if (!metrics) return null;

    const { peakCases, peakCasesDate, worstGdp, worstGdpDate, corr } = metrics;

    return (
        <section className="summary-section">
            <h2>Summary metrics – {countryName}</h2>
            <div className="summary-row">
                <div className="summary-card">
                    <h4>Peak new cases</h4>
                    <p>{peakCases.toLocaleString()}</p>
                    <p className="summary-sub">on {peakCasesDate}</p>
                </div>
                <div className="summary-card">
                    <h4>Worst GDP period</h4>
                    <p>{worstGdp != null ? worstGdp.toFixed(2) : "—"}%</p>
                    <p className="summary-sub">
                        {worstGdpDate ? `around ${worstGdpDate}` : "no data"}
                    </p>
                </div>
                <div className="summary-card">
                    <h4>Cases–GDP correlation</h4>
                    <p>{corr != null ? corr.toFixed(2) : "N/A"}</p>
                    <p className="summary-sub">
                        {totalCovidRecords} COVID points, {totalGdpRecords} GDP
                        points
                    </p>
                </div>
            </div>
        </section>
    );
}

export default Dashboard;

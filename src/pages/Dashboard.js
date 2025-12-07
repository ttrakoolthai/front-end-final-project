// src/pages/Dashboard.js
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

// Countries we support – note: pomber uses country codes like "US", "Italy", etc.
// World Bank uses ISO2 like "US", "DE", "IT", etc.
const COUNTRY_OPTIONS = [
    { key: "US", label: "United States" },
    { key: "DE", label: "Germany" },
    { key: "IT", label: "Italy" },
    { key: "JP", label: "Japan" },
    { key: "CA", label: "Canada" },
    { key: "FR", label: "France" },
];

// Compute basic summary stats
function computeMetrics(combined) {
    if (!combined || combined.length === 0) return null;

    let peakCases = combined[0].newCases;
    let peakCasesDate = combined[0].date;

    let worstGdp = combined[0].gdpGrowth;
    let worstGdpDate = combined[0].date;

    combined.forEach((row) => {
        if (row.newCases > peakCases) {
            peakCases = row.newCases;
            peakCasesDate = row.date;
        }
        if (row.gdpGrowth < worstGdp) {
            worstGdp = row.gdpGrowth;
            worstGdpDate = row.date;
        }
    });

    // correlation between newCases and gdpGrowth
    let corr = null;
    if (combined.length > 1) {
        const xs = combined.map((r) => r.newCases);
        const ys = combined.map((r) => r.gdpGrowth);

        const n = xs.length;
        const meanX = xs.reduce((s, v) => s + v, 0) / n;
        const meanY = ys.reduce((s, v) => s + v, 0) / n;

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

    const { loading, error, combined, covidDaily, gdpWeekly } =
        useCovidGdpApiData(selectedCountryKey);

    if (loading) {
        return (
            <main className="page dashboard">
                <Header />
                <CountryCards
                    selectedKey={selectedCountryKey}
                    onSelect={setSelectedCountryKey}
                />
                <p>Loading live data from APIs…</p>
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
                <p>No joined COVID + GDP data available for this country.</p>
            </main>
        );
    }

    const metrics = computeMetrics(combined);

    const labels = combined.map((row) => row.date);
    const newCases = combined.map((row) => row.newCases);
    const gdpGrowth = combined.map((row) => row.gdpGrowth);

    const timeSeriesData = {
        labels,
        datasets: [
            {
                label: `New COVID-19 cases (daily, ${selectedCountry.label})`,
                data: newCases,
                yAxisID: "yCases",
                tension: 0.25,
                pointRadius: 0,
            },
            {
                label: `Annual GDP growth (%) – ${selectedCountry.label}`,
                data: gdpGrowth,
                yAxisID: "yGdp",
                tension: 0.25,
                pointRadius: 0,
            },
        ],
    };

    const timeSeriesOptions = {
        responsive: true,
        interaction: {
            mode: "index",
            intersect: false,
        },
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: `${selectedCountry.label}: COVID-19 new cases vs annual GDP growth`,
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Date",
                },
                ticks: {
                    maxTicksLimit: 10,
                },
            },
            yCases: {
                type: "linear",
                position: "left",
                title: {
                    display: true,
                    text: "New cases (daily)",
                },
            },
            yGdp: {
                type: "linear",
                position: "right",
                title: {
                    display: true,
                    text: "Annual GDP growth (%)",
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
    };

    const phaseData = {
        datasets: [
            {
                label: "Daily observations with annual GDP attached",
                data: combined.map((row) => ({
                    x: row.gdpGrowth,
                    y: row.newCases,
                })),
                pointRadius: 3,
            },
        ],
    };

    const phaseOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: `Scatter plot: GDP growth vs new COVID-19 cases (${selectedCountry.label})`,
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const idx = ctx.dataIndex;
                        const row = combined[idx];
                        return `Date: ${
                            row.date
                        } | New cases: ${row.newCases.toLocaleString()} | GDP: ${row.gdpGrowth.toFixed(
                            2
                        )}%`;
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Annual GDP growth (%)",
                },
            },
            y: {
                title: {
                    display: true,
                    text: "New COVID-19 cases (daily)",
                },
            },
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
                totalGdpRecords={gdpWeekly.length}
            />

            <section style={{ marginTop: "2rem", maxWidth: "1000px" }}>
                <h2>Time series: COVID-19 new cases vs GDP growth</h2>
                <Line data={timeSeriesData} options={timeSeriesOptions} />
            </section>

            <section style={{ marginTop: "2.5rem", maxWidth: "800px" }}>
                <h2>Scatter: GDP growth vs COVID-19 cases</h2>
                <Scatter data={phaseData} options={phaseOptions} />
                <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
                    Each point attaches an annual GDP growth value to a daily
                    new cases observation for this country. This gives a rough
                    view of how economic performance and pandemic intensity move
                    together over time.
                </p>
            </section>

            <section style={{ marginTop: "2.5rem" }}>
                <h2>Sample of joined data (first 30 days with GDP attached)</h2>
                <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>New cases (daily)</th>
                                <th>Cumulative cases</th>
                                <th>Deaths (cumulative)</th>
                                <th>Annual GDP growth (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewRows.map((row) => (
                                <tr key={row.date}>
                                    <td>{row.date}</td>
                                    <td>{row.newCases.toLocaleString()}</td>
                                    <td>{row.confirmed.toLocaleString()}</td>
                                    <td>{row.deaths.toLocaleString()}</td>
                                    <td>{row.gdpGrowth.toFixed(2)}</td>
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
            <h1>COVID–19 vs Economic Activity</h1>
            <p>
                Live data from{" "}
                <a
                    href="https://pomber.github.io/covid19/timeseries.json"
                    target="_blank"
                    rel="noreferrer"
                >
                    pomber COVID-19 time series
                </a>{" "}
                and{" "}
                <a
                    href="https://api.worldbank.org/v2/country/US/indicator/NY.GDP.MKTP.KD.ZG?format=json"
                    target="_blank"
                    rel="noreferrer"
                >
                    World Bank GDP growth API
                </a>
                .
            </p>
        </header>
    );
}

function CountryCards({ selectedKey, onSelect }) {
    return (
        <section style={{ marginTop: "1.5rem" }}>
            <h2>Select country</h2>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginTop: "0.75rem",
                }}
            >
                {COUNTRY_OPTIONS.map((c) => {
                    const isActive = c.key === selectedKey;
                    return (
                        <button
                            key={c.key}
                            type="button"
                            onClick={() => onSelect(c.key)}
                            style={{
                                minWidth: "150px",
                                padding: "0.75rem 1rem",
                                borderRadius: "0.75rem",
                                border: isActive
                                    ? "2px solid #0d6efd"
                                    : "1px solid #ccc",
                                backgroundColor: isActive ? "#e7f1ff" : "#fff",
                                boxShadow: isActive
                                    ? "0 0 0 2px rgba(13,110,253,0.25)"
                                    : "0 1px 3px rgba(0,0,0,0.08)",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 600,
                                    marginBottom: "0.25rem",
                                }}
                            >
                                {c.label}
                            </div>
                            <div
                                style={{
                                    fontSize: "0.8rem",
                                    opacity: 0.8,
                                }}
                            >
                                {isActive ? "Selected" : "Click to view"}
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

    const corrDisplay =
        corr == null
            ? "N/A"
            : corr.toFixed(2) + (corr > 0 ? " (positive)" : " (negative)");

    const cardStyle = {
        flex: "1 1 220px",
        padding: "1rem",
        borderRadius: "0.75rem",
        border: "1px solid #e0e0e0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        backgroundColor: "#fff",
    };

    return (
        <section style={{ marginTop: "1.75rem" }}>
            <h2>Summary metrics ({countryName})</h2>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginTop: "0.75rem",
                }}
            >
                <div style={cardStyle}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                        Peak new cases
                    </div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                        {peakCases.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        on <strong>{peakCasesDate}</strong>
                    </div>
                    <div
                        style={{
                            fontSize: "0.75rem",
                            marginTop: "0.5rem",
                            opacity: 0.7,
                        }}
                    >
                        Based on joined COVID–GDP series ({totalCovidRecords}{" "}
                        daily records).
                    </div>
                </div>

                <div style={cardStyle}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                        Worst GDP year
                    </div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                        {worstGdp.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        in <strong>{worstGdpDate.substring(0, 4)}</strong>
                    </div>
                    <div
                        style={{
                            fontSize: "0.75rem",
                            marginTop: "0.5rem",
                            opacity: 0.7,
                        }}
                    >
                        Based on World Bank annual GDP growth data (
                        {totalGdpRecords} records).
                    </div>
                </div>

                <div style={cardStyle}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                        Cases–GDP correlation
                    </div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                        {corrDisplay}
                    </div>
                    <div
                        style={{
                            fontSize: "0.75rem",
                            marginTop: "0.5rem",
                            opacity: 0.7,
                        }}
                    >
                        Pearson correlation between daily new cases and annual
                        GDP growth on the joined series.
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Dashboard;

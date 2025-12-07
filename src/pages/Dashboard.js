// src/pages/Dashboard.js
import React, { useState } from "react";
import { useCovidGdpApiData } from "../hooks/useCovidGdpApiData";

// Chart.js + react-chartjs-2
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

// Countries we support (COVID key + label)
const COUNTRY_OPTIONS = [
    { key: "US", label: "United States" },
    { key: "Germany", label: "Germany" },
    { key: "Italy", label: "Italy" },
    { key: "Japan", label: "Japan" },
    { key: "Canada", label: "Canada" },
    { key: "France", label: "France" },
];

// Helper: compute summary metrics from combined series
function computeMetrics(combined) {
    if (!combined || combined.length === 0) {
        return null;
    }

    // Peak new cases
    let peakCases = combined[0].newCases;
    let peakCasesDate = combined[0].date;
    combined.forEach((row) => {
        if (row.newCases > peakCases) {
            peakCases = row.newCases;
            peakCasesDate = row.date;
        }
    });

    // Worst GDP (min value)
    let worstGdp = combined[0].gdpGrowth;
    let worstGdpDate = combined[0].date;
    combined.forEach((row) => {
        if (row.gdpGrowth < worstGdp) {
            worstGdp = row.gdpGrowth;
            worstGdpDate = row.date;
        }
    });

    // Correlation between newCases and gdpGrowth
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
        } else {
            corr = null;
        }
    }

    return {
        peakCases,
        peakCasesDate,
        worstGdp,
        worstGdpDate,
        corr,
    };
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

    // ----- Metrics -----
    const metrics = computeMetrics(combined);

    // ----- Build chart datasets from combined -----

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
                label: `Weekly GDP growth YoY (%) – ${selectedCountry.label}`,
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
                text: `${selectedCountry.label}: COVID-19 new cases vs weekly GDP growth (API data)`,
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
                    text: "GDP growth YoY (%)",
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
                label: "Weekly observations",
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
                text: `Phase plot: GDP growth vs new COVID-19 cases (${selectedCountry.label})`,
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const idx = ctx.dataIndex;
                        const row = combined[idx];
                        return `Date: ${
                            row.date
                        } | New cases: ${row.newCases.toLocaleString()} | GDP: ${row.gdpGrowth.toFixed(
                            3
                        )}%`;
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Weekly GDP growth YoY (%)",
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
                <h2>Phase plot: GDP vs COVID (Lotka–Volterra-style view)</h2>
                <Scatter data={phaseData} options={phaseOptions} />
                <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
                    Each point is a week where we have both GDP growth and COVID
                    new case data. In the paper you’re using, similar phase
                    plots are used to argue that COVID–economy co-dynamics
                    resemble a Lotka–Volterra prey–predator system.
                </p>
            </section>

            <section style={{ marginTop: "2.5rem" }}>
                <h2>Sample of joined data (first 30 weeks)</h2>
                <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>New cases (daily)</th>
                                <th>Cumulative cases</th>
                                <th>Deaths (cumulative)</th>
                                <th>GDP growth YoY (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewRows.map((row) => (
                                <tr key={row.date}>
                                    <td>{row.date}</td>
                                    <td>{row.newCases.toLocaleString()}</td>
                                    <td>{row.confirmed.toLocaleString()}</td>
                                    <td>{row.deaths.toLocaleString()}</td>
                                    <td>{row.gdpGrowth.toFixed(3)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}

// Header separated just for cleanliness
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
                    href="https://db.nomics.world/OECD/GDP_GROWTH"
                    target="_blank"
                    rel="noreferrer"
                >
                    OECD Weekly GDP Tracker via DB.nomics
                </a>
                .
            </p>
        </header>
    );
}

// Card-based country selector
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

// Summary metrics cards
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
                {/* Peak cases */}
                <div
                    style={{
                        flex: "1 1 220px",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        border: "1px solid #e0e0e0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        backgroundColor: "#fff",
                    }}
                >
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

                {/* Worst GDP */}
                <div
                    style={{
                        flex: "1 1 220px",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        border: "1px solid #e0e0e0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        backgroundColor: "#fff",
                    }}
                >
                    <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                        Worst GDP week
                    </div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                        {worstGdp.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        on <strong>{worstGdpDate}</strong>
                    </div>
                    <div
                        style={{
                            fontSize: "0.75rem",
                            marginTop: "0.5rem",
                            opacity: 0.7,
                        }}
                    >
                        Based on OECD Weekly Tracker ({totalGdpRecords} weekly
                        observations).
                    </div>
                </div>

                {/* Correlation */}
                <div
                    style={{
                        flex: "1 1 220px",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        border: "1px solid #e0e0e0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        backgroundColor: "#fff",
                    }}
                >
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
                        Pearson correlation between daily new cases and weekly
                        GDP growth on the joined series.
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Dashboard;

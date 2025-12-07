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

function Dashboard() {
    const [selectedCountryKey, setSelectedCountryKey] = useState("US");

    const selectedCountry =
        COUNTRY_OPTIONS.find((c) => c.key === selectedCountryKey) ||
        COUNTRY_OPTIONS[0];

    const { loading, error, combined, covidDaily, gdpWeekly } =
        useCovidGdpApiData(selectedCountryKey);

    // ----- Render states -----

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

            <section style={{ marginTop: "1.5rem" }}>
                <h2>Dataset overview ({selectedCountry.label})</h2>
                <ul>
                    <li>Total COVID daily records: {covidDaily.length}</li>
                    <li>Total GDP weekly points: {gdpWeekly.length}</li>
                    <li>Joined (matching-date) points: {combined.length}</li>
                </ul>
            </section>

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

export default Dashboard;

import React from "react";
import { formatNumber } from "../utils/formatters";

function DataPreviewTable({ theme, combined, title }) {
    if (!combined || combined.length === 0) {
        return null;
    }

    const sampleSize = 12;
    const rows = combined.slice(-sampleSize).reverse(); // latest first

    const handleDownloadCsv = () => {
        if (!combined || combined.length === 0) return;

        const headers = [
            "date",
            "newCases",
            "confirmed",
            "deaths",
            "gdpGrowth",
        ];
        const csvRows = [
            headers.join(","),
            ...combined.map((row) =>
                [
                    row.date,
                    row.newCases ?? "",
                    row.confirmed ?? "",
                    row.deaths ?? "",
                    row.gdpGrowth ?? "",
                ].join(",")
            ),
        ];
        const csvString = csvRows.join("\n");

        const blob = new Blob([csvString], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeTitle = (title || "data")
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^\w\-]+/g, "");
        a.href = url;
        a.download = `${safeTitle}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <section className="section">
            <div className="data-table-header-row">
                <div className="data-table-title">
                    {title || "Joined COVID–GDP data"}
                </div>
                <button
                    type="button"
                    className="data-table-download-button"
                    onClick={handleDownloadCsv}
                >
                    ⬇ Download CSV
                </button>
            </div>

            <p className="section-subtitle">
                Joined dataset used for the chart above, combining COVID-19
                daily stats and GDP growth for the selected country.
            </p>

            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th
                                style={{
                                    textAlign: "left",
                                    background:
                                        theme.tableHeaderBg || "#fafafa",
                                }}
                            >
                                Date
                            </th>
                            <th
                                style={{
                                    background:
                                        theme.tableHeaderBg || "#fafafa",
                                }}
                            >
                                New cases
                            </th>
                            <th
                                style={{
                                    background:
                                        theme.tableHeaderBg || "#fafafa",
                                }}
                            >
                                Total cases
                            </th>
                            <th
                                style={{
                                    background:
                                        theme.tableHeaderBg || "#fafafa",
                                }}
                            >
                                Total deaths
                            </th>
                            <th
                                style={{
                                    background:
                                        theme.tableHeaderBg || "#fafafa",
                                }}
                            >
                                GDP growth (%)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.date}>
                                <td
                                    style={{
                                        textAlign: "left",
                                        color: theme.textPrimary,
                                    }}
                                >
                                    {row.date}
                                </td>
                                <td>
                                    {row.newCases != null
                                        ? formatNumber(row.newCases)
                                        : "—"}
                                </td>
                                <td>
                                    {row.confirmed != null
                                        ? formatNumber(row.confirmed)
                                        : "—"}
                                </td>
                                <td>
                                    {row.deaths != null
                                        ? formatNumber(row.deaths)
                                        : "—"}
                                </td>
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
    );
}

export default DataPreviewTable;

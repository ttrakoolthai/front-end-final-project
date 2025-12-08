import React from "react";

/**
 * SummaryCard
 *
 * Props:
 * - theme: color palette object
 * - title: string
 * - value: string | number
 * - subtitle?: string
 * - trend?: "up" | "down" | "flat" | { direction: "up"|"down"|"flat", delta?: number }
 * - trendLabel?: string (e.g. "7-day trend")
 */
function SummaryCard({ theme, title, value, subtitle, trend, trendLabel }) {
    // Allow both a plain string ("up") and an object ({ direction, delta })
    const direction =
        trend && typeof trend === "object" ? trend.direction : trend;
    const delta =
        trend && typeof trend === "object" && typeof trend.delta === "number"
            ? trend.delta
            : null;

    let arrow = "";
    let color = theme.textSecondary;
    let text = "";

    if (direction === "up") {
        arrow = "▲";
        color = "#2e7d32"; // green-ish
        text = "Rising";
    } else if (direction === "down") {
        arrow = "▼";
        color = "#c62828"; // red-ish
        text = "Falling";
    } else if (direction === "flat") {
        arrow = "●";
        color = "#616161"; // neutral
        text = "Flat";
    }

    let labelText = text;
    if (trendLabel && text) {
        labelText = `${trendLabel}: ${text}`;
    }

    // If there is a numeric delta, append a simple change indicator
    if (labelText && delta != null) {
        const signed = delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
        labelText += ` (${signed})`;
    }

    return (
        <div
            className="card"
            style={{
                background: theme.cardBg,
                borderColor: theme.border,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 90,
            }}
        >
            <div>
                <div
                    style={{
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: theme.textMuted,
                        marginBottom: 4,
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: theme.textPrimary,
                    }}
                >
                    {value}
                </div>
                {subtitle && (
                    <div
                        style={{
                            marginTop: 4,
                            fontSize: 11,
                            color: theme.textSecondary,
                        }}
                    >
                        {subtitle}
                    </div>
                )}
            </div>

            {labelText && (
                <div
                    style={{
                        marginTop: 8,
                        fontSize: 11,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color,
                    }}
                >
                    <span>{arrow}</span>
                    <span>{labelText}</span>
                </div>
            )}
        </div>
    );
}

export default SummaryCard;

import React from "react";
import { render, screen } from "@testing-library/react";
import SummaryCard from "../SummaryCard";

const mockTheme = {
    background: "#f5f5f5",
    textPrimary: "#111",
    textSecondary: "#555",
    textMuted: "#555",
    cardBg: "#ffffff",
    border: "#e0e0e0",
};

describe("SummaryCard", () => {
    test("renders title and value", () => {
        render(
            <SummaryCard
                theme={mockTheme}
                title="Latest new cases"
                value="1,234"
            />
        );

        expect(screen.getByText(/latest new cases/i)).toBeInTheDocument();
        expect(screen.getByText("1,234")).toBeInTheDocument();
    });

    test("renders subtitle when provided", () => {
        render(
            <SummaryCard
                theme={mockTheme}
                title="Total deaths"
                value="56,789"
                subtitle="Cumulative"
            />
        );

        expect(screen.getByText("Cumulative")).toBeInTheDocument();
    });

    test("renders trend label when trend prop is provided", () => {
        render(
            <SummaryCard
                theme={mockTheme}
                title="GDP growth"
                value="2.5%"
                trend="up"
                trendLabel="7-day trend"
            />
        );

        expect(screen.getByText(/7-day trend/i)).toBeInTheDocument();
    });
});

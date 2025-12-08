// src/components/__tests__/DataPreviewTable.test.js
import React from "react";
import { render, screen, within } from "@testing-library/react";
import DataPreviewTable from "../DataPreviewTable";

const mockTheme = {
    background: "#f5f5f5",
    textPrimary: "#111",
    textSecondary: "#555",
    textMuted: "#555",
    cardBg: "#ffffff",
    border: "#e0e0e0",
};

const mockCombined = [
    {
        date: "2020-01-01",
        newCases: 10,
        confirmed: 10,
        deaths: 0,
        gdpGrowth: 1.2,
    },
    {
        date: "2020-01-02",
        newCases: 20,
        confirmed: 30,
        deaths: 1,
        gdpGrowth: 1.3,
    },
];

describe("DataPreviewTable", () => {
    test("renders title and table headers", () => {
        render(
            <DataPreviewTable
                theme={mockTheme}
                combined={mockCombined}
                title="Sample of joined data"
            />
        );

        // Title
        expect(screen.getByText(/sample of joined data/i)).toBeInTheDocument();

        // Column headers – match actual header text
        expect(
            screen.getByRole("columnheader", { name: /date/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("columnheader", { name: /new cases/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("columnheader", { name: /total cases/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("columnheader", { name: /total deaths/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("columnheader", { name: /gdp growth/i })
        ).toBeInTheDocument();
    });

    test("renders at least one row of data", () => {
        render(
            <DataPreviewTable
                theme={mockTheme}
                combined={mockCombined}
                title="Sample of joined data"
            />
        );

        // Find the row that contains the first date
        const row = screen.getByRole("row", { name: /2020-01-01/i });

        // Check that the row has the date
        expect(within(row).getByText(/2020-01-01/)).toBeInTheDocument();

        // Use a unique value in that row — GDP "1.20"
        // (Your component formats 1.2 => "1.20")
        expect(within(row).getByText("1.20")).toBeInTheDocument();
    });
});

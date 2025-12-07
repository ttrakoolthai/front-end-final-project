// src/hooks/useCovidGdpApiData.js
import { useEffect, useState } from "react";

// Map dashboard key → pomber COVID label
const COVID_COUNTRY_MAP = {
    US: "US",
    DE: "Germany",
    IT: "Italy",
    JP: "Japan",
    CA: "Canada",
    FR: "France",
    SE: "Sweden",
    MX: "Mexico",
    NZ: "New Zealand",
    TH: "Thailand",
};

// Which GDP source to prefer for each country
// (we now *prefer* TE for these 4 but will fall back to WB)
const GDP_SOURCE = {
    US: "worldbank",
    DE: "worldbank",
    IT: "worldbank",
    JP: "worldbank",
    CA: "worldbank",
    FR: "worldbank",

    SE: "tradingeconomics",
    MX: "tradingeconomics",
    NZ: "tradingeconomics",
    TH: "tradingeconomics",
};

// World Bank country codes (ISO3)
const WB_COUNTRY_MAP = {
    US: "USA",
    DE: "DEU",
    IT: "ITA",
    JP: "JPN",
    CA: "CAN",
    FR: "FRA",
    SE: "SWE",
    MX: "MEX",
    NZ: "NZL",
    TH: "THA",
};

// TradingEconomics country names (for the URL)
const TE_COUNTRY_MAP = {
    SE: "sweden",
    MX: "mexico",
    NZ: "new zealand",
    TH: "thailand",
};

// Helper: compute growth % series from value series (for TE level data)
function computeGrowthSeries(values) {
    return values.map((point, idx, arr) => {
        if (idx === 0) {
            return { ...point, growth: null };
        }
        const prev = arr[idx - 1].value;
        const growth =
            prev === 0 || prev == null
                ? null
                : ((point.value - prev) / prev) * 100;
        return { ...point, growth };
    });
}

async function fetchWorldBankGdp(wbCode) {
    // World Bank GDP growth (annual %)
    const wbUrl = `https://api.worldbank.org/v2/country/${wbCode}/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=100`;
    const wbRes = await fetch(wbUrl);
    if (!wbRes.ok) {
        const text = await wbRes.text();
        throw new Error(
            `World Bank GDP request failed (${wbRes.status}): ${
                text || "no body"
            }`
        );
    }

    const wbJson = await wbRes.json();
    const dataArray =
        Array.isArray(wbJson) && Array.isArray(wbJson[1]) ? wbJson[1] : [];

    const gdpValues = dataArray
        .filter((row) => row.value != null && row.date)
        .map((row) => ({
            // Convert year "2020" → "2020-12-31" to align with daily data
            date: `${row.date}-12-31`,
            value: Number(row.value),
            growth: Number(row.value), // already in percent
        }));

    gdpValues.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    return gdpValues;
}

/**
 * Hook: fetch COVID daily data + GDP data (WB OR TE w/ fallback) and join by date
 */
export function useCovidGdpApiData(countryKey) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [covidDaily, setCovidDaily] = useState([]);
    const [gdpSeries, setGdpSeries] = useState([]);
    const [combined, setCombined] = useState([]);

    const covidKey = COVID_COUNTRY_MAP[countryKey] || countryKey;
    const preferredSource = GDP_SOURCE[countryKey] || "worldbank";
    const wbCode = WB_COUNTRY_MAP[countryKey] || "USA";
    const teCountry = TE_COUNTRY_MAP[countryKey];
    const teApiKey = process.env.REACT_APP_TE_API_KEY;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);

            try {
                //
                // 1. COVID daily data from pomber
                //
                const covidRes = await fetch(
                    "https://pomber.github.io/covid19/timeseries.json"
                );
                if (!covidRes.ok) {
                    throw new Error("COVID API request failed");
                }
                const covidJson = await covidRes.json();
                const series = covidJson[covidKey];
                if (!series) {
                    throw new Error(`No COVID data for country: ${covidKey}`);
                }

                const covidWithNew = series.map((row, idx) => {
                    const prevConfirmed =
                        idx > 0 ? series[idx - 1].confirmed : 0;
                    const newCases = row.confirmed - prevConfirmed;
                    return {
                        date: row.date,
                        confirmed: row.confirmed,
                        deaths: row.deaths,
                        recovered: row.recovered,
                        newCases: newCases < 0 ? 0 : newCases,
                    };
                });

                //
                // 2. GDP data: try preferred source; if TE fails or empty, fall back to WB
                //
                let gdpWithGrowth = [];

                if (preferredSource === "tradingeconomics") {
                    let teOk = false;

                    if (!teApiKey) {
                        console.warn(
                            "Missing REACT_APP_TE_API_KEY; skipping TradingEconomics and using World Bank."
                        );
                    } else if (!teCountry) {
                        console.warn(
                            `No TradingEconomics mapping for ${countryKey}; using World Bank.`
                        );
                    } else {
                        try {
                            const teBase = "https://api.tradingeconomics.com";
                            const teUrl = `${teBase}/historical/country/${encodeURIComponent(
                                teCountry
                            )}/indicator/gdp?c=${encodeURIComponent(teApiKey)}`;

                            const gdpRes = await fetch(teUrl);
                            if (!gdpRes.ok) {
                                const text = await gdpRes.text();
                                console.warn(
                                    `TradingEconomics GDP request failed (${
                                        gdpRes.status
                                    }): ${text || "no body"}`
                                );
                            } else {
                                const teData = await gdpRes.json();
                                const gdpRaw = Array.isArray(teData)
                                    ? teData
                                    : [];

                                const gdpValues = gdpRaw
                                    .filter((row) => row.Value != null)
                                    .map((row) => ({
                                        date: row.Date
                                            ? row.Date.substring(0, 10)
                                            : null,
                                        value: Number(row.Value),
                                    }))
                                    .filter((row) => row.date != null);

                                gdpValues.sort((a, b) =>
                                    a.date < b.date
                                        ? -1
                                        : a.date > b.date
                                        ? 1
                                        : 0
                                );

                                if (gdpValues.length > 0) {
                                    gdpWithGrowth =
                                        computeGrowthSeries(gdpValues);
                                    teOk = true;
                                    console.log(
                                        `TradingEconomics GDP loaded for ${countryKey}, points:`,
                                        gdpWithGrowth.length
                                    );
                                } else {
                                    console.warn(
                                        `TradingEconomics returned no usable GDP values for ${countryKey}; falling back to World Bank.`
                                    );
                                }
                            }
                        } catch (teErr) {
                            console.warn(
                                `TradingEconomics error for ${countryKey}; falling back to World Bank:`,
                                teErr
                            );
                        }
                    }

                    // Fallback if TE failed or gave no data
                    if (!teOk) {
                        gdpWithGrowth = await fetchWorldBankGdp(wbCode);
                    }
                } else {
                    // preferred source is worldbank
                    gdpWithGrowth = await fetchWorldBankGdp(wbCode);
                }

                //
                // 3. Join GDP growth onto each daily COVID date (step-like)
                //
                let j = 0;
                const joined = covidWithNew.map((day) => {
                    const dayDate = day.date;
                    while (
                        j + 1 < gdpWithGrowth.length &&
                        gdpWithGrowth[j + 1].date <= dayDate
                    ) {
                        j++;
                    }
                    const gdpForDay = gdpWithGrowth[j] || null;

                    return {
                        date: day.date,
                        newCases: day.newCases,
                        confirmed: day.confirmed,
                        deaths: day.deaths,
                        gdpGrowth: gdpForDay ? gdpForDay.growth : null,
                    };
                });

                setCovidDaily(covidWithNew);
                setGdpSeries(gdpWithGrowth);
                setCombined(joined);
                setLoading(false);
            } catch (err) {
                console.error("useCovidGdpApiData error:", err);
                setError(err);
                setLoading(false);
            }
        }

        if (countryKey) {
            fetchData();
        }
    }, [countryKey, covidKey, preferredSource, wbCode, teCountry, teApiKey]);

    return { loading, error, covidDaily, gdpSeries, combined };
}

// src/hooks/useCovidGdpApiData.js
import { useEffect, useState } from "react";

// Dashboard key → pomber COVID label
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

// Preferred GDP source per country
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

// World Bank: ISO3 country codes
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

// TradingEconomics: country names for GDP
const TE_COUNTRY_MAP = {
    SE: "sweden",
    MX: "mexico",
    NZ: "new zealand",
    TH: "thailand",
};

// TradingEconomics: country names for COVID endpoint
const TE_COVID_COUNTRY_MAP = {
    US: "united states",
    DE: "germany",
    IT: "italy",
    JP: "japan",
    CA: "canada",
    FR: "france",
    SE: "sweden",
    MX: "mexico",
    NZ: "new zealand",
    TH: "thailand",
};

// Turn level series → growth% series (for TE GDP)
function computeGrowthFromLevels(values) {
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

// World Bank GDP growth (annual %)
async function fetchWorldBankGdp(wbCode) {
    const url = `https://api.worldbank.org/v2/country/${wbCode}/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=100`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(
            `World Bank GDP request failed (${res.status}): ${
                text || "no body"
            }`
        );
    }

    const json = await res.json();
    const entries =
        Array.isArray(json) && Array.isArray(json[1]) ? json[1] : [];

    const values = entries
        .filter((row) => row.value != null && row.date)
        .map((row) => ({
            date: `${row.date}-12-31`, // align year to a date
            value: Number(row.value),
            growth: Number(row.value), // already in %
        }));

    values.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return values;
}

// TradingEconomics GDP (levels → we compute growth)
async function fetchTradingEconomicsGdp(teCountry, apiKey, wbFallbackCode) {
    if (!apiKey || !teCountry) {
        return fetchWorldBankGdp(wbFallbackCode);
    }

    try {
        const base = "https://api.tradingeconomics.com";
        const url = `${base}/historical/country/${encodeURIComponent(
            teCountry
        )}/indicator/gdp?c=${encodeURIComponent(apiKey)}`;

        const res = await fetch(url);
        if (!res.ok) {
            return fetchWorldBankGdp(wbFallbackCode);
        }

        const json = await res.json();
        const raw = Array.isArray(json) ? json : [];

        const values = raw
            .filter((row) => row.Value != null)
            .map((row) => ({
                date: row.Date ? row.Date.substring(0, 10) : null,
                value: Number(row.Value),
            }))
            .filter((row) => row.date != null);

        if (values.length === 0) {
            return fetchWorldBankGdp(wbFallbackCode);
        }

        values.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        return computeGrowthFromLevels(values);
    } catch {
        return fetchWorldBankGdp(wbFallbackCode);
    }
}

// WHO/pomber COVID daily data
async function fetchWhoCovid(covidKey) {
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

    return series.map((row, idx) => {
        const prevConfirmed = idx > 0 ? series[idx - 1].confirmed : 0;
        const prevDeaths = idx > 0 ? series[idx - 1].deaths : 0;
        const newCases = row.confirmed - prevConfirmed;
        const newDeaths = row.deaths - prevDeaths;
        return {
            date: row.date,
            confirmed: row.confirmed,
            deaths: row.deaths,
            recovered: row.recovered,
            newCases: newCases < 0 ? 0 : newCases,
            newDeaths: newDeaths < 0 ? 0 : newDeaths,
        };
    });
}

// TradingEconomics COVID daily (falls back to WHO on problems)
async function fetchTradingEconomicsCovid(countryKey, apiKey) {
    const teCountry = TE_COVID_COUNTRY_MAP[countryKey];
    if (!apiKey || !teCountry) {
        throw new Error("Missing TradingEconomics COVID config");
    }

    const base = "https://api.tradingeconomics.com";
    const url = `${base}/coronavirus/country/${encodeURIComponent(
        teCountry
    )}?c=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`TradingEconomics COVID request failed: ${res.status}`);
    }

    const json = await res.json();
    const rows = Array.isArray(json) ? json : [json];

    const sorted = rows
        .filter((r) => r.Date && (r.Confirmed != null || r.TotalCases != null))
        .map((r) => ({
            date: r.Date.substring(0, 10),
            confirmed:
                r.Confirmed != null
                    ? Number(r.Confirmed)
                    : Number(r.TotalCases),
            deaths:
                r.Deaths != null
                    ? Number(r.Deaths)
                    : r.TotalDeaths != null
                    ? Number(r.TotalDeaths)
                    : null,
        }))
        .filter((r) => r.date);

    sorted.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    if (sorted.length === 0) {
        throw new Error("No usable TradingEconomics COVID rows");
    }

    // derive newCases / newDeaths from cumulative
    return sorted.map((row, idx) => {
        const prev = idx > 0 ? sorted[idx - 1] : { confirmed: 0, deaths: 0 };
        const newCases = row.confirmed - prev.confirmed;
        const newDeaths =
            row.deaths != null && prev.deaths != null
                ? row.deaths - prev.deaths
                : null;
        return {
            date: row.date,
            confirmed: row.confirmed,
            deaths: row.deaths,
            recovered: null,
            newCases: newCases < 0 ? 0 : newCases,
            newDeaths: newDeaths == null ? null : newDeaths < 0 ? 0 : newDeaths,
        };
    });
}

/**
 * Public hook: fetch COVID + GDP and join them by date.
 *
 * @param {string} countryKey - e.g. "US", "DE", "SE"
 * @param {"who" | "te"} covidSource - preferred COVID data source
 */
export function useCovidGdpApiData(countryKey, covidSource = "who") {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [covidDaily, setCovidDaily] = useState([]);
    const [gdpSeries, setGdpSeries] = useState([]);
    const [combined, setCombined] = useState([]);

    const covidKey = COVID_COUNTRY_MAP[countryKey] || countryKey;
    const preferredSource = GDP_SOURCE[countryKey] || "worldbank";
    const wbCode = WB_COUNTRY_MAP[countryKey] || "USA";
    const teGdpCountry = TE_COUNTRY_MAP[countryKey];
    const teApiKey = process.env.REACT_APP_TE_API_KEY;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);

            try {
                // 1. COVID: WHO vs TE (with fallback to WHO)
                let covidSeries;
                if (covidSource === "te") {
                    try {
                        covidSeries = await fetchTradingEconomicsCovid(
                            countryKey,
                            teApiKey
                        );
                    } catch {
                        // fallback to WHO if TE fails
                        covidSeries = await fetchWhoCovid(covidKey);
                    }
                } else {
                    covidSeries = await fetchWhoCovid(covidKey);
                }

                // 2. GDP: preferred source with fallback
                let gdpWithGrowth;
                if (preferredSource === "tradingeconomics") {
                    gdpWithGrowth = await fetchTradingEconomicsGdp(
                        teGdpCountry,
                        teApiKey,
                        wbCode
                    );
                } else {
                    gdpWithGrowth = await fetchWorldBankGdp(wbCode);
                }

                // 3. Join GDP growth onto each COVID day
                let j = 0;
                const joined = covidSeries.map((day) => {
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
                        newDeaths: day.newDeaths,
                        gdpGrowth: gdpForDay ? gdpForDay.growth : null,
                    };
                });

                setCovidDaily(covidSeries);
                setGdpSeries(gdpWithGrowth);
                setCombined(joined);
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        }

        if (countryKey) {
            fetchData();
        }
    }, [
        countryKey,
        covidKey,
        covidSource,
        preferredSource,
        wbCode,
        teGdpCountry,
        teApiKey,
    ]);

    return { loading, error, covidDaily, gdpSeries, combined };
}

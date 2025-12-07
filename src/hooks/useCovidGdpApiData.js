// src/hooks/useCovidGdpApiData.js
import { useEffect, useState } from "react";

const COVID_API_URL = "https://pomber.github.io/covid19/timeseries.json";

// Map from pomber country key -> OECD Weekly Tracker ISO3 code
const COUNTRY_MAP = {
    US: "USA",
    Germany: "DEU",
    Italy: "ITA",
    Japan: "JPN",
    Canada: "CAN",
    France: "FRA",
};

/**
 * Loads COVID daily data + OECD Weekly GDP tracker from public APIs.
 *
 * covidKey:
 *   - Key in pomber JSON, e.g. "US", "Germany", "Italy", ...
 *
 * Returns:
 *   {
 *     loading,
 *     error,
 *     covidDaily,  // array of { date, confirmed, deaths, recovered, newCases }
 *     gdpWeekly,   // array of { date, gdpGrowth }
 *     combined     // array of { date, gdpGrowth, confirmed, newCases, deaths }
 *   }
 */
export function useCovidGdpApiData(covidKey = "US") {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [covidDaily, setCovidDaily] = useState([]);
    const [gdpWeekly, setGdpWeekly] = useState([]);
    const [combined, setCombined] = useState([]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const oecdIso3 = COUNTRY_MAP[covidKey] || "USA";
                const gdpApiUrl = `https://api.db.nomics.world/v22/series/OECD/GDP_GROWTH/W.${oecdIso3}.tracker_yoy?format=json&observations=1`;

                // Fetch both APIs in parallel
                const [covidResp, gdpResp] = await Promise.all([
                    fetch(COVID_API_URL),
                    fetch(gdpApiUrl),
                ]);

                if (!covidResp.ok) {
                    throw new Error(`COVID API error: ${covidResp.status}`);
                }
                if (!gdpResp.ok) {
                    throw new Error(`GDP API error: ${gdpResp.status}`);
                }

                const [covidJson, gdpJson] = await Promise.all([
                    covidResp.json(),
                    gdpResp.json(),
                ]);

                // ---- COVID: daily series for the chosen country ----
                const rawCovidSeries = covidJson[covidKey] || [];

                const covidWithNew = rawCovidSeries.map((point, idx) => {
                    const prev = idx > 0 ? rawCovidSeries[idx - 1] : null;
                    const confirmed = Number(point.confirmed || 0);
                    const prevConfirmed = prev
                        ? Number(prev.confirmed || 0)
                        : 0;
                    const newCases = confirmed - prevConfirmed;

                    return {
                        date: point.date, // "YYYY-MM-DD"
                        confirmed,
                        deaths: Number(point.deaths || 0),
                        recovered: Number(point.recovered || 0),
                        newCases,
                    };
                });

                // ---- GDP: weekly tracker series from DB.nomics ----
                const seriesDoc = gdpJson?.series?.docs?.[0];

                if (!seriesDoc) {
                    throw new Error("GDP API: missing series docs in response");
                }

                const periods = seriesDoc.period || [];
                const values = seriesDoc.value || [];

                const gdp = periods.map((date, idx) => ({
                    date, // "YYYY-MM-DD"
                    gdpGrowth: Number(values[idx]),
                }));

                // ---- Join by date ----
                const covidByDate = new Map(
                    covidWithNew.map((p) => [p.date, p])
                );

                const combinedSeries = gdp
                    .map((g) => {
                        const covidPoint = covidByDate.get(g.date);
                        if (!covidPoint) return null;

                        return {
                            date: g.date,
                            gdpGrowth: g.gdpGrowth,
                            confirmed: covidPoint.confirmed,
                            newCases: covidPoint.newCases,
                            deaths: covidPoint.deaths,
                        };
                    })
                    .filter(Boolean);

                if (!cancelled) {
                    setCovidDaily(covidWithNew);
                    setGdpWeekly(gdp);
                    setCombined(combinedSeries);
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setError(err);
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [covidKey]);

    return { loading, error, covidDaily, gdpWeekly, combined };
}

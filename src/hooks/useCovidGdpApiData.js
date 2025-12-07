// src/hooks/useCovidGdpApiData.js
import { useEffect, useState } from "react";

/**
 * Fetch COVID-19 daily time series + World Bank annual GDP growth
 * Join them by year.
 *
 * countryKey is assumed to be an ISO2 code (US, DE, IT, JP, CA, FR)
 * for the World Bank API.
 *
 * We map that to the names used by pomber's COVID dataset.
 */
export function useCovidGdpApiData(countryKey) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [covidDaily, setCovidDaily] = useState([]);
    const [gdpWeekly, setGdpWeekly] = useState([]); // actually annual here
    const [combined, setCombined] = useState([]);

    // Map ISO2 → pomber's country keys
    const covidCountryMap = {
        US: "US",
        DE: "Germany",
        IT: "Italy",
        JP: "Japan",
        CA: "Canada",
        FR: "France",
    };

    const covidKey = covidCountryMap[countryKey] || countryKey;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);

            try {
                //
                // 1. COVID API — daily data by country (pombér)
                //
                const covidUrl =
                    "https://pomber.github.io/covid19/timeseries.json";
                const covidRes = await fetch(covidUrl);

                if (!covidRes.ok) {
                    throw new Error("COVID API request failed");
                }

                const covidJson = await covidRes.json();

                if (!covidJson[covidKey]) {
                    throw new Error(
                        `No COVID data for country key: ${covidKey}`
                    );
                }

                const covidSeries = covidJson[covidKey].map((row) => ({
                    date: row.date, // YYYY-MM-DD
                    confirmed: row.confirmed,
                    deaths: row.deaths,
                    recovered: row.recovered,
                    newCases: row.confirmed, // placeholder, will adjust
                }));

                // Compute new cases per day
                for (let i = 1; i < covidSeries.length; i++) {
                    covidSeries[i].newCases =
                        covidSeries[i].confirmed - covidSeries[i - 1].confirmed;
                    if (covidSeries[i].newCases < 0)
                        covidSeries[i].newCases = 0;
                }

                //
                // 2. World Bank GDP growth (% annual) by ISO2 country code
                //
                const gdpUrl = `https://api.worldbank.org/v2/country/${countryKey}/indicator/NY.GDP.MKTP.KD.ZG?format=json`;

                let gdpRes = await fetch(gdpUrl);
                if (!gdpRes.ok) {
                    // fallback: US data so charts still render
                    gdpRes = await fetch(
                        "https://api.worldbank.org/v2/country/US/indicator/NY.GDP.MKTP.KD.ZG?format=json"
                    );
                }

                const gdpJson = await gdpRes.json();

                let gdpSeries = [];
                if (Array.isArray(gdpJson) && gdpJson[1]) {
                    gdpSeries = gdpJson[1]
                        .filter((item) => item.value !== null)
                        .map((item) => ({
                            date: `${item.date}-01-01`, // convert year → date
                            gdpGrowth: item.value, // annual GDP growth %
                        }));
                }

                //
                // 3. Join by year: match each COVID daily with GDP of its year
                //
                const combinedRows = covidSeries
                    .map((covid) => {
                        const year = covid.date.substring(0, 4);
                        const gdpRow = gdpSeries.find((g) =>
                            g.date.startsWith(year)
                        );
                        if (!gdpRow) return null;
                        return {
                            date: covid.date,
                            confirmed: covid.confirmed,
                            deaths: covid.deaths,
                            newCases: covid.newCases,
                            gdpGrowth: gdpRow.gdpGrowth,
                        };
                    })
                    .filter(Boolean);

                setCovidDaily(covidSeries);
                setGdpWeekly(gdpSeries);
                setCombined(combinedRows);
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        }

        fetchData();
    }, [countryKey, covidKey]); // re-run when ISO2 or mapped key changes

    return { loading, error, covidDaily, gdpWeekly, combined };
}

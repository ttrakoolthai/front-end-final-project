// fred-proxy.js
//
// Tiny Express proxy for FRED GDP data.
// React calls this instead of hitting FRED directly (avoids CORS).
//
// Run with: npm run proxy

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.FRED_PROXY_PORT || 5001;
const FRED_API_KEY = process.env.FRED_API_KEY;

if (!FRED_API_KEY) {
    console.warn(
        "WARNING: FRED_API_KEY is not set in your .env file. The proxy will not be able to call FRED."
    );
}

app.use(cors());
app.use(express.json());

// Map dashboard country codes → FRED series IDs (real GDP)
const COUNTRY_TO_SERIES = {
    US: "GDPC1", // US real GDP, chained 2017 dollars, quarterly
    DE: "CLVMNACSCAB1GQDE", // Germany real GDP
    IT: "CLVMNACSCAB1GQIT", // Italy real GDP
    FR: "CLVMNACSCAB1GQFR", // France real GDP
    CA: "NGDPRSAXDCCAQ", // Canada real GDP
    JP: "JPNRGDPEXP", // Japan real GDP
};

app.get("/fred/gdp", async (req, res) => {
    try {
        const country = (req.query.country || "US").toUpperCase();
        const seriesId = COUNTRY_TO_SERIES[country];

        if (!seriesId) {
            return res
                .status(400)
                .json({
                    error: `No FRED GDP series configured for ${country}`,
                });
        }

        if (!FRED_API_KEY) {
            return res
                .status(500)
                .json({ error: "FRED_API_KEY not set on proxy server" });
        }

        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(
            seriesId
        )}&api_key=${encodeURIComponent(FRED_API_KEY)}&file_type=json`;

        const resp = await fetch(url);
        if (!resp.ok) {
            const text = await resp.text();
            console.error("FRED error", resp.status, text);
            return res
                .status(502)
                .json({
                    error: "FRED request failed",
                    status: resp.status,
                    body: text,
                });
        }

        const data = await resp.json();

        if (!data.observations) {
            return res
                .status(500)
                .json({
                    error: "FRED response missing observations",
                    raw: data,
                });
        }

        const observations = data.observations
            .filter((obs) => obs.value !== "." && obs.value != null)
            .map((obs) => ({
                date: obs.date, // YYYY-MM-DD
                value: Number(obs.value),
            }));

        res.json({
            country,
            seriesId,
            observations,
        });
    } catch (err) {
        console.error("Proxy /fred/gdp error:", err);
        res.status(500).json({
            error: "Proxy failed",
            details: err.message || String(err),
        });
    }
});

app.listen(PORT, () => {
    console.log(`FRED proxy listening on http://localhost:${PORT}`);
});

import React from "react";

function Home() {
    return (
        <section className="home">
            <h1>COVID-19 & Economic Activity Dashboard</h1>
            <p>
                This project explores how COVID-19 case counts and economic
                activity (approximated by GDP growth) evolve over time in
                different countries.
            </p>

            <p>The dashboard uses live data from two public APIs:</p>

            <ul>
                <li>
                    Daily COVID-19 time series from{" "}
                    <a
                        href="https://pomber.github.io/covid19/timeseries.json"
                        target="_blank"
                        rel="noreferrer"
                    >
                        pomber&apos;s COVID dataset
                    </a>
                    .
                </li>
                <li>
                    Annual GDP growth (%), per country, from the{" "}
                    <a
                        href="https://api.worldbank.org/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        World Bank API
                    </a>
                    .
                </li>
            </ul>

            <p>
                Use the navigation bar above to open the{" "}
                <strong>Dashboard</strong> view and interact with:
            </p>

            <ul>
                <li>Country selector cards.</li>
                <li>
                    Summary cards for peak cases, worst GDP year, and
                    correlation.
                </li>
                <li>
                    Time series of daily COVID cases with GDP growth attached.
                </li>
                <li>A scatter plot showing new cases versus GDP growth.</li>
            </ul>
        </section>
    );
}

export default Home;

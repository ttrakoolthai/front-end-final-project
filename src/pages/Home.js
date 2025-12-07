import React from "react";

export default function Home() {
    return (
        <section>
            <h1>COVID-19 & Economic Activity Dashboard</h1>

            <p className="mt-3">
                This project explores the interaction between COVID-19 new cases
                and economic activity (GDP growth), inspired by recent research
                that models their co-evolution with Lotka–Volterra
                (prey–predator) type dynamics.
            </p>

            <p className="mt-3">The dashboard will let you visualize:</p>

            <ul className="list-group list-group-flush mt-2">
                <li className="list-group-item">
                    Weekly COVID-19 new cases time series for a country.
                </li>
                <li className="list-group-item">
                    Weekly GDP growth estimates over the same period.
                </li>
                <li className="list-group-item">
                    Phase plots showing the relationship between pandemic
                    intensity and economic activity.
                </li>
                <li className="list-group-item">
                    (Coming soon) A Lotka–Volterra-style simulator for
                    COVID–economy waves.
                </li>
            </ul>

            <p className="mt-3">
                Use the navigation bar to open the <strong>Dashboard</strong>{" "}
                and explore the first visualizations.
            </p>
        </section>
    );
}

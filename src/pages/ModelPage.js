// src/pages/ModelPage.js
import React, { useState, useMemo } from "react";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title,
} from "chart.js";
import { Line, Scatter } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title
);

// Simple Euler simulation for a Lotka–Volterra-style COVID model
// y1(t): healthy population
// y2(t): infected population
// dy1/dt = a*y1 - b*y1*y2 + e*y2
// dy2/dt = b*y1*y2 + (c - d - e)*y2
function simulateLV(params) {
    const {
        a,
        b,
        c,
        d,
        e,
        y1_0,
        y2_0,
        steps,
        dt, // time step
    } = params;

    const t = [];
    const y1 = [];
    const y2 = [];

    let currentY1 = y1_0;
    let currentY2 = y2_0;

    for (let i = 0; i < steps; i++) {
        const time = i * dt;
        t.push(time);
        y1.push(currentY1);
        y2.push(currentY2);

        const dy1 = a * currentY1 - b * currentY1 * currentY2 + e * currentY2;
        const dy2 = b * currentY1 * currentY2 + (c - d - e) * currentY2;

        currentY1 = currentY1 + dt * dy1;
        currentY2 = currentY2 + dt * dy2;

        // keep values non-negative
        if (currentY1 < 0) currentY1 = 0;
        if (currentY2 < 0) currentY2 = 0;
    }

    return { t, y1, y2 };
}

function ModelPage() {
    // Defaults inspired by the Saudi Arabia example in the paper
    const [a, setA] = useState(0.012);
    const [b, setB] = useState(0.01);
    const [c, setC] = useState(0.0001);
    const [d, setD] = useState(0.02);
    const [e, setE] = useState(0.98);

    const [y1_0, setY1_0] = useState(100); // healthy
    const [y2_0, setY2_0] = useState(60); // infected

    const [steps, setSteps] = useState(300);
    const [dt, setDt] = useState(0.1);

    // Recompute simulation whenever parameters change
    const sim = useMemo(
        () =>
            simulateLV({
                a,
                b,
                c,
                d,
                e,
                y1_0,
                y2_0,
                steps: Number(steps),
                dt: Number(dt),
            }),
        [a, b, c, d, e, y1_0, y2_0, steps, dt]
    );

    const timeSeriesData = {
        labels: sim.t,
        datasets: [
            {
                label: "Healthy (y1)",
                data: sim.y1,
                borderWidth: 2,
                tension: 0.25,
                pointRadius: 0,
            },
            {
                label: "Infected (y2)",
                data: sim.y2,
                borderWidth: 2,
                tension: 0.25,
                pointRadius: 0,
            },
        ],
    };

    const timeSeriesOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Lotka–Volterra-style COVID model (time series)",
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Time",
                },
            },
            y: {
                title: {
                    display: true,
                    text: "Population (arbitrary units)",
                },
            },
        },
    };

    const phaseData = {
        datasets: [
            {
                label: "Trajectory",
                data: sim.y1.map((val, idx) => ({
                    x: val,
                    y: sim.y2[idx],
                })),
                pointRadius: 3,
            },
        ],
    };

    const phaseOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Phase plot: Healthy (y1) vs Infected (y2)",
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Healthy (y1)",
                },
            },
            y: {
                title: {
                    display: true,
                    text: "Infected (y2)",
                },
            },
        },
    };

    return (
        <div>
            <header>
                <h1>Model: Lotka–Volterra-style COVID Dynamics</h1>
                <p>
                    This page simulates a simplified two-compartment model
                    inspired by the Lotka–Volterra system from your COVID
                    modeling paper. You can adjust parameters and see how the
                    healthy and infected populations evolve and what the phase
                    plot looks like.
                </p>
            </header>

            <section style={{ marginTop: "1.5rem" }}>
                <h2>Parameters</h2>
                <p style={{ fontSize: "0.9rem", maxWidth: "700px" }}>
                    <strong>a</strong>: immigration/growth rate of healthy
                    individuals. <strong>b</strong>: infection rate.{" "}
                    <strong>c</strong>: immigration rate of infected.{" "}
                    <strong>d</strong>: death rate. <strong>e</strong>: cure
                    rate. Initial conditions control the starting sizes of the
                    healthy and infected populations.
                </p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "1rem",
                        marginTop: "1rem",
                    }}
                >
                    <ParamInput
                        label="a (healthy growth)"
                        value={a}
                        setValue={setA}
                    />
                    <ParamInput
                        label="b (infection rate)"
                        value={b}
                        setValue={setB}
                    />
                    <ParamInput
                        label="c (infected immigration)"
                        value={c}
                        setValue={setC}
                    />
                    <ParamInput
                        label="d (death rate)"
                        value={d}
                        setValue={setD}
                    />
                    <ParamInput
                        label="e (cure rate)"
                        value={e}
                        setValue={setE}
                    />
                    <ParamInput
                        label="Initial healthy y1(0)"
                        value={y1_0}
                        setValue={setY1_0}
                    />
                    <ParamInput
                        label="Initial infected y2(0)"
                        value={y2_0}
                        setValue={setY2_0}
                    />
                    <ParamInput
                        label="Steps"
                        value={steps}
                        setValue={setSteps}
                        min={50}
                        step={10}
                    />
                    <ParamInput
                        label="dt (time step)"
                        value={dt}
                        setValue={setDt}
                        step={0.05}
                    />
                </div>
            </section>

            <section style={{ marginTop: "2rem", maxWidth: "900px" }}>
                <h2>Time series</h2>
                <Line data={timeSeriesData} options={timeSeriesOptions} />
            </section>

            <section style={{ marginTop: "2.5rem", maxWidth: "700px" }}>
                <h2>Phase plot</h2>
                <Scatter data={phaseData} options={phaseOptions} />
                <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
                    The phase plot shows how the healthy and infected
                    populations move together over time. In the paper, similar
                    plots are used to study stability, equilibrium points, and
                    the qualitative behavior of the system.
                </p>
            </section>
        </div>
    );
}

function ParamInput({ label, value, setValue, min, step }) {
    return (
        <div>
            <label
                style={{
                    display: "block",
                    fontSize: "0.85rem",
                    marginBottom: "0.25rem",
                }}
            >
                {label}
            </label>
            <input
                type="number"
                value={value}
                onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (Number.isNaN(v)) {
                        setValue("");
                    } else {
                        setValue(v);
                    }
                }}
                style={{
                    width: "100%",
                    padding: "0.35rem 0.5rem",
                    borderRadius: "0.4rem",
                    border: "1px solid #ccc",
                    fontSize: "0.9rem",
                }}
                min={min}
                step={step}
            />
        </div>
    );
}

export default ModelPage;

import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

export default function App() {
    return (
        <main className="container py-4">
            <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4 shadow-sm rounded">
                <div className="container-fluid">
                    {/* Brand */}
                    <NavLink className="navbar-brand fw-bold" to="/">
                        COVID–Economy LV Dashboard
                    </NavLink>

                    {/* Hamburger */}
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                        aria-controls="navbarNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon" />
                    </button>

                    {/* Links */}
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            <li className="nav-item">
                                <NavLink
                                    to="/"
                                    end
                                    className={({ isActive }) =>
                                        "nav-link" +
                                        (isActive ? " active fw-semibold" : "")
                                    }
                                >
                                    Overview
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/dashboard"
                                    className={({ isActive }) =>
                                        "nav-link" +
                                        (isActive ? " active fw-semibold" : "")
                                    }
                                >
                                    Dashboard
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* Fallback */}
                <Route path="*" element={<Home />} />
            </Routes>
        </main>
    );
}

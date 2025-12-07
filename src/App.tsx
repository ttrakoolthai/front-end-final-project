import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

const App: React.FC = () => {
    return (
        <main className="page">
            <nav className="mb-6 flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-slate-200 backdrop-blur">
                <NavLink
                    to="/"
                    className="text-lg font-semibold tracking-tight text-slate-800"
                >
                    COVID–Economy LV Dashboard
                </NavLink>

                <div className="flex gap-2">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            [
                                "rounded-full px-3 py-1 text-sm font-medium transition",
                                isActive
                                    ? "bg-slate-900 text-white shadow"
                                    : "text-slate-600 hover:bg-slate-100",
                            ].join(" ")
                        }
                    >
                        Overview
                    </NavLink>
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            [
                                "rounded-full px-3 py-1 text-sm font-medium transition",
                                isActive
                                    ? "bg-slate-900 text-white shadow"
                                    : "text-slate-600 hover:bg-slate-100",
                            ].join(" ")
                        }
                    >
                        Dashboard
                    </NavLink>
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<Home />} />
            </Routes>
        </main>
    );
};

export default App;

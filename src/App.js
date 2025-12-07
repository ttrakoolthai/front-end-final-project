import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ModelPage from "./pages/ModelPage";

function App() {
    return (
        <main className="page">
            <nav className="top-nav">
                <div className="top-nav-left">
                    <span className="brand">COVID–Economy Dashboard</span>
                </div>
                <div className="top-nav-right">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            "nav-link" + (isActive ? " nav-link-active" : "")
                        }
                    >
                        Overview
                    </NavLink>
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            "nav-link" + (isActive ? " nav-link-active" : "")
                        }
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/model"
                        className={({ isActive }) =>
                            "nav-link" + (isActive ? " nav-link-active" : "")
                        }
                    >
                        Model
                    </NavLink>
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/model" element={<ModelPage />} />
                <Route path="*" element={<Home />} />
            </Routes>
        </main>
    );
}

export default App;

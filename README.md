# COVID‑19 & GDP Dashboard

Tommy Trakoolthai
The final project for CS564: Front End Web Tech

A front‑end dashboard visualizing the relationship between **COVID‑19 trends** and **GDP growth** across multiple countries. The project integrates **real‑world APIs**, performs **data joining**, displays **interactive charts**, and provides **accessible UI components** for exploration.

Developed as part of the **CS564 Front‑End Web Technologies Final Project**.

---

## Project Purpose

This dashboard was built for a final project in a front‑end development course.
It demonstrates:

-   Fetching real data from APIs (including one requiring an API token)
-   Presenting information through clean, interactive visualizations
-   Providing responsive, accessible UI components
-   Combining epidemiological and economic data into a cohesive dashboard
-   Allowing comparison across countries

---

## Features

### Interactive Country Selection

Choose a primary country and optionally compare it with another.

### Real Data Sources

-   **COVID‑19 Data:** Pomber's WHO‑backed global timeseries
-   **GDP Growth Data:** TradingEconomics API (API key required)

### Visualizations

-   Line charts showing **daily COVID‑19 cases** and **GDP growth**
-   Summary metric cards (up/down trends, totals)
-   Mobile‑responsive country cards with breakpoints

### Accessibility

Improved according to **axe‑core**, including:

-   Correct landmark structure
-   Sufficient color contrast
-   Meaningful alt text
-   Keyboard‑navigable modal dialogs

### Optional Comparison Mode

Overlay another country's data for visual comparison.

---

## Tech Stack

-   **React (CRA)**
-   **JavaScript / JSX**
-   **Chart.js**
-   **Jest + React Testing Library (unit tests)**
-   **CSS (modular + responsive breakpoints)**

---

## Installation & Running

### 1. Clone the repo

```bash
git clone https://github.com/ttrakoolthai/front-end-final-project
cd front-end-final-project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

```
REACT_APP_TE_API_KEY=your_trading_economics_key_here
```

### 4. Start the development server

```bash
npm start
```

The app will run at:

```
http://localhost:3000/
```

---

## 📁 File Structure

```
src/
 ├── components/
 │    ├── SummaryCard.js
 │    └── DataPreviewTable.js
 │
 ├── hooks/
 │    └── useCovidGdpApiData.js
 │
 ├── pages/
 │    └── Dashboard.js
 │
 ├── styles.css
 │
 └── App.js
```

---

## Unit Tests

Two React components have Jest/RTL test suites:

-   **SummaryCard.test.js**
-   **DataPreviewTable.test.js**

Run all tests:

```bash
npm test
```

---

## 📝 Sources & References

### COVID‑19 Data

-   Pomber / CSSE Johns Hopkins timeseries
    https://github.com/pomber/covid19

### GDP Data

-   Trading Economics API
    https://developer.tradingeconomics.com/

### Tools & Documentation

-   React.js — https://react.dev
-   Chart.js — https://www.chartjs.org/
-   axe‑core — https://www.deque.com/axe/
-   Jest — https://jestjs.io
-   React Testing Library — https://testing-library.com/

---

## 📄 License

MIT License — free for academic and educational use.

---

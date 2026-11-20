# SkyCast — Modern Weather Forecast Web Application 🌤️

> A modern, responsive weather forecast dashboard built with pure **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)**. SkyCast delivers real-time weather insights, detailed atmospheric metrics, a 24-hour hourly prediction, and an extended 5-day forecast for any city worldwide using the OpenWeatherMap API.

---

## 📸 Overview

**SkyCast** was designed from the ground up as a senior-level frontend project that adheres to modern web standards, sleek UI/UX design (dark navy glassmorphism, dynamic atmospheric ambient glows, fluid micro-animations), and strict separation of concerns — without relying on external frameworks like React, Vue, or Angular.

It also serves as a comprehensive educational reference for mastering modern JavaScript concepts including the **Fetch API**, **Promises**, **Async/Await**, **JSON parsing**, **DOM manipulation**, **Event Delegation**, and **LocalStorage persistence**.

---

## ✨ Features

- 🌍 **Worldwide City Weather Search**: Instant real-time weather search with support for the `Enter` key, search button, input clearing (`×`), and empty query validation.
- 📍 **Browser Geolocation API Support**: Retrieve real-time weather for your exact coordinates using the browser's built-in `navigator.geolocation` API.
- 🕒 **City Local Time Synchronization**: Computes and displays the true local date and time of the searched city using the API's timezone offset (independent of the user's computer timezone).
- 🌡️ **Temperature Unit Toggle (°C / °F)**: Seamlessly toggle between Celsius (metric) and Fahrenheit (imperial) with instant UI conversion and storage memory.
- 🌓 **Theme Switching (Dark Navy & Light Sky)**: Toggle between a rich midnight navy glassmorphic theme and an airy, high-contrast light mode.
- 🔮 **Condition-Aware Atmospheric Glows**: Ambient background lighting shifts subtly based on current weather conditions (Solar gold for clear day, moody violet for thunderstorms, oceanic blue for rain, icy cyan for snow).
- 📊 **Comprehensive Atmospheric Details**: 7 dedicated glassmorphism cards displaying:
  1. **Humidity** (%) with comfort range classification
  2. **Wind Speed** (km/h or mph) with 16-point compass direction and degrees
  3. **Atmospheric Pressure** (hPa) with barometric trend
  4. **Visibility** (km or miles)
  5. **Cloud Coverage** (%) with visual meter
  6. **Sunrise Time** (formatted to city's local time)
  7. **Sunset Time** (formatted to city's local time)
- ⏱️ **24-Hour Hourly Forecast**: Interactive horizontally scrolling hourly cards showing temperature, weather condition icons, and rain probability.
- 📅 **5-Day Extended Outlook**: Daily forecast cards with min/max temperatures, midday weather conditions, and an Apple Weather-style visual temperature range bar.
- 💾 **Recent Search History**: Remembers your recent cities using `localStorage` with one-click re-search and individual deletion.
- ⚡ **Popular Cities Quick-Launch**: Quick-select buttons for top world capitals (London, New York, Tokyo, Paris, Sydney, Dubai).
- 🔄 **Live Data Refresh**: One-click refresh button with rotating animation to reload current weather data.
- 🛡️ **Robust Error & Loading States**:
  - Shimmering spinner overlay while fetching
  - Specific feedback for 404 (city not found), 401 (invalid/missing key), 429 (rate limits), and network offline
  - In-app API Key modal with live key validator and persistence
- 📱 **Fully Responsive Layout**: Handcrafted CSS Grid and Flexbox layouts optimized for mobile smartphones (iOS & Android), tablets, laptops, and ultra-wide desktops.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Markup** | HTML5 (Semantic elements: `<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`, `<form>`, ARIA accessibility attributes) |
| **Styling** | CSS3 (Custom properties/variables, Flexbox, CSS Grid, Glassmorphism, Backdrop filters, Keyframe animations, Responsive media queries) |
| **Logic** | Vanilla JavaScript (ES6+) — No frameworks, libraries, or bundlers |
| **Typography** | Google Fonts ([Poppins](https://fonts.google.com/specimen/Poppins) & [Inter](https://fonts.google.com/specimen/Inter)) |
| **Graphics** | Custom Scalable Vector Graphics (SVG) weather and metric icons |
| **Weather Data** | [OpenWeatherMap API](https://openweathermap.org/api) (Current Weather & 5-Day / 3-Hour Forecast endpoints) |

---

## 📂 Folder Structure

```
weather-app/
│
├── index.html              # Main HTML markup and application skeleton
│
├── css/
│   └── style.css           # Modern CSS styling, themes, animations, & responsive rules
│
├── js/
│   ├── app.js              # Application controller, event listeners, & initialization
│   ├── api.js              # OpenWeatherMap Fetch API calls, HTTP error handling, & parsing
│   ├── ui.js               # DOM manipulation, dynamic rendering, & visual state management
│   ├── storage.js          # LocalStorage CRUD operations for history, units, theme, & key
│   ├── config.js           # Active API key configuration file
│   └── config.example.js   # Configuration blueprint and documentation template
│
├── assets/
│   ├── icons/              # Scalable SVG weather and UI metric icons
│   │   ├── clear-day.svg
│   │   ├── clear-night.svg
│   │   ├── partly-cloudy.svg
│   │   ├── cloudy.svg
│   │   ├── rain.svg
│   │   ├── thunderstorm.svg
│   │   ├── snow.svg
│   │   ├── mist.svg
│   │   ├── humidity.svg
│   │   ├── wind.svg
│   │   ├── pressure.svg
│   │   ├── visibility.svg
│   │   ├── sunrise.svg
│   │   └── sunset.svg
│   └── images/             # Visual assets directory
│
└── README.md               # Project documentation and architectural guide
```

---

## 🔑 OpenWeatherMap API Setup

SkyCast requires an OpenWeatherMap API key to fetch real-time weather data.

### Step 1: Obtain a Free API Key
1. Go to [https://home.openweathermap.org/users/sign_up](https://home.openweathermap.org/users/sign_up).
2. Create a free account and confirm your registration via the verification email.
3. Once logged in, open the **API keys** tab in your profile dashboard.
4. Copy your default 32-character key (or generate a new one).
> *Note: OpenWeatherMap servers typically take **10 to 15 minutes** to activate a newly registered key.*

### Step 2: Configure Your API Key

You can configure your API key in **either of two convenient ways**:

#### Method A: Directly in the Web UI (Recommended)
1. Launch SkyCast in your browser.
2. Click the **Key icon** (or the **"Configure Key"** button on the setup banner).
3. Paste your 32-character key into the input field and click **"Save & Connect"**.
4. The key is securely saved to your browser's `localStorage` and will persist across sessions.

#### Method B: In the `js/config.js` File
1. Open the file [`js/config.js`](file:///c:/Users/user/Desktop/Weather/js/config.js).
2. Enter your key inside the `API_KEY` property:
   ```javascript
   const CONFIG = {
     API_KEY: 'your_32_character_api_key_here',
     BASE_URL: 'https://api.openweathermap.org/data/2.5',
     DEFAULT_CITY: 'London',
     DEFAULT_UNIT: 'metric',
   };
   ```
3. Save the file and refresh your browser.

> ⚠️ **Important Security Note on Frontend API Keys:**
> Client-side API keys included in frontend JavaScript or HTML files are downloaded to the client's browser and can be inspected via Developer Tools (`F12 -> Network`). In commercial production applications, API keys should be held on a backend server (e.g., Node.js or serverless proxy) to prevent unauthorized use. For frontend educational projects, OpenWeatherMap provides a free tier suited for direct client-side requests.

---

## 🚀 How to Run the Application

Because SkyCast uses pure Vanilla JavaScript and standard relative paths, you can run it effortlessly in any modern web browser:

### Option 1: Direct File Opening
Double-click [`index.html`](file:///c:/Users/user/Desktop/Weather/index.html) or right-click and choose **Open With -> Google Chrome / Mozilla Firefox / Microsoft Edge / Safari**.

### Option 2: Using VS Code Live Server
1. Open the project folder in **Visual Studio Code** or **Antigravity**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click on `index.html` and select **"Open with Live Server"**.
4. The application will launch at `http://127.0.0.1:5500/index.html`.

### Option 3: Using Python HTTP Server (Terminal)
Open your terminal in the project directory and run:
```bash
# Python 3
python -m http.server 3000
```
Then navigate to `http://localhost:3000` in your browser.

---

## 🧠 JavaScript Concepts Practiced

This project was engineered as a masterclass in modern, foundational JavaScript:

### 1. The Fetch API & HTTP Protocol
- Sending asynchronous HTTP GET requests using `window.fetch(url)`.
- Understanding HTTP request anatomy (endpoints, query parameters, URL encoding with `encodeURIComponent`).
- Inspecting HTTP responses: `response.ok` (checking for status codes in the 200–299 range) and `response.status` (handling 401, 404, 429).
- Parsing JSON response streams via `await response.json()`.

### 2. Promises & Asynchronous Execution
- Grasping that `fetch()` and `response.json()` return `Promise` objects representing values available in the future.
- Leveraging `Promise.all([fetchCurrentWeather(), fetchForecast()])` to execute independent network calls concurrently in parallel, cutting wait time in half.

### 3. Async / Await Syntax
- Using `async` functions to write asynchronous code that reads like synchronous procedural code.
- Utilizing `await` to pause execution until a Promise settles without blocking the browser's main thread.
- Catching network and logic errors cleanly using `try...catch...finally` blocks.

### 4. DOM Selection & Dynamic Manipulation
- Selecting elements using `document.getElementById()`, `document.querySelector()`, and `document.querySelectorAll()`.
- Updating content safely with `element.textContent` to prevent Cross-Site Scripting (XSS).
- Dynamically generating elements with `document.createElement()` and `appendChild()`.
- Injecting templated markup using template literals (`` `${expression}` ``).
- Managing CSS classes dynamically with `element.classList.add()`, `.remove()`, and `.toggle()`.

### 5. Event Handling & Delegation
- Attaching event listeners using `addEventListener('submit', ...)`, `addEventListener('click', ...)`, and `addEventListener('keydown', ...)`.
- Preventing default browser page refreshes using `event.preventDefault()`.
- Using event delegation (`event.target.closest()`) to handle clicks on dynamic chip buttons efficiently.

### 6. Web Storage API (`localStorage`)
- Persisting state across browser refreshes with `localStorage.setItem()`.
- Reading saved preferences with `localStorage.getItem()`.
- Serializing arrays and objects into JSON strings with `JSON.stringify()`.
- Deserializing strings back into JavaScript data structures with `JSON.parse()`.
- Wrapping storage operations in `try...catch` to prevent crashes in private/incognito browsing modes.

### 7. Modern ES6+ Features
- Block-scoped declarations (`const` and `let`).
- Arrow functions (`() => {}`) with concise body syntax.
- Object & Array destructuring (`const { current, forecast } = await ...`).
- Array higher-order methods: `.map()`, `.filter()`, `.forEach()`, `.reduce()`, `.slice()`.
- Modular separation of concerns into dedicated single-responsibility files (`api.js`, `ui.js`, `storage.js`, `app.js`).

---

## 📋 Verification Checklist

- [x] Pure Vanilla JavaScript (No React, Vue, jQuery, or third-party frameworks).
- [x] Modern UI/UX with dark navy glassmorphism and subtle ambient glows.
- [x] Responsive layout across mobile, tablet, laptop, and desktop.
- [x] Real-time city search with enter key and click listeners.
- [x] Browser Geolocation API integration ("My Location").
- [x] Live local city clock calculated from timezone offset.
- [x] 7 atmospheric detail metric cards.
- [x] 24-hour hourly forecast with horizontal scrolling.
- [x] 5-day extended forecast with visual range bars.
- [x] Celsius (°C) and Fahrenheit (°F) toggle with state persistence.
- [x] Dark / Light theme toggle with state persistence.
- [x] Recent search history saved in `localStorage`.
- [x] API key configuration via `js/config.js` or in-app modal.
- [x] Comprehensive error handling (404, 401, offline network).

---

## 📄 License
This project is open-source and available under the **MIT License**.

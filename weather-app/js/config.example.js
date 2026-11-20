/**
 * SkyCast - Configuration Template (config.example.js)
 * -----------------------------------------------------------------------------
 * INSTRUCTIONS:
 * 1. Copy or rename this file to 'config.js' in the same 'js/' directory:
 *      cp js/config.example.js js/config.js
 * 2. Replace 'YOUR_OPENWEATHERMAP_API_KEY_HERE' with your real API key from OpenWeatherMap.
 * 3. Save the file and reload the application.
 *
 * HOW TO GET A FREE API KEY:
 * 1. Visit: https://home.openweathermap.org/users/sign_up
 * 2. Create a free account and verify your email address.
 * 3. Go to the "API keys" tab in your profile dashboard.
 * 4. Copy your default key (or generate a new one). Note: Free keys may take
 *    10-15 minutes after activation to begin answering requests.
 *
 * SECURITY NOTE (FRONTEND API KEYS):
 * Any API key included in client-side (frontend) code, HTML, or JavaScript
 * is downloaded to the user's browser and can be inspected in Developer Tools.
 * For production applications requiring high security or rate-limited paid tiers,
 * API requests should be routed through a backend proxy server (such as Node.js,
 * Python, or serverless functions) to keep the secret key hidden from clients.
 * For educational and personal client-side apps, OpenWeatherMap provides a free
 * tier suitable for direct client-side requests.
 */

const CONFIG = {
  // Your OpenWeatherMap 32-character API key
  API_KEY: 'YOUR_OPENWEATHERMAP_API_KEY_HERE',

  // OpenWeatherMap 2.5 API base URL
  BASE_URL: 'https://api.openweathermap.org/data/2.5',

  // Geocoding API base URL (for city coordinates and direct search)
  GEO_URL: 'https://api.openweathermap.org/geo/1.0',

  // Default initial city to display when the app opens for the first time
  DEFAULT_CITY: 'London',

  // Default temperature unit: 'metric' (Celsius, m/s) or 'imperial' (Fahrenheit, mph)
  DEFAULT_UNIT: 'metric',

  // Application metadata
  APP_NAME: 'SkyCast',
  VERSION: '1.0.0'
};

// Make CONFIG accessible on window for browser scripts
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

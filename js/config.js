/**
 * SkyCast - Active Application Configuration (config.js)
 * -----------------------------------------------------------------------------
 * Paste your real OpenWeatherMap API key below or configure it directly
 * through the SkyCast UI settings in your browser!
 *
 * Free OpenWeatherMap key registration:
 * https://home.openweathermap.org/users/sign_up
 */

const CONFIG = {
  // Enter your OpenWeatherMap 32-character API key between the quotes below:
  API_KEY: '',

  // API base endpoints
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  GEO_URL: 'https://api.openweathermap.org/geo/1.0',

  // Default initial city when no recent searches exist
  DEFAULT_CITY: 'London',

  // Default unit: 'metric' (Celsius) or 'imperial' (Fahrenheit)
  DEFAULT_UNIT: 'metric',

  // Application metadata
  APP_NAME: 'SkyCast',
  VERSION: '1.0.0'
};

// Expose configuration globally on the window object
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

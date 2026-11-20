/**
 * SkyCast - API Module (js/api.js)
 * =============================================================================
 * Handles all weather data fetching and HTTP communication:
 * 1. OpenWeatherMap API (Current Weather & 5-Day / 3-Hour Forecast)
 * 2. Open-Meteo Public Weather API (Instant, 100% Free Live Global Weather with zero key required)
 * 3. Smart Fallback: Automatically falls back to live public data if OpenWeatherMap
 *    key is pending activation (HTTP 401), missing, or experiencing downtime.
 *
 * KEY JAVASCRIPT CONCEPTS PRACTICED:
 * - Fetch API: `fetch(url)` sending asynchronous GET requests
 * - Promises & `Promise.all`: Concurrently executing multiple requests
 * - Async / Await: Clean, non-blocking asynchronous flow
 * - HTTP Response Handling: Checking `response.ok` and parsing `response.json()`
 * - Data Transformation: Normalizing disparate API schemas into a unified model
 * - Error Handling: Graceful try...catch recovery and clear error messages
 */

const WeatherAPI = {
  /**
   * Helper to retrieve the active OpenWeatherMap API key.
   * Priority:
   *  1. Custom API key stored in localStorage by the user via UI settings
   *  2. Active key in `CONFIG.API_KEY`
   * @returns {string|null}
   */
  getApiKey() {
    const customKey = window.WeatherStorage?.loadCustomApiKey();
    if (customKey && customKey.trim()) {
      return customKey.trim();
    }

    const configKey = window.CONFIG?.API_KEY;
    if (configKey && configKey.trim() && !configKey.includes('YOUR_OPENWEATHERMAP_API_KEY')) {
      return configKey.trim();
    }

    return null;
  },

  /**
   * Check whether an OpenWeatherMap API key has been configured
   * @returns {boolean}
   */
  hasApiKey() {
    return Boolean(this.getApiKey());
  },

  /**
   * Get active provider preference: 'auto' | 'openweathermap' | 'openmeteo'
   * @returns {string}
   */
  getProvider() {
    return window.WeatherStorage?.loadProvider() || 'auto';
  },

  /**
   * Helper to handle OpenWeatherMap HTTP errors and convert them to user-friendly messages
   * @param {Response} response
   * @param {string} entity
   */
  async handleResponseError(response, entity = 'City') {
    let errorMessage = `HTTP error! status: ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }

    switch (response.status) {
      case 401:
        throw new Error(
          'OpenWeatherMap returned 401 (Invalid/Unauthorized). New free keys take 10-30 minutes to activate after email verification.'
        );
      case 404:
        throw new Error(`City "${entity}" not found. Please check spelling and try again.`);
      case 429:
        throw new Error('API rate limit exceeded. Please wait a moment before trying again.');
      default:
        throw new Error(`Weather service error (${response.status}): ${errorMessage}`);
    }
  },

  /* ===========================================================================
     OPENWEATHERMAP ENDPOINTS
     =========================================================================== */

  /**
   * Fetch current weather from OpenWeatherMap by city name
   */
  async fetchCurrentWeather(city, unit = 'metric') {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Missing OpenWeatherMap API key.');
    }

    const baseUrl = window.CONFIG?.BASE_URL || 'https://api.openweathermap.org/data/2.5';
    const url = `${baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unit}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        await this.handleResponseError(response, city);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
        throw new Error('Unable to connect. Please check your internet connection.');
      }
      throw error;
    }
  },

  /**
   * Fetch 5-day / 3-hour forecast from OpenWeatherMap by city name
   */
  async fetchForecast(city, unit = 'metric') {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Missing OpenWeatherMap API key.');
    }

    const baseUrl = window.CONFIG?.BASE_URL || 'https://api.openweathermap.org/data/2.5';
    const url = `${baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unit}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        await this.handleResponseError(response, city);
      }
      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
        throw new Error('Unable to connect. Please check your internet connection.');
      }
      throw error;
    }
  },

  /**
   * Fetch current weather from OpenWeatherMap by coordinates
   */
  async fetchCurrentWeatherByCoords(lat, lon, unit = 'metric') {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('Missing OpenWeatherMap API key.');

    const baseUrl = window.CONFIG?.BASE_URL || 'https://api.openweathermap.org/data/2.5';
    const url = `${baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;

    const response = await fetch(url);
    if (!response.ok) await this.handleResponseError(response, `${lat}, ${lon}`);
    return await response.json();
  },

  /**
   * Fetch forecast from OpenWeatherMap by coordinates
   */
  async fetchForecastByCoords(lat, lon, unit = 'metric') {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('Missing OpenWeatherMap API key.');

    const baseUrl = window.CONFIG?.BASE_URL || 'https://api.openweathermap.org/data/2.5';
    const url = `${baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;

        const response = await fetch(url);
        if (!response.ok) await this.handleResponseError(response, `${lat}, ${lon}`);
        return await response.json();
      },

      /* ===========================================================================
         OPEN-METEO PUBLIC WEATHER ENDPOINTS (Instant Free Live Weather)
         =========================================================================== */

      /**
       * Map WMO Weather Interpretation Codes (0-99) to OpenWeatherMap Condition Schema
       */
      mapWmoToWeather(code, isDay = 1) {
        const isNight = isDay === 0;
        switch (code) {
          case 0:
            return { main: 'Clear', description: 'Clear sky', icon: isNight ? '01n' : '01d' };
          case 1:
            return { main: 'Clear', description: 'Mainly clear', icon: isNight ? '02n' : '02d' };
          case 2:
            return { main: 'Clouds', description: 'Partly cloudy', icon: isNight ? '02n' : '02d' };
          case 3:
            return { main: 'Clouds', description: 'Overcast', icon: isNight ? '04n' : '04d' };
          case 45:
          case 48:
            return { main: 'Mist', description: 'Foggy', icon: '50d' };
          case 51:
          case 53:
          case 55:
            return { main: 'Drizzle', description: 'Light drizzle', icon: '09d' };
          case 56:
          case 57:
            return { main: 'Drizzle', description: 'Freezing drizzle', icon: '09d' };
          case 61:
            return { main: 'Rain', description: 'Slight rain', icon: '10d' };
          case 63:
            return { main: 'Rain', description: 'Moderate rain', icon: '10d' };
          case 65:
            return { main: 'Rain', description: 'Heavy rain', icon: '10d' };
          case 66:
          case 67:
            return { main: 'Rain', description: 'Freezing rain', icon: '10d' };
          case 71:
          case 73:
          case 75:
          case 77:
            return { main: 'Snow', description: 'Snowfall', icon: '13d' };
          case 80:
          case 81:
          case 82:
            return { main: 'Rain', description: 'Rain showers', icon: '09d' };
          case 85:
          case 86:
            return { main: 'Snow', description: 'Snow showers', icon: '13d' };
          case 95:
            return { main: 'Thunderstorm', description: 'Thunderstorm', icon: '11d' };
          case 96:
          case 99:
            return { main: 'Thunderstorm', description: 'Thunderstorm with hail', icon: '11d' };
          default:
            return { main: 'Clear', description: 'Clear sky', icon: isNight ? '01n' : '01d' };
        }
      },

  /**
   * Search real-time live weather using Open-Meteo Public API
   * Transforms response into the standard schema used by ui.js
   */
  async searchOpenMeteoByCity(city, unit = 'metric') {
        // 1. Geocoding request to find latitude and longitude of city
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error('Geocoding service unavailable.');

        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
          throw new Error(`City "${city}" not found. Please check spelling and try again.`);
        }

        const place = geoData.results[0];
        return await this.searchOpenMeteoByCoords(place.latitude, place.longitude, unit, place.name, place.country_code);
      },

  /**
   * Fetch weather data from Open-Meteo by coordinates
   */
  async searchOpenMeteoByCoords(lat, lon, unit = 'metric', cityName = 'Current Location', countryCode = '') {
    // If name is default, attempt lightweight client-side reverse geocode
    if (cityName === 'Current Location') {
      try {
        const revRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        if (revRes.ok) {
          const revData = await revRes.json();
          if (revData.city || revData.locality) {
            cityName = revData.city || revData.locality;
            countryCode = revData.countryCode || '';
          }
        }
      } catch {
        // Keep default 'Current Location'
      }
    }

    const isImperial = unit === 'imperial';
        const tempUnit = isImperial ? 'fahrenheit' : 'celsius';
        const speedUnit = isImperial ? 'mph' : 'ms';

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&wind_speed_unit=${speedUnit}&temperature_unit=${tempUnit}&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Weather service error: ${res.statusText}`);
        const data = await res.json();

        const curr = data.current;
        const daily = data.daily;
        const hourly = data.hourly;
        const timezoneOffset = data.utc_offset_seconds || 0;

        // Map current condition
        const weatherCond = this.mapWmoToWeather(curr.weather_code, curr.is_day);

        // Current weather formatted object matching OpenWeatherMap schema
        const currentData = {
          name: cityName,
          sys: {
            country: countryCode,
            sunrise: daily && daily.sunrise ? Math.floor(new Date(daily.sunrise[0]).getTime() / 1000) : 0,
            sunset: daily && daily.sunset ? Math.floor(new Date(daily.sunset[0]).getTime() / 1000) : 0
          },
          timezone: timezoneOffset,
          main: {
            temp: curr.temperature_2m,
            feels_like: curr.apparent_temperature,
            temp_min: daily ? daily.temperature_2m_min[0] : curr.temperature_2m - 2,
            temp_max: daily ? daily.temperature_2m_max[0] : curr.temperature_2m + 2,
            humidity: curr.relative_humidity_2m,
            pressure: Math.round(curr.surface_pressure || curr.pressure_msl || 1013)
          },
          visibility: 10000,
          wind: {
            speed: curr.wind_speed_10m,
            deg: curr.wind_direction_10m
          },
          clouds: {
            all: curr.cloud_cover
          },
          weather: [weatherCond]
        };

        // Build forecast list in 3-hour increments
        const forecastList = [];
        if (hourly && hourly.time) {
          const now = new Date();
          let startIndex = hourly.time.findIndex(t => new Date(t) >= now);
          if (startIndex < 0) startIndex = 0;

          for (let i = 0; i < 40; i++) {
            const idx = Math.min(hourly.time.length - 1, startIndex + (i * 3));
            const dt = Math.floor(new Date(hourly.time[idx]).getTime() / 1000);
            const w = this.mapWmoToWeather(hourly.weather_code[idx], 1);
            forecastList.push({
              dt,
              main: {
                temp: hourly.temperature_2m[idx],
                temp_min: hourly.temperature_2m[idx] - 1,
                temp_max: hourly.temperature_2m[idx] + 1,
                humidity: hourly.relative_humidity_2m[idx]
              },
              weather: [w],
              pop: (hourly.precipitation_probability[idx] || 0) / 100
            });
          }
        }

        const forecastData = {
          city: {
            name: cityName,
            timezone: timezoneOffset
          },
          list: forecastList
        };

        return { current: currentData, forecast: forecastData };
      },

  /* ===========================================================================
     SMART ORCHESTRATION (OpenWeatherMap + Seamless Public Fallback)
     =========================================================================== */

  /**
   * Search weather by city name
   */
  async searchWeather(city, unit = 'metric') {
        const provider = this.getProvider();

        // If user explicitly chose Open-Meteo
        if (provider === 'openmeteo') {
          return await this.searchOpenMeteoByCity(city, unit);
        }

        // If an API key is available or provider is openweathermap
        const hasKey = this.hasApiKey();

        if (hasKey) {
          try {
            const [currentData, forecastData] = await Promise.all([
              this.fetchCurrentWeather(city, unit),
              this.fetchForecast(city, unit)
            ]);
            return { current: currentData, forecast: forecastData };
          } catch (error) {
            // If OpenWeatherMap returned 401 Unauthorized (unactivated key, email unconfirmed, or typo)
            if (
              error.message.includes('401') ||
              error.message.includes('unauthorized') ||
              error.message.includes('Invalid')
            ) {
              console.warn('OpenWeatherMap key returned 401. Seamlessly loading live data via Open-Meteo...');
              window.WeatherUI?.showError(
                'OpenWeatherMap key is pending activation (takes 10-30 min). Loaded live data via Free Public API!'
              );
              return await this.searchOpenMeteoByCity(city, unit);
            }
            throw error;
          }
        } else {
          // No key configured: seamlessly use Open-Meteo live public weather!
          return await this.searchOpenMeteoByCity(city, unit);
        }
      },

  /**
   * Search weather by coordinates
   */
  async searchWeatherByCoords(lat, lon, unit = 'metric') {
        const provider = this.getProvider();

        if (provider === 'openmeteo') {
          return await this.searchOpenMeteoByCoords(lat, lon, unit);
        }

        if (this.hasApiKey()) {
          try {
            const [currentData, forecastData] = await Promise.all([
              this.fetchCurrentWeatherByCoords(lat, lon, unit),
              this.fetchForecastByCoords(lat, lon, unit)
            ]);
            return { current: currentData, forecast: forecastData };
          } catch (error) {
            if (
              error.message.includes('401') ||
              error.message.includes('unauthorized') ||
              error.message.includes('Invalid')
            ) {
              console.warn('OpenWeatherMap key returned 401. Using Open-Meteo fallback...');
              window.WeatherUI?.showError(
                'OpenWeatherMap key is pending activation. Loaded live coordinates via Free Public API!'
              );
              return await this.searchOpenMeteoByCoords(lat, lon, unit);
            }
            throw error;
          }
        } else {
          return await this.searchOpenMeteoByCoords(lat, lon, unit);
        }
      },

  /**
   * Test an API key to verify whether it works with OpenWeatherMap
   * @param {string} apiKey - 32-character key to test
   * @returns {Promise<{ valid: boolean, status: number, message: string }>}
   */
  async validateApiKey(apiKey) {
        if (!apiKey || apiKey.length < 16) {
          return { valid: false, status: 400, message: 'Please enter a valid key (32 characters).' };
        }

        const baseUrl = window.CONFIG?.BASE_URL || 'https://api.openweathermap.org/data/2.5';
        const testUrl = `${baseUrl}/weather?q=London&appid=${apiKey.trim()}`;

        try {
          const res = await fetch(testUrl);
          if (res.status === 200) {
            return { valid: true, status: 200, message: '✓ Key is active and verified on OpenWeatherMap!' };
          } else if (res.status === 401) {
            return {
              valid: false,
              status: 401,
              message:
                '⏳ OpenWeatherMap returned 401. New free keys take 10-30 minutes after email confirmation to activate. Free Live Mode will be used in the meantime!'
            };
          } else {
            return {
              valid: false,
              status: res.status,
              message: `OpenWeatherMap returned status ${res.status} (${res.statusText})`
            };
          }
        } catch {
          return { valid: false, status: 0, message: 'Network error while testing key.' };
        }
      }
    };

    // Expose on window object
    if (typeof window !== 'undefined') {
      window.WeatherAPI = WeatherAPI;
    }

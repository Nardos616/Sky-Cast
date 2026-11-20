/**
 * SkyCast - Storage Module (js/storage.js)
 * =============================================================================
 * Handles all browser Local Storage interactions:
 * - Persisting recently searched cities
 * - Saving temperature unit preferences (°C / °F)
 * - Saving UI theme preferences (Dark / Light)
 * - Optionally saving user-provided API key from the in-app settings
 *
 * KEY JAVASCRIPT CONCEPTS PRACTICED:
 * 1. Web Storage API: `localStorage.getItem()` & `localStorage.setItem()`
 * 2. Serialization: Converting JS objects/arrays to strings via `JSON.stringify()`
 * 3. Deserialization: Parsing stored JSON strings back to JS objects via `JSON.parse()`
 * 4. Error Handling: `try...catch` blocks to protect against disabled storage or private modes
 * 5. Array Methods: `.filter()`, `.slice()`, `.unshift()` for list management
 */

const WeatherStorage = {
  // Storage keys (constants to prevent typos)
  KEYS: {
    RECENT_SEARCHES: 'skycast_recent_searches',
    TEMP_UNIT: 'skycast_temp_unit',
    THEME: 'skycast_theme',
    CUSTOM_API_KEY: 'skycast_custom_api_key',
    PROVIDER: 'skycast_provider'
  },

  // Maximum number of recent cities to remember
  MAX_RECENT_SEARCHES: 6,

  /**
   * Save a newly searched city name to localStorage
   * @param {string} city - Name of the city to store
   * @returns {Array<string>} - Updated array of recent city names
   */
  saveRecentSearch(city) {
    if (!city || typeof city !== 'string') return this.loadRecentSearches();

    const normalizedCity = city.trim();
    if (!normalizedCity) return this.loadRecentSearches();

    try {
      // 1. Retrieve the existing list from storage
      const existing = this.loadRecentSearches();

      // 2. Filter out duplicate entries (case-insensitive) to prevent duplicates
      const filtered = existing.filter(
        item => item.toLowerCase() !== normalizedCity.toLowerCase()
      );

      // 3. Add the new city at the beginning of the list
      filtered.unshift(normalizedCity);

      // 4. Cap list size to MAX_RECENT_SEARCHES
      const trimmedList = filtered.slice(0, this.MAX_RECENT_SEARCHES);

      // 5. Save array back into localStorage as a JSON string
      localStorage.setItem(this.KEYS.RECENT_SEARCHES, JSON.stringify(trimmedList));

      return trimmedList;
    } catch (error) {
      console.warn('Storage error: Unable to save recent search to localStorage', error);
      return [];
    }
  },

  /**
   * Retrieve the list of recently searched cities
   * @returns {Array<string>} - Array of city names (or empty array on error)
   */
  loadRecentSearches() {
    try {
      const data = localStorage.getItem(this.KEYS.RECENT_SEARCHES);
      // JSON.parse turns the serialized string back into a JavaScript array
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Storage error: Unable to load recent searches', error);
      return [];
    }
  },

  /**
   * Remove a specific city from recent searches
   * @param {string} city - The city to delete
   * @returns {Array<string>} - Updated list of recent cities
   */
  removeRecentSearch(city) {
    try {
      const existing = this.loadRecentSearches();
      const updated = existing.filter(
        item => item.toLowerCase() !== city.trim().toLowerCase()
      );
      localStorage.setItem(this.KEYS.RECENT_SEARCHES, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.warn('Storage error: Unable to remove recent search', error);
      return [];
    }
  },

  /**
   * Clear all recent searches from localStorage
   */
  clearRecentSearches() {
    try {
      localStorage.removeItem(this.KEYS.RECENT_SEARCHES);
    } catch (error) {
      console.warn('Storage error: Unable to clear recent searches', error);
    }
  },

  /**
   * Save temperature unit preference ('metric' for °C or 'imperial' for °F)
   * @param {string} unit - 'metric' | 'imperial'
   */
  saveUnit(unit) {
    try {
      localStorage.setItem(this.KEYS.TEMP_UNIT, unit);
    } catch (error) {
      console.warn('Storage error: Unable to save unit preference', error);
    }
  },

  /**
   * Load saved temperature unit preference
   * @param {string} defaultUnit - Fallback default unit if not previously saved
   * @returns {string} - 'metric' or 'imperial'
   */
  loadUnit(defaultUnit = 'metric') {
    try {
      const savedUnit = localStorage.getItem(this.KEYS.TEMP_UNIT);
      return savedUnit === 'imperial' || savedUnit === 'metric' ? savedUnit : defaultUnit;
    } catch (error) {
      return defaultUnit;
    }
  },

  /**
   * Save theme preference ('dark' | 'light')
   * @param {string} theme - 'dark' or 'light'
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.KEYS.THEME, theme);
    } catch (error) {
      console.warn('Storage error: Unable to save theme preference', error);
    }
  },

  /**
   * Load saved theme preference
   * @param {string} defaultTheme - Fallback default theme
   * @returns {string} - 'dark' or 'light'
   */
  loadTheme(defaultTheme = 'dark') {
    try {
      const savedTheme = localStorage.getItem(this.KEYS.THEME);
      return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : defaultTheme;
    } catch (error) {
      return defaultTheme;
    }
  },

  /**
   * Save custom OpenWeatherMap API key entered by user in the UI
   * @param {string} apiKey - 32-character API key
   */
  saveCustomApiKey(apiKey) {
    try {
      if (apiKey && apiKey.trim()) {
        localStorage.setItem(this.KEYS.CUSTOM_API_KEY, apiKey.trim());
      } else {
        localStorage.removeItem(this.KEYS.CUSTOM_API_KEY);
      }
    } catch (error) {
      console.warn('Storage error: Unable to save custom API key', error);
    }
  },

  /**
   * Load custom OpenWeatherMap API key from localStorage
   * @returns {string|null}
   */
  loadCustomApiKey() {
    try {
      return localStorage.getItem(this.KEYS.CUSTOM_API_KEY) || null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Save active weather API provider ('auto', 'openmeteo', 'openweathermap')
   * @param {string} provider
   */
  saveProvider(provider = 'auto') {
    try {
      localStorage.setItem(this.KEYS.PROVIDER, provider);
    } catch (error) {
      console.warn('Storage error: Unable to save provider', error);
    }
  },

  /**
   * Load saved weather API provider
   * @returns {string} - 'auto', 'openmeteo', or 'openweathermap'
   */
  loadProvider() {
    try {
      return localStorage.getItem(this.KEYS.PROVIDER) || 'auto';
    } catch (error) {
      return 'auto';
    }
  }
};

// Expose on window object
if (typeof window !== 'undefined') {
  window.WeatherStorage = WeatherStorage;
}

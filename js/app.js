/**
 * SkyCast - Main Application Module (js/app.js)
 * =============================================================================
 * Acts as the controller / orchestrator of the entire SkyCast application:
 * - Initializes application state (unit, theme, recent searches, API key check)
 * - Sets up DOM event listeners (Search submit, Enter key, Geolocation, Unit toggle,
 *   Theme toggle, Refresh, Recent search chips, API Key modal)
 * - Coordinates between API requests (api.js), storage (storage.js), and rendering (ui.js)
 * - Implements graceful error handling and loading indicators
 *
 * KEY JAVASCRIPT CONCEPTS PRACTICED:
 * 1. Asynchronous Programming: `async / await` and Promise handling
 * 2. Event Handling: `addEventListener` for `submit`, `click`, `input`, `keydown`
 * 3. Browser Geolocation API: `navigator.geolocation.getCurrentPosition()`
 * 4. State Management: Keeping track of `currentCity`, `currentUnit`, `currentTheme`
 * 5. Error Catching: Try / Catch blocks for graceful failure modes
 * 6. Code Architecture: Clean separation of concerns (Model-View-Controller pattern)
 */

// Application State Object
const AppState = {
  currentCity: '',
  currentCoords: null, // { lat, lon } when using geolocation
  currentUnit: 'metric', // 'metric' (°C) or 'imperial' (°F)
  currentTheme: 'dark', // 'dark' or 'light'
  lastWeatherData: null, // Cached data to allow instant unit toggles
  recentSearches: [],
  isLoading: false
};

/**
 * =============================================================================
 * CORE APPLICATION FUNCTIONS (As Required by Specification)
 * =============================================================================
 */

/**
 * 1. searchWeather(city)
 * Main entry point for searching weather by city name.
 * Fetches current weather and 5-day forecast, updates UI, and stores search in history.
 *
 * @param {string} city - Name of city to search
 */
async function searchWeather(city) {
  // Prevent duplicate concurrent searches
  if (AppState.isLoading) return;

  // Validate input
  if (!city || !city.trim()) {
    if (WeatherUI.elements.searchForm) {
      WeatherUI.elements.searchForm.classList.add('shake');
      setTimeout(() => WeatherUI.elements.searchForm.classList.remove('shake'), 500);
    }
    showError('Please enter a city name to search.');
    return;
  }

  const query = city.trim();
  AppState.isLoading = true;

  showLoading(`Fetching weather information for ${query}...`);
  WeatherUI.clearError();

  try {
    /**
     * ASYNCHRONOUS API CALL:
     * `WeatherAPI.searchWeather` returns a Promise that resolves with both
     * current weather and 5-day forecast data concurrently via Promise.all.
     */
    const { current, forecast } = await WeatherAPI.searchWeather(query, AppState.currentUnit);

    // Update application state
    AppState.currentCity = current.name;
    AppState.currentCoords = null; // Reset coordinates since this was a city search
    AppState.lastWeatherData = { current, forecast };

    // Render all UI components
    displayCurrentWeather(current);
    displayWeatherDetails(current);
    displayHourlyForecast(forecast);
    displayFiveDayForecast(forecast);

    // Save city to recent searches history in localStorage
    saveRecentSearch(current.name);

    // Hide API key banner if it was showing
    WeatherUI.toggleApiKeyBanner(false);
  } catch (error) {
    console.error('Weather search error:', error);
    showError(error.message || 'Failed to fetch weather data. Please try again.');
  } finally {
    // Reset loading state and hide loading indicators
    AppState.isLoading = false;
    hideLoading();
  }
}

/**
 * 2. fetchCurrentWeather(city)
 * Asynchronously retrieves current weather data for a city using the Fetch API.
 *
 * @param {string} city - City name
 * @returns {Promise<Object>} - Parsed weather JSON data
 */
async function fetchCurrentWeather(city) {
  return await WeatherAPI.fetchCurrentWeather(city, AppState.currentUnit);
}

/**
 * 3. fetchForecast(city)
 * Asynchronously retrieves 5-day forecast data for a city using the Fetch API.
 *
 * @param {string} city - City name
 * @returns {Promise<Object>} - Parsed forecast JSON data
 */
async function fetchForecast(city) {
  return await WeatherAPI.fetchForecast(city, AppState.currentUnit);
}

/**
 * 4. displayCurrentWeather(data)
 * Updates the hero current weather card in the DOM.
 *
 * @param {Object} data - Current weather API response
 */
function displayCurrentWeather(data) {
  WeatherUI.displayCurrentWeather(data, AppState.currentUnit);
}

/**
 * 5. displayWeatherDetails(data)
 * Updates the 7 weather detail metric cards (humidity, wind, pressure, etc.).
 *
 * @param {Object} data - Current weather API response
 */
function displayWeatherDetails(data) {
  WeatherUI.displayWeatherDetails(data, AppState.currentUnit);
}

/**
 * 6. displayHourlyForecast(data)
 * Renders the 24-hour horizontal forecast cards.
 *
 * @param {Object} data - Forecast API response
 */
function displayHourlyForecast(data) {
  WeatherUI.displayHourlyForecast(data, AppState.currentUnit);
}

/**
 * 7. displayFiveDayForecast(data)
 * Renders the 5-day extended daily forecast summary.
 *
 * @param {Object} data - Forecast API response
 */
function displayFiveDayForecast(data) {
  WeatherUI.displayFiveDayForecast(data, AppState.currentUnit);
}

/**
 * 8. saveRecentSearch(city)
 * Persists a newly searched city into localStorage and refreshes the recent chips UI.
 *
 * @param {string} city - Name of city to store
 */
function saveRecentSearch(city) {
  const updatedSearches = WeatherStorage.saveRecentSearch(city);
  AppState.recentSearches = updatedSearches;
  WeatherUI.renderRecentSearches(
    AppState.recentSearches,
    handleSelectRecentCity,
    handleRemoveRecentCity
  );
}

/**
 * 9. loadRecentSearches()
 * Retrieves stored search history from localStorage and populates the chips UI.
 */
function loadRecentSearches() {
  AppState.recentSearches = WeatherStorage.loadRecentSearches();
  WeatherUI.renderRecentSearches(
    AppState.recentSearches,
    handleSelectRecentCity,
    handleRemoveRecentCity
  );
}

/**
 * 10. toggleTemperatureUnit()
 * Toggles between Celsius ('metric') and Fahrenheit ('imperial').
 * Immediately re-renders or re-fetches the weather data with the new unit.
 */
async function toggleTemperatureUnit() {
  const newUnit = AppState.currentUnit === 'metric' ? 'imperial' : 'metric';
  AppState.currentUnit = newUnit;

  // Persist preference to localStorage
  WeatherStorage.saveUnit(newUnit);

  // Update toggle button appearance
  WeatherUI.updateUnitToggleUI(newUnit);

  // If a city or coordinates are currently loaded, re-fetch data in the new unit
  if (AppState.currentCoords) {
    await searchWeatherByCoordinates(
      AppState.currentCoords.lat,
      AppState.currentCoords.lon
    );
  } else if (AppState.currentCity) {
    await searchWeather(AppState.currentCity);
  }
}

/**
 * 11. getUserLocation()
 * Uses the HTML5 Geolocation API (`navigator.geolocation.getCurrentPosition`)
 * to detect the user's geographic coordinates and load local weather.
 */
function getUserLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }

  showLoading('Detecting your location...');

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      await searchWeatherByCoordinates(latitude, longitude);
    },
    (error) => {
      hideLoading();
      console.warn('Geolocation error:', error);
      let errorMsg = 'Unable to retrieve your location.';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = 'Location access denied. Please allow location access or search manually.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = 'Location information is currently unavailable.';
          break;
        case error.TIMEOUT:
          errorMsg = 'Location request timed out. Please try again.';
          break;
      }
      showError(errorMsg);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

/**
 * Helper: Search weather by geographic coordinates
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
async function searchWeatherByCoordinates(lat, lon) {
  if (AppState.isLoading) return;
  AppState.isLoading = true;

  showLoading('Retrieving weather for your coordinates...');
  WeatherUI.clearError();

  try {
    const { current, forecast } = await WeatherAPI.searchWeatherByCoords(
      lat,
      lon,
      AppState.currentUnit
    );

    AppState.currentCity = current.name;
    AppState.currentCoords = { lat, lon };
    AppState.lastWeatherData = { current, forecast };

    displayCurrentWeather(current);
    displayWeatherDetails(current);
    displayHourlyForecast(forecast);
    displayFiveDayForecast(forecast);

    saveRecentSearch(current.name);
    WeatherUI.toggleApiKeyBanner(false);
  } catch (error) {
    console.error('Coordinates search error:', error);
    showError(error.message || 'Failed to fetch weather for your location.');
  } finally {
    AppState.isLoading = false;
    hideLoading();
  }
}

/**
 * 12. showLoading(message)
 * Shows the loading spinner and status message.
 */
function showLoading(message) {
  WeatherUI.showLoading(message);
}

/**
 * 13. hideLoading()
 * Hides the loading spinner.
 */
function hideLoading() {
  WeatherUI.hideLoading();
}

/**
 * 14. showError(message)
 * Displays an error notification toast.
 */
function showError(message) {
  WeatherUI.showError(message);
}

/**
 * 15. toggleTheme()
 * Toggles between Dark Navy gradient and Light Sky themes.
 */
function toggleTheme() {
  const newTheme = AppState.currentTheme === 'dark' ? 'light' : 'dark';
  AppState.currentTheme = newTheme;

  // Persist to localStorage
  WeatherStorage.saveTheme(newTheme);

  // Update UI
  WeatherUI.updateThemeUI(newTheme);
}

/**
 * =============================================================================
 * EVENT HANDLERS & CALLBACKS
 * =============================================================================
 */

/**
 * Callback when user clicks on a recent city chip
 */
function handleSelectRecentCity(city) {
  if (WeatherUI.elements.cityInput) {
    WeatherUI.elements.cityInput.value = city;
  }
  searchWeather(city);
}

/**
 * Callback when user deletes a single recent search chip
 */
function handleRemoveRecentCity(city) {
  const updated = WeatherStorage.removeRecentSearch(city);
  AppState.recentSearches = updated;
  WeatherUI.renderRecentSearches(
    AppState.recentSearches,
    handleSelectRecentCity,
    handleRemoveRecentCity
  );
}

/**
 * Refresh weather for currently active city
 */
async function refreshWeatherData() {
  if (WeatherUI.elements.refreshBtn) {
    WeatherUI.elements.refreshBtn.classList.add('rotating');
  }

  if (AppState.currentCoords) {
    await searchWeatherByCoordinates(
      AppState.currentCoords.lat,
      AppState.currentCoords.lon
    );
  } else if (AppState.currentCity) {
    await searchWeather(AppState.currentCity);
  } else {
    // If no city has been loaded yet, load the default city
    const defaultCity = window.CONFIG?.DEFAULT_CITY || 'London';
    await searchWeather(defaultCity);
  }

  if (WeatherUI.elements.refreshBtn) {
    setTimeout(() => {
      WeatherUI.elements.refreshBtn.classList.remove('rotating');
    }, 600);
  }
}

/**
 * Attach all DOM event listeners
 */
function setupEventListeners() {
  const { elements } = WeatherUI;

  // 1. Search Form Submission
  if (elements.searchForm) {
    elements.searchForm.addEventListener('submit', (e) => {
      // Prevent default page reload
      e.preventDefault();
      const city = elements.cityInput?.value?.trim();
      searchWeather(city);
    });
  }

  // 2. City Input text changes & Enter key
  if (elements.cityInput) {
    elements.cityInput.addEventListener('input', (e) => {
      if (elements.clearInputBtn) {
        elements.clearInputBtn.classList.toggle('hidden', !e.target.value);
      }
    });

    elements.cityInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchWeather(elements.cityInput.value.trim());
      }
    });
  }

  // 3. Clear Input Button (x)
  if (elements.clearInputBtn) {
    elements.clearInputBtn.addEventListener('click', () => {
      if (elements.cityInput) {
        elements.cityInput.value = '';
        elements.cityInput.focus();
      }
      elements.clearInputBtn.classList.add('hidden');
    });
  }

  // 4. Geolocation "Locate Me" Button
  if (elements.locateBtn) {
    elements.locateBtn.addEventListener('click', () => {
      getUserLocation();
    });
  }

  // 5. Refresh Button
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', () => {
      refreshWeatherData();
    });
  }

  // 6. Temperature Unit Toggle Button (°C / °F)
  if (elements.unitToggleBtn) {
    elements.unitToggleBtn.addEventListener('click', () => {
      toggleTemperatureUnit();
    });
  }

  // 7. Dark/Light Theme Toggle Button
  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.addEventListener('click', () => {
      toggleTheme();
    });
  }

  // 8. Popular Cities shortcut chips
  if (elements.popularChipsList) {
    elements.popularChipsList.addEventListener('click', (e) => {
      const button = e.target.closest('.popular-city-btn');
      if (button && button.dataset.city) {
        const city = button.dataset.city;
        if (elements.cityInput) {
          elements.cityInput.value = city;
        }
        searchWeather(city);
      }
    });
  }

  // 9. Alert Dismiss Button
  if (elements.alertCloseBtn) {
    elements.alertCloseBtn.addEventListener('click', () => {
      WeatherUI.clearError();
    });
  }

  // 10. Hourly Forecast Horizontal Scroll Buttons
  if (elements.scrollLeftHourlyBtn && elements.hourlyList) {
    elements.scrollLeftHourlyBtn.addEventListener('click', () => {
      elements.hourlyList.scrollBy({ left: -240, behavior: 'smooth' });
    });
  }
  if (elements.scrollRightHourlyBtn && elements.hourlyList) {
    elements.scrollRightHourlyBtn.addEventListener('click', () => {
      elements.hourlyList.scrollBy({ left: 240, behavior: 'smooth' });
    });
  }

  // 11. API Key Settings Modal
  if (elements.settingsBtn) {
    elements.settingsBtn.addEventListener('click', () => {
      WeatherUI.showApiKeyModal();
    });
  }
  if (elements.openKeyModalFromBanner) {
    elements.openKeyModalFromBanner.addEventListener('click', () => {
      WeatherUI.showApiKeyModal();
    });
  }
  if (elements.closeApiKeyModalBtn) {
    elements.closeApiKeyModalBtn.addEventListener('click', () => {
      WeatherUI.hideApiKeyModal();
    });
  }

  // Close modal when clicking on backdrop
  if (elements.apiKeyModal) {
    elements.apiKeyModal.addEventListener('click', (e) => {
      if (e.target === elements.apiKeyModal) {
        WeatherUI.hideApiKeyModal();
      }
    });
  }

  // Toggle API Key password visibility
  if (elements.toggleKeyVisibilityBtn && elements.apiKeyInput) {
    elements.toggleKeyVisibilityBtn.addEventListener('click', () => {
      const isPassword = elements.apiKeyInput.type === 'password';
      elements.apiKeyInput.type = isPassword ? 'text' : 'password';
      elements.toggleKeyVisibilityBtn.textContent = isPassword ? 'Hide' : 'Show';
    });
  }

  // Save API Key from Modal
  if (elements.saveApiKeyBtn && elements.apiKeyInput) {
    elements.saveApiKeyBtn.addEventListener('click', async () => {
      const keyVal = elements.apiKeyInput.value.trim();
      if (!keyVal) {
        if (elements.apiKeyTestFeedback) {
          elements.apiKeyTestFeedback.textContent = 'Please enter an API key.';
          elements.apiKeyTestFeedback.className = 'modal-feedback error';
        }
        return;
      }

      if (elements.apiKeyTestFeedback) {
        elements.apiKeyTestFeedback.textContent = 'Verifying key with OpenWeatherMap...';
        elements.apiKeyTestFeedback.className = 'modal-feedback';
      }

        const testResult = await WeatherAPI.validateApiKey(keyVal);
        WeatherStorage.saveCustomApiKey(keyVal);
        WeatherUI.toggleApiKeyBanner(false);

        if (testResult.valid) {
          if (elements.apiKeyTestFeedback) {
            elements.apiKeyTestFeedback.textContent = testResult.message;
            elements.apiKeyTestFeedback.className = 'modal-feedback success';
          }
          setTimeout(() => {
            WeatherUI.hideApiKeyModal();
            const cityToSearch = AppState.currentCity || window.CONFIG?.DEFAULT_CITY || 'London';
            searchWeather(cityToSearch);
          }, 800);
        } else {
          if (elements.apiKeyTestFeedback) {
            elements.apiKeyTestFeedback.textContent = testResult.message;
            elements.apiKeyTestFeedback.className = 'modal-feedback warning';
          }
          setTimeout(() => {
            WeatherUI.hideApiKeyModal();
            const cityToSearch = AppState.currentCity || window.CONFIG?.DEFAULT_CITY || 'London';
            searchWeather(cityToSearch);
          }, 2200);
        }
      });
  }

  // Clear API Key
  if (elements.clearApiKeyBtn) {
    elements.clearApiKeyBtn.addEventListener('click', () => {
      WeatherStorage.saveCustomApiKey('');
      if (elements.apiKeyInput) elements.apiKeyInput.value = '';
      WeatherUI.toggleApiKeyBanner(true);
      if (elements.apiKeyTestFeedback) {
        elements.apiKeyTestFeedback.textContent = 'Key cleared.';
        elements.apiKeyTestFeedback.className = 'modal-feedback';
      }
    });
  }
}

/**
 * =============================================================================
 * APPLICATION INITIALIZATION
 * =============================================================================
 */
async function initApp() {
  console.log('Initializing SkyCast Application...');

  // 1. Initialize UI (clocks, DOM handles)
  WeatherUI.init();

  // 2. Load stored preferences from localStorage
  const savedUnit = WeatherStorage.loadUnit(window.CONFIG?.DEFAULT_UNIT || 'metric');
  AppState.currentUnit = savedUnit;
  WeatherUI.updateUnitToggleUI(savedUnit);

  const savedTheme = WeatherStorage.loadTheme('dark');
  AppState.currentTheme = savedTheme;
  WeatherUI.updateThemeUI(savedTheme);

  // 3. Load search history
  loadRecentSearches();

  // 4. Attach event listeners
  setupEventListeners();

  // 5. Check API key status
  const hasKey = WeatherAPI.hasApiKey();
  WeatherUI.toggleApiKeyBanner(!hasKey);

  // 6. Initial Weather Load
    if (AppState.recentSearches.length > 0) {
      await searchWeather(AppState.recentSearches[0]);
    } else {
      const defaultCity = window.CONFIG?.DEFAULT_CITY || 'London';
      await searchWeather(defaultCity);
    }
  }

  // Start application when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', initApp);

/**
 * SkyCast - UI Module (js/ui.js)
 * =============================================================================
 * Handles all DOM manipulation, rendering, and visual state management:
 * - Current weather hero display
 * - Weather metrics details grid
 * - 24-hour hourly forecast cards
 * - 5-day daily forecast list with visual range bars
 * - Dynamic condition-based atmospheric background glow
 * - Loading spinners, skeleton shimmers, and error alert toasts
 * - Recent searches chips and popular cities shortcuts
 * - Unit toggle (°C / °F) and Theme toggle (Dark / Light)
 * - API Key configuration modal
 *
 * KEY JAVASCRIPT CONCEPTS PRACTICED:
 * 1. DOM Selection: `document.getElementById()`, `document.querySelector()`
 * 2. Element Creation: `document.createElement()`, `appendChild()`
 * 3. Dynamic Templating: Template literals (`` `...` ``) for HTML generation
 * 4. Text and HTML: `element.textContent` (safe against XSS) vs `element.innerHTML`
 * 5. Class Manipulation: `classList.add()`, `classList.remove()`, `classList.toggle()`
 * 6. Date & Time Math: Computing UTC offset and city-local time
 * 7. Array Transformations: `.filter()`, `.map()`, `.forEach()`, `.reduce()`
 */

const WeatherUI = {
  // Cache DOM element references for fast repeated access
  elements: {
    // Top Nav
    currentDateEl: document.getElementById('currentDate'),
    unitToggleBtn: document.getElementById('unitToggleBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    apiKeyStatusBadge: document.getElementById('apiKeyStatusBadge'),

    // Search
    searchForm: document.getElementById('searchForm'),
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    clearInputBtn: document.getElementById('clearInputBtn'),
    locateBtn: document.getElementById('locateBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    recentSearchesContainer: document.getElementById('recentSearchesContainer'),
    recentChipsList: document.getElementById('recentChipsList'),
    popularChipsList: document.getElementById('popularChipsList'),

    // Notification / Alert
    alertToast: document.getElementById('alertToast'),
    alertMessage: document.getElementById('alertMessage'),
    alertCloseBtn: document.getElementById('alertCloseBtn'),
    apiKeyBanner: document.getElementById('apiKeyBanner'),
    openKeyModalFromBanner: document.getElementById('openKeyModalFromBanner'),

    // Loading & Empty states
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingMessage: document.getElementById('loadingMessage'),
    welcomeState: document.getElementById('welcomeState'),
    weatherDashboard: document.getElementById('weatherDashboard'),

    // Current Weather Hero
    cityName: document.getElementById('cityName'),
    countryBadge: document.getElementById('countryBadge'),
    localTime: document.getElementById('localTime'),
    currentTemp: document.getElementById('currentTemp'),
    tempUnitLabel: document.getElementById('tempUnitLabel'),
    weatherCondition: document.getElementById('weatherCondition'),
    weatherDescription: document.getElementById('weatherDescription'),
    weatherIconHero: document.getElementById('weatherIconHero'),
    feelsLikeTemp: document.getElementById('feelsLikeTemp'),
    tempHigh: document.getElementById('tempHigh'),
    tempLow: document.getElementById('tempLow'),

    // Weather Details Grid
    humidityVal: document.getElementById('humidityVal'),
    humidityDesc: document.getElementById('humidityDesc'),
    windVal: document.getElementById('windVal'),
    windDir: document.getElementById('windDir'),
    pressureVal: document.getElementById('pressureVal'),
    pressureDesc: document.getElementById('pressureDesc'),
    visibilityVal: document.getElementById('visibilityVal'),
    visibilityDesc: document.getElementById('visibilityDesc'),
    cloudsVal: document.getElementById('cloudsVal'),
    cloudsBar: document.getElementById('cloudsBar'),
    sunriseVal: document.getElementById('sunriseVal'),
    sunsetVal: document.getElementById('sunsetVal'),

    // Hourly Forecast
    hourlyList: document.getElementById('hourlyList'),
    scrollLeftHourlyBtn: document.getElementById('scrollLeftHourlyBtn'),
    scrollRightHourlyBtn: document.getElementById('scrollRightHourlyBtn'),

    // 5-Day Forecast
    fiveDayList: document.getElementById('fiveDayList'),

    // API Key Modal
    apiKeyModal: document.getElementById('apiKeyModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    toggleKeyVisibilityBtn: document.getElementById('toggleKeyVisibilityBtn'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    clearApiKeyBtn: document.getElementById('clearApiKeyBtn'),
    closeApiKeyModalBtn: document.getElementById('closeApiKeyModalBtn'),
    apiKeyTestFeedback: document.getElementById('apiKeyTestFeedback')
  },

  /**
   * Initialize UI elements and live header clock
   */
  init() {
    this.updateHeaderDate();
    // Update live clock every minute
    setInterval(() => this.updateHeaderDate(), 60000);
  },

  /**
   * Update header with today's formatted date
   */
  updateHeaderDate() {
    if (!this.elements.currentDateEl) return;
    const now = new Date();
    const options = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    this.elements.currentDateEl.textContent = now.toLocaleDateString('en-US', options);
  },

  /**
   * Calculate and format the local time of the searched city
   * using the OpenWeatherMap timezone offset (in seconds from UTC).
   *
   * @param {number} timezoneOffsetSeconds - Seconds shifted from UTC
   * @returns {{ formattedTime: string, formattedDate: string }}
   */
  getCityLocalDateTime(timezoneOffsetSeconds = 0) {
    // Current UTC timestamp in milliseconds plus city offset
    const cityNowMs = Date.now() + (timezoneOffsetSeconds * 1000);
    const cityDate = new Date(cityNowMs);

    const timeOptions = {
      timeZone: 'UTC',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    const dateOptions = {
      timeZone: 'UTC',
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    };

    return {
      formattedTime: cityDate.toLocaleTimeString('en-US', timeOptions),
      formattedDate: cityDate.toLocaleDateString('en-US', dateOptions)
    };
  },

  /**
   * Format UNIX timestamp to 12-hour time string in city's local time
   *
   * @param {number} unixTimestamp - UNIX seconds
   * @param {number} timezoneOffsetSeconds - City timezone offset
   * @returns {string} - e.g. "06:45 AM"
   */
  formatUnixTime(unixTimestamp, timezoneOffsetSeconds = 0) {
    if (!unixTimestamp) return '--:--';
    // Shift timestamp by city timezone offset, then render in UTC
    const cityMs = (unixTimestamp + timezoneOffsetSeconds) * 1000;
    const cityDate = new Date(cityMs);
    return cityDate.toLocaleTimeString('en-US', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  },

  /**
   * Map OpenWeatherMap icon codes and condition text to our crisp SVG icons
   *
   * @param {string} iconCode - e.g. '01d', '02n', '10d', '11d'
   * @param {string} condition - e.g. 'Rain', 'Clear', 'Clouds'
   * @returns {string} - HTML string containing SVG or SVG image reference
   */
  getWeatherIconSvg(iconCode = '01d', condition = '') {
    if (!iconCode || typeof iconCode !== 'string') iconCode = '01d';
    const isNight = iconCode.endsWith('n');
    const code = iconCode.substring(0, 2);

    switch (code) {
      case '01': // Clear sky
        return isNight ? 'assets/icons/clear-night.svg' : 'assets/icons/clear-day.svg';
      case '02': // Few clouds
        return isNight ? 'assets/icons/partly-cloudy.svg' : 'assets/icons/partly-cloudy.svg';
      case '03': // Scattered clouds
      case '04': // Broken / Overcast
        return 'assets/icons/cloudy.svg';
      case '09': // Shower rain
      case '10': // Rain
        return 'assets/icons/rain.svg';
      case '11': // Thunderstorm
        return 'assets/icons/thunderstorm.svg';
      case '13': // Snow
        return 'assets/icons/snow.svg';
      case '50': // Mist / Fog / Haze
        return 'assets/icons/mist.svg';
      default:
        // Fallback to OpenWeatherMap 4x high-res PNG if custom SVG is unmapped
        return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    }
  },

  /**
   * Convert degrees (0-360) into standard compass direction
   * @param {number} deg
   * @returns {string} - e.g. "NE", "SSW"
   */
  getWindDirection(deg) {
    if (deg === undefined || deg === null) return 'N/A';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((deg % 360) / 22.5) % 16;
    return directions[index];
  },

  /**
   * Update the dynamic background gradient based on weather condition
   * @param {string} weatherMain - e.g. 'Clear', 'Clouds', 'Rain', 'Snow', 'Thunderstorm'
   * @param {boolean} isNight
   */
  updateAtmosphericBackground(weatherMain = 'Clear', isNight = false) {
    const root = document.documentElement;
    const condition = weatherMain.toLowerCase();

    // Sets custom CSS attribute to trigger smooth background shifts
    if (condition.includes('clear')) {
      root.setAttribute('data-weather-state', isNight ? 'clear-night' : 'clear-day');
    } else if (condition.includes('cloud')) {
      root.setAttribute('data-weather-state', 'cloudy');
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
      root.setAttribute('data-weather-state', 'rain');
    } else if (condition.includes('thunder') || condition.includes('storm')) {
      root.setAttribute('data-weather-state', 'storm');
    } else if (condition.includes('snow')) {
      root.setAttribute('data-weather-state', 'snow');
    } else if (condition.includes('mist') || condition.includes('fog') || condition.includes('haze')) {
      root.setAttribute('data-weather-state', 'mist');
    } else {
      root.setAttribute('data-weather-state', 'default');
    }
  },

  /**
   * Display Current Weather section
   *
   * @param {Object} data - Parsed response from `/weather` endpoint
   * @param {string} unit - 'metric' or 'imperial'
   */
  displayCurrentWeather(data, unit = 'metric') {
    if (!data) return;

    const unitSymbol = unit === 'imperial' ? '°F' : '°C';
    const weather = data.weather && data.weather[0] ? data.weather[0] : {};
    const iconCode = weather.icon || '01d';
    const isNight = iconCode.endsWith('n');

    // 1. City and country name
    this.elements.cityName.textContent = data.name || 'Unknown City';
    if (data.sys?.country) {
      this.elements.countryBadge.textContent = data.sys.country;
      this.elements.countryBadge.classList.remove('hidden');
    } else {
      this.elements.countryBadge.textContent = '';
      this.elements.countryBadge.classList.add('hidden');
    }

    // 2. City local date & time
    const cityTimeInfo = this.getCityLocalDateTime(data.timezone);
    this.elements.localTime.textContent = `${cityTimeInfo.formattedDate} • ${cityTimeInfo.formattedTime} (Local)`;

    // 3. Current Temperature
    const currentTemp = Math.round(data.main.temp);
    this.elements.currentTemp.textContent = currentTemp;
    this.elements.tempUnitLabel.textContent = unitSymbol;

    // 4. Condition and description
    this.elements.weatherCondition.textContent = weather.main || 'Clear';
    // Capitalize first letter of description: "scattered clouds" -> "Scattered clouds"
    const desc = weather.description || '';
    this.elements.weatherDescription.textContent =
      desc.charAt(0).toUpperCase() + desc.slice(1);

    // 5. Weather Icon
    const iconSrc = this.getWeatherIconSvg(iconCode, weather.main);
    this.elements.weatherIconHero.src = iconSrc;
    this.elements.weatherIconHero.alt = weather.description || 'Weather Icon';

    // 6. Feels like & High/Low
    this.elements.feelsLikeTemp.textContent = `${Math.round(data.main.feels_like)}${unitSymbol}`;
    this.elements.tempHigh.textContent = `${Math.round(data.main.temp_max)}${unitSymbol}`;
    this.elements.tempLow.textContent = `${Math.round(data.main.temp_min)}${unitSymbol}`;

    // 7. Update atmospheric gradient
    this.updateAtmosphericBackground(weather.main, isNight);

    // Switch view from welcome state to dashboard
    this.elements.welcomeState.classList.add('hidden');
    this.elements.weatherDashboard.classList.remove('hidden');
  },

  /**
   * Display Weather Details Grid (Cards for Humidity, Wind, Pressure, etc.)
   *
   * @param {Object} data - Current weather data
   * @param {string} unit - 'metric' or 'imperial'
   */
  displayWeatherDetails(data, unit = 'metric') {
    if (!data || !data.main) return;

    const speedUnit = unit === 'imperial' ? 'mph' : 'km/h';
    // OpenWeatherMap metric wind speed is m/s; convert to km/h (* 3.6)
    const rawSpeed = data.wind?.speed || 0;
    const displaySpeed = unit === 'imperial'
      ? Math.round(rawSpeed)
      : Math.round(rawSpeed * 3.6);

    // 1. Humidity
    const humidity = data.main.humidity ?? 0;
    this.elements.humidityVal.textContent = `${humidity}%`;
    let humidityTag = 'Comfortable';
    if (humidity < 30) humidityTag = 'Dry & Crisp';
    else if (humidity > 70) humidityTag = 'High Moisture';
    this.elements.humidityDesc.textContent = humidityTag;

    // 2. Wind Speed & Direction
    const windDirection = this.getWindDirection(data.wind?.deg);
    this.elements.windVal.textContent = `${displaySpeed} ${speedUnit}`;
    this.elements.windDir.textContent = `Direction: ${windDirection} (${data.wind?.deg ?? 0}°)`;

    // 3. Pressure
    const pressure = data.main.pressure ?? 1013;
    this.elements.pressureVal.textContent = `${pressure} hPa`;
    let pressureTag = 'Normal Pressure';
    if (pressure > 1020) pressureTag = 'High Pressure (Fair)';
    else if (pressure < 1005) pressureTag = 'Low Pressure (Stormy)';
    this.elements.pressureDesc.textContent = pressureTag;

    // 4. Visibility
    const visibilityMeters = data.visibility ?? 10000;
    const visibilityKm = (visibilityMeters / 1000).toFixed(1);
    const visibilityMiles = (visibilityMeters / 1609.34).toFixed(1);
    const displayVisibility = unit === 'imperial' ? `${visibilityMiles} mi` : `${visibilityKm} km`;
    this.elements.visibilityVal.textContent = displayVisibility;
    this.elements.visibilityDesc.textContent =
      visibilityMeters >= 9000 ? 'Clear Visibility' : 'Hazy / Reduced';

    // 5. Cloud Coverage
    const clouds = data.clouds?.all ?? 0;
    this.elements.cloudsVal.textContent = `${clouds}%`;
    if (this.elements.cloudsBar) {
      this.elements.cloudsBar.style.width = `${clouds}%`;
    }

    // 6. Sunrise & Sunset (formatted to city local time!)
    const sunriseStr = this.formatUnixTime(data.sys?.sunrise, data.timezone);
    const sunsetStr = this.formatUnixTime(data.sys?.sunset, data.timezone);
    this.elements.sunriseVal.textContent = sunriseStr;
    this.elements.sunsetVal.textContent = sunsetStr;
  },

  /**
   * Render upcoming hourly weather cards (Up to 72 hours in 3-hour increments)
   *
   * @param {Object} forecastData - Parsed forecast response
   * @param {string} unit - 'metric' or 'imperial'
   */
  displayHourlyForecast(forecastData, unit = 'metric') {
    if (!forecastData || !forecastData.list) return;

    const unitSymbol = unit === 'imperial' ? '°F' : '°C';
    const cityOffset = forecastData.city?.timezone || 0;
    // Render up to 24 upcoming intervals (72 hours) so cards scroll smoothly on all screen sizes
    const list = forecastData.list.slice(0, 24);

    // Clear previous items
    this.elements.hourlyList.innerHTML = '';

    const todayKey = new Date(Date.now() + cityOffset * 1000).toISOString().split('T')[0];

    list.forEach((item, index) => {
      const weather = item.weather && item.weather[0] ? item.weather[0] : {};
      const temp = Math.round(item.main.temp);
      const iconSrc = this.getWeatherIconSvg(weather.icon, weather.main);
      const rainPop = Math.round((item.pop || 0) * 100);

      const cityDate = new Date((item.dt + cityOffset) * 1000);
      const itemDayKey = cityDate.toISOString().split('T')[0];

      // Format time label: "Now" for first item, otherwise "3 PM", or "Thu 12 AM" when into another day
      let timeLabel = '';
      if (index === 0) {
        timeLabel = 'Now';
      } else {
        const hourStr = cityDate.toLocaleTimeString('en-US', {
          timeZone: 'UTC',
          hour: 'numeric',
          hour12: true
        });
        if (itemDayKey === todayKey) {
          timeLabel = hourStr;
        } else {
          const weekday = cityDate.toLocaleDateString('en-US', {
            timeZone: 'UTC',
            weekday: 'short'
          });
          timeLabel = `${weekday} ${hourStr}`;
        }
      }

      // Create hourly card element
      const card = document.createElement('div');
      card.className = 'hourly-card glass-card';
      card.innerHTML = `
        <span class="hourly-time">${timeLabel}</span>
        <img class="hourly-icon" src="${iconSrc}" alt="${weather.description || 'Forecast'}" loading="lazy" />
        <span class="hourly-temp">${temp}${unitSymbol}</span>
        <div class="hourly-meta">
          ${rainPop > 15 ? `<span class="hourly-pop"><svg width="10" height="10" viewBox="0 0 24 24" fill="#38BDF8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg> ${rainPop}%</span>` : `<span class="hourly-cond">${weather.main}</span>`}
        </div>
      `;

      this.elements.hourlyList.appendChild(card);
    });

    // Reset scroll position to start
    this.elements.hourlyList.scrollLeft = 0;

    // Update left/right scroll arrow button states
    setTimeout(() => {
      this.updateHourlyScrollButtons();
    }, 60);
  },

  /**
   * Update disabled/active state of hourly scroll arrow buttons
   */
  updateHourlyScrollButtons() {
    const { scrollLeftHourlyBtn, scrollRightHourlyBtn, hourlyList } = this.elements;
    if (!hourlyList || !scrollLeftHourlyBtn || !scrollRightHourlyBtn) return;

    const maxScroll = hourlyList.scrollWidth - hourlyList.clientWidth;
    const currentScroll = hourlyList.scrollLeft;

    scrollLeftHourlyBtn.disabled = currentScroll <= 5;
    scrollRightHourlyBtn.disabled = currentScroll >= maxScroll - 5 || maxScroll <= 0;
  },

  /**
   * Render daily 5-day forecast cards
   * Aggregates the 40 three-hour forecast points into daily summaries
   *
   * @param {Object} forecastData - Parsed forecast response
   * @param {string} unit - 'metric' or 'imperial'
   */
  displayFiveDayForecast(forecastData, unit = 'metric') {
    if (!forecastData || !forecastData.list) return;

    const unitSymbol = unit === 'imperial' ? '°F' : '°C';
    const cityOffset = forecastData.city?.timezone || 0;

    /**
     * Group forecast items by local calendar day (YYYY-MM-DD)
     */
    const daysMap = new Map();

    forecastData.list.forEach(item => {
      const cityDate = new Date((item.dt + cityOffset) * 1000);
      const dayKey = cityDate.toISOString().split('T')[0];

      if (!daysMap.has(dayKey)) {
        daysMap.set(dayKey, []);
      }
      daysMap.get(dayKey).push({ ...item, cityDate });
    });

    // Skip today if incomplete, take the next 5 full/upcoming days
    const dailyEntries = Array.from(daysMap.entries()).slice(0, 5);

    // Find the global min and max temperature across the 5 days to scale the temperature range bar
    let globalMin = Infinity;
    let globalMax = -Infinity;

    dailyEntries.forEach(([_, items]) => {
      items.forEach(it => {
        if (it.main.temp_min < globalMin) globalMin = it.main.temp_min;
        if (it.main.temp_max > globalMax) globalMax = it.main.temp_max;
      });
    });

    const tempSpan = Math.max(1, globalMax - globalMin);

    // Clear previous items
    this.elements.fiveDayList.innerHTML = '';

    dailyEntries.forEach(([dayKey, items], index) => {
      // 1. Calculate daily min and max
      const minTemp = Math.round(Math.min(...items.map(i => i.main.temp_min)));
      const maxTemp = Math.round(Math.max(...items.map(i => i.main.temp_max)));

      // 2. Select midday representation (closest to 12:00 or 15:00 UTC for this day)
      const middayItem = items.find(i => {
        const hour = i.cityDate.getUTCHours();
        return hour >= 11 && hour <= 15;
      }) || items[Math.floor(items.length / 2)];

      const weather = middayItem.weather && middayItem.weather[0] ? middayItem.weather[0] : {};
      const iconSrc = this.getWeatherIconSvg(weather.icon, weather.main);

      // 3. Format day label: "Today", "Tomorrow", or day of week
      const todayKey = new Date(Date.now() + cityOffset * 1000).toISOString().split('T')[0];
      const tomorrowKey = new Date(Date.now() + 86400000 + cityOffset * 1000).toISOString().split('T')[0];

      let dayName = '';
      if (dayKey === todayKey) {
        dayName = 'Today';
      } else if (dayKey === tomorrowKey) {
        dayName = 'Tomorrow';
      } else {
        dayName = middayItem.cityDate.toLocaleDateString('en-US', {
          timeZone: 'UTC',
          weekday: 'short'
        });
      }

      const dateLabel = middayItem.cityDate.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric'
      });

      // 4. Calculate range bar percentages for Apple-style visual gradient temp bar
      const barLeft = Math.max(0, Math.min(85, Math.round(((minTemp - globalMin) / tempSpan) * 100)));
      const barWidth = Math.max(12, Math.min(100 - barLeft, Math.round(((maxTemp - minTemp) / tempSpan) * 100)));

      // 5. Construct the daily forecast row
      const row = document.createElement('div');
      row.className = 'daily-forecast-row glass-card';
      row.innerHTML = `
        <div class="daily-col-day">
          <span class="daily-day-name">${dayName}</span>
          <span class="daily-date-label">${dateLabel}</span>
        </div>
        <div class="daily-col-cond">
          <img class="daily-icon" src="${iconSrc}" alt="${weather.description || 'Daily icon'}" loading="lazy" />
          <span class="daily-cond-desc">${weather.main}</span>
        </div>
        <div class="daily-col-temps">
          <span class="daily-temp-min">${minTemp}${unitSymbol}</span>
          <div class="daily-temp-bar-track">
            <div class="daily-temp-bar-fill" style="margin-left: ${barLeft}%; width: ${barWidth}%;"></div>
          </div>
          <span class="daily-temp-max">${maxTemp}${unitSymbol}</span>
        </div>
      `;

      this.elements.fiveDayList.appendChild(row);
    });
  },

  /**
   * Render recent search history chips
   *
   * @param {Array<string>} cities - List of city names
   * @param {Function} onSelectCity - Callback when clicking a chip
   * @param {Function} onRemoveCity - Callback when clicking the 'x' button
   */
  renderRecentSearches(cities = [], onSelectCity, onRemoveCity) {
    if (!this.elements.recentChipsList) return;

    if (!cities || cities.length === 0) {
      this.elements.recentSearchesContainer.classList.add('hidden');
      return;
    }

    this.elements.recentSearchesContainer.classList.remove('hidden');
    this.elements.recentChipsList.innerHTML = '';

    cities.forEach(city => {
      const chip = document.createElement('div');
      chip.className = 'chip-pill';

      const cityText = document.createElement('span');
      cityText.className = 'chip-text';
      cityText.textContent = city;
      cityText.addEventListener('click', () => onSelectCity(city));

      const removeBtn = document.createElement('button');
      removeBtn.className = 'chip-remove-btn';
      removeBtn.setAttribute('type', 'button');
      removeBtn.setAttribute('aria-label', `Remove ${city} from recent searches`);
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onRemoveCity(city);
      });

      chip.appendChild(cityText);
      chip.appendChild(removeBtn);
      this.elements.recentChipsList.appendChild(chip);
    });
  },

  /**
   * Show loading state
   * @param {string} message - Status text to display
   */
  showLoading(message = 'Fetching weather information...') {
    if (this.elements.loadingOverlay) {
      this.elements.loadingMessage.textContent = message;
      this.elements.loadingOverlay.classList.remove('hidden');
    }
    if (this.elements.searchBtn) {
      this.elements.searchBtn.classList.add('loading');
      this.elements.searchBtn.disabled = true;
    }
  },

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.classList.add('hidden');
    }
    if (this.elements.searchBtn) {
      this.elements.searchBtn.classList.remove('loading');
      this.elements.searchBtn.disabled = false;
    }
  },

  /**
   * Display a floating error alert toast
   * @param {string} message - Error description
   */
  showError(message) {
    if (!this.elements.alertToast || !this.elements.alertMessage) return;

    this.elements.alertMessage.textContent = message;
    this.elements.alertToast.classList.remove('hidden');

    // Auto-dismiss alert after 6.5 seconds
    if (this._alertTimeout) clearTimeout(this._alertTimeout);
    this._alertTimeout = setTimeout(() => {
      this.clearError();
    }, 6500);
  },

  /**
   * Dismiss the error toast
   */
  clearError() {
    if (this.elements.alertToast) {
      this.elements.alertToast.classList.add('hidden');
    }
    if (this._alertTimeout) {
      clearTimeout(this._alertTimeout);
      this._alertTimeout = null;
    }
  },

  /**
   * Display or hide the missing API Key warning banner
   * @param {boolean} show
   */
  toggleApiKeyBanner(show) {
    if (this.elements.apiKeyBanner) {
      if (show) {
        this.elements.apiKeyBanner.classList.remove('hidden');
      } else {
        this.elements.apiKeyBanner.classList.add('hidden');
      }
    }
    if (this.elements.apiKeyStatusBadge) {
      if (show) {
        this.elements.apiKeyStatusBadge.className = 'status-badge status-warning';
        this.elements.apiKeyStatusBadge.title = 'API Key required';
      } else {
        this.elements.apiKeyStatusBadge.className = 'status-badge status-ok';
        this.elements.apiKeyStatusBadge.title = 'API Key connected';
      }
    }
  },

  /**
   * Update Temperature Unit toggle button UI
   * @param {string} unit - 'metric' or 'imperial'
   */
  updateUnitToggleUI(unit) {
    if (!this.elements.unitToggleBtn) return;
    const isCelsius = unit === 'metric';

    const cSpan = this.elements.unitToggleBtn.querySelector('.unit-c');
    const fSpan = this.elements.unitToggleBtn.querySelector('.unit-f');

    if (cSpan && fSpan) {
      cSpan.classList.toggle('active', isCelsius);
      fSpan.classList.toggle('active', !isCelsius);
    }
    this.elements.unitToggleBtn.setAttribute('aria-label', `Switch to ${isCelsius ? 'Fahrenheit' : 'Celsius'}`);
  },

  /**
   * Update Theme toggle UI (Dark / Light)
   * @param {string} theme - 'dark' or 'light'
   */
  updateThemeUI(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (!this.elements.themeToggleBtn) return;

    const sunIcon = this.elements.themeToggleBtn.querySelector('.icon-sun');
    const moonIcon = this.elements.themeToggleBtn.querySelector('.icon-moon');

    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
        this.elements.themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
      } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
        this.elements.themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
      }
    }
  },

  /**
   * Show API Key Modal dialog
   */
  showApiKeyModal() {
    if (!this.elements.apiKeyModal) return;
    const currentKey = window.WeatherAPI?.getApiKey() || '';
    if (this.elements.apiKeyInput) {
      this.elements.apiKeyInput.value = currentKey;
    }
    if (this.elements.apiKeyTestFeedback) {
      this.elements.apiKeyTestFeedback.textContent = '';
      this.elements.apiKeyTestFeedback.className = 'modal-feedback';
    }
    this.elements.apiKeyModal.classList.remove('hidden');
  },

  /**
   * Hide API Key Modal dialog
   */
  hideApiKeyModal() {
    if (this.elements.apiKeyModal) {
      this.elements.apiKeyModal.classList.add('hidden');
    }
  }
};

// Expose on window object
if (typeof window !== 'undefined') {
  window.WeatherUI = WeatherUI;
}

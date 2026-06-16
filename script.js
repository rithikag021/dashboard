// ============================================
// Weather Dashboard - Asynchronous API Handler
// ============================================

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const searchSuggestions = document.getElementById('searchSuggestions');
const currentWeatherDiv = document.getElementById('currentWeather');
const hourlyForecastDiv = document.getElementById('hourlyForecast');
const weeklyForecastDiv = document.getElementById('weeklyForecast');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const noData = document.getElementById('noData');

// API Configuration
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT = 10000; // 10 seconds

// State Management
let currentCoordinates = null;
let abortController = null;

// ============================================
// ERROR HANDLING & UTILITIES
// ============================================

/**
 * Custom error class for API errors
 */
class APIError extends Error {
    constructor(message, statusCode = null, originalError = null) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.originalError = originalError;
    }
}

/**
 * Display error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    
    // Auto-hide error after 6 seconds
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 6000);
}

/**
 * Show loading indicator
 */
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    currentWeatherDiv.classList.add('hidden');
    hourlyForecastDiv.classList.add('hidden');
    weeklyForecastDiv.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

/**
 * Fetch with timeout functionality
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise} - Fetch response
 */
async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
            throw new APIError(
                `HTTP Error: ${response.status} - ${response.statusText}`,
                response.status
            );
        }

        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new APIError('Request timeout - Server took too long to respond');
        }
        throw error;
    }
}

// ============================================
// GEOCODING - SEARCH FUNCTIONALITY
// ============================================

/**
 * Search for cities by name with debouncing
 * @param {string} query - City name query
 */
let searchTimeout;
cityInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
        searchSuggestions.innerHTML = '';
        return;
    }

    // Debounce API calls - wait 300ms after user stops typing
    searchTimeout = setTimeout(() => {
        searchCities(query);
    }, 300);
});

/**
 * Fetch city suggestions from Geocoding API
 * @param {string} query - Search query
 */
async function searchCities(query) {
    try {
        const url = `${GEOCODING_API}?name=${encodeURIComponent(query)}&count=5&language=en`;
        
        const response = await fetchWithTimeout(url);
        const data = await response.json();

        // Parse nested JSON response
        if (!data.results || data.results.length === 0) {
            searchSuggestions.innerHTML = '<div class="suggestion-item">No cities found</div>';
            return;
        }

        // Display suggestions
        searchSuggestions.innerHTML = data.results
            .map(result => `
                <div class="suggestion-item" onclick="selectCity({
                    name: '${result.name}',
                    country: '${result.country || ''}',
                    latitude: ${result.latitude},
                    longitude: ${result.longitude},
                    admin1: '${result.admin1 || ''}'
                })">
                    <strong>${result.name}</strong> ${result.admin1 ? ', ' + result.admin1 : ''}<br>
                    <small>${result.country}</small>
                </div>
            `)
            .join('');
    } catch (error) {
        console.error('Error searching cities:', error);
        searchSuggestions.innerHTML = '';
    }
}

/**
 * Select a city from suggestions
 * @param {object} city - City object with coordinates
 */
function selectCity(city) {
    cityInput.value = `${city.name}, ${city.country}`;
    searchSuggestions.innerHTML = '';
    currentCoordinates = {
        latitude: city.latitude,
        longitude: city.longitude,
        name: city.name,
        country: city.country
    };
    fetchWeatherData();
}

// ============================================
// WEATHER DATA FETCHING
// ============================================

/**
 * Main function to fetch weather data
 * Uses async/await pattern for clean asynchronous code
 */
async function fetchWeatherData() {
    // Validate input
    if (!currentCoordinates) {
        if (!cityInput.value.trim()) {
            showError('Please enter a city name');
            return;
        }
        // If user pressed search without selecting from suggestions, search first
        await searchAndFetch();
        return;
    }

    showLoading();

    try {
        // Build URL with query parameters
        const url = new URL(WEATHER_API);
        url.searchParams.append('latitude', currentCoordinates.latitude);
        url.searchParams.append('longitude', currentCoordinates.longitude);
        
        // Request comprehensive weather data
        url.searchParams.append('current', [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'weather_code',
            'wind_speed_10m',
            'cloud_cover',
            'pressure_msl',
            'visibility',
            'uv_index'
        ].join(','));
        
        // Hourly forecast for next 24 hours
        url.searchParams.append('hourly', [
            'temperature_2m',
            'weather_code',
            'precipitation',
            'wind_speed_10m'
        ].join(','));
        
        // Daily forecast for 7 days
        url.searchParams.append('daily', [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_sum',
            'precipitation_probability_max'
        ].join(','));
        
        url.searchParams.append('timezone', 'auto');
        url.searchParams.append('temperature_unit', 'celsius');
        url.searchParams.append('wind_speed_unit', 'kmh');
        url.searchParams.append('precipitation_unit', 'mm');

        // Fetch weather data with error handling
        const response = await fetchWithTimeout(url.toString());
        const weatherData = await response.json();

        // Validate response data
        if (!weatherData.current) {
            throw new APIError('Invalid weather data received - missing current weather data');
        }

        // Process and display data
        hideLoading();
        noData.classList.add('hidden');
        renderCurrentWeather(weatherData);
        renderHourlyForecast(weatherData);
        renderWeeklyForecast(weatherData);

    } catch (error) {
        handleFetchError(error);
    }
}

/**
 * Search for city and fetch weather in one operation
 */
async function searchAndFetch() {
    const query = cityInput.value.trim();
    
    if (!query) {
        showError('Please enter a city name');
        return;
    }

    showLoading();

    try {
        const url = `${GEOCODING_API}?name=${encodeURIComponent(query)}&count=1&language=en`;
        const response = await fetchWithTimeout(url);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new APIError(`No results found for "${query}". Please try another city name.`);
        }

        // Select first result
        const result = data.results[0];
        selectCity({
            name: result.name,
            country: result.country || '',
            latitude: result.latitude,
            longitude: result.longitude,
            admin1: result.admin1 || ''
        });

    } catch (error) {
        handleFetchError(error);
    }
}

/**
 * Comprehensive error handling for fetch operations
 * @param {Error} error - Error object
 */
function handleFetchError(error) {
    hideLoading();
    
    let userMessage = 'An error occurred. Please try again.';

    if (error instanceof APIError) {
        userMessage = error.message;
    } else if (error instanceof TypeError) {
        // Network error
        userMessage = 'Network error: Please check your internet connection and try again.';
    } else if (error instanceof SyntaxError) {
        // JSON parsing error
        userMessage = 'Error parsing data from server. Please try again later.';
    } else {
        userMessage = error.message || 'An unexpected error occurred.';
    }

    console.error('Error:', error);
    showError(userMessage);
}

// ============================================
// DATA RENDERING - PARSE & DISPLAY JSON
// ============================================

/**
 * Convert weather code to human-readable description
 * @param {number} code - WMO Weather code
 * @returns {string} - Weather description
 */
function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Foggy with rime',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Thunderstorm with hail'
    };
    return weatherCodes[code] || 'Unknown';
}

/**
 * Get weather emoji based on weather code
 * @param {number} code - WMO Weather code
 * @returns {string} - Emoji
 */
function getWeatherEmoji(code) {
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 86) return '🌨️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 95) return '⛈️';
    return '🌤️';
}

/**
 * Render current weather section
 * @param {object} weatherData - Parsed weather JSON
 */
function renderCurrentWeather(weatherData) {
    const current = weatherData.current;
    const timezone = weatherData.timezone;

    // Parse nested current weather object
    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const humidity = current.relative_humidity_2m;
    const windSpeed = Math.round(current.wind_speed_10m);
    const description = getWeatherDescription(current.weather_code);
    const emoji = getWeatherEmoji(current.weather_code);
    const cloudCover = current.cloud_cover;
    const pressure = Math.round(current.pressure_msl);
    const visibility = (current.visibility / 1000).toFixed(1);
    const uvIndex = Math.round(current.uv_index);

    // Get high/low from daily data
    const todayMax = Math.round(weatherData.daily.temperature_2m_max[0]);
    const todayMin = Math.round(weatherData.daily.temperature_2m_min[0]);

    // Format current time
    const now = new Date();
    const timeString = now.toLocaleString('en-US', { 
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Update DOM elements
    document.getElementById('cityName').textContent = 
        `${currentCoordinates.name}, ${currentCoordinates.country}`;
    document.getElementById('updateTime').textContent = `Last updated: ${timeString}`;
    document.getElementById('weatherDescription').textContent = `${emoji} ${description}`;
    document.getElementById('temperature').textContent = temp;
    document.getElementById('feelsLike').textContent = `${feelsLike}°C`;
    document.getElementById('tempRange').textContent = `${todayMax}° / ${todayMin}°`;
    document.getElementById('humidity').textContent = `${humidity}%`;
    document.getElementById('windSpeed').textContent = `${windSpeed} km/h`;
    document.getElementById('pressure').textContent = `${pressure} hPa`;
    document.getElementById('visibility').textContent = `${visibility} km`;
    document.getElementById('cloudCover').textContent = `${cloudCover}%`;
    document.getElementById('uvIndex').textContent = getUVIndexLevel(uvIndex);

    currentWeatherDiv.classList.remove('hidden');
}

/**
 * Get UV index level description
 * @param {number} index - UV index value
 * @returns {string} - UV level description
 */
function getUVIndexLevel(index) {
    if (index < 3) return `${Math.round(index)} (Low)`;
    if (index < 6) return `${Math.round(index)} (Moderate)`;
    if (index < 8) return `${Math.round(index)} (High)`;
    if (index < 11) return `${Math.round(index)} (Very High)`;
    return `${Math.round(index)} (Extreme)`;
}

/**
 * Render hourly forecast
 * @param {object} weatherData - Parsed weather JSON
 */
function renderHourlyForecast(weatherData) {
    const hourly = weatherData.hourly;
    const times = hourly.time;
    const temperatures = hourly.temperature_2m;
    const weatherCodes = hourly.weather_code;

    // Get next 24 hours
    const hourlyContainer = document.getElementById('hourlyContainer');
    hourlyContainer.innerHTML = '';

    for (let i = 0; i < Math.min(24, times.length); i++) {
        const time = new Date(times[i]);
        const timeString = time.toLocaleString('en-US', { 
            hour: '2-digit',
            minute: '2-digit'
        });
        const temp = Math.round(temperatures[i]);
        const code = weatherCodes[i];
        const description = getWeatherDescription(code);

        const hourlyCard = document.createElement('div');
        hourlyCard.className = 'hourly-card';
        hourlyCard.innerHTML = `
            <div class="hourly-time">${timeString}</div>
            <div class="hourly-temp">${temp}°</div>
            <div class="hourly-condition">${description}</div>
        `;

        hourlyContainer.appendChild(hourlyCard);
    }

    hourlyForecastDiv.classList.remove('hidden');
}

/**
 * Render 7-day weekly forecast
 * @param {object} weatherData - Parsed weather JSON
 */
function renderWeeklyForecast(weatherData) {
    const daily = weatherData.daily;
    const dates = daily.time;
    const maxTemps = daily.temperature_2m_max;
    const minTemps = daily.temperature_2m_min;
    const weatherCodes = daily.weather_code;
    const precipitation = daily.precipitation_sum;
    const precipitationProb = daily.precipitation_probability_max;

    // Display 7-day forecast
    const weeklyContainer = document.getElementById('weeklyContainer');
    weeklyContainer.innerHTML = '';

    for (let i = 0; i < Math.min(7, dates.length); i++) {
        const date = new Date(dates[i]);
        const dateString = date.toLocaleString('en-US', { 
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        const maxTemp = Math.round(maxTemps[i]);
        const minTemp = Math.round(minTemps[i]);
        const code = weatherCodes[i];
        const description = getWeatherDescription(code);
        const rain = precipitation[i];
        const rainProb = precipitationProb[i];

        const weeklyCard = document.createElement('div');
        weeklyCard.className = 'weekly-card';
        weeklyCard.innerHTML = `
            <div class="weekly-date">${dateString}</div>
            <div class="weekly-condition">${getWeatherEmoji(code)} ${description}</div>
            <div class="weekly-temps">
                <span class="weekly-high">${maxTemp}°</span>
                <span class="weekly-low">${minTemp}°</span>
            </div>
            <div class="weekly-rain">💧 ${rainProb}% (${rain}mm)</div>
        `;

        weeklyContainer.appendChild(weeklyCard);
    }

    weeklyForecastDiv.classList.remove('hidden');
}

// ============================================
// EVENT LISTENERS
// ============================================

// Search button click
searchBtn.addEventListener('click', searchAndFetch);

// Enter key in search input
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchAndFetch();
    }
});

// ============================================
// INITIALIZATION
// ============================================

// Auto-load weather for default city on page load
window.addEventListener('load', async () => {
    // Optional: Load weather for a default city
    // Uncomment to auto-load weather for London on startup
    /*
    selectCity({
        name: 'London',
        country: 'United Kingdom',
        latitude: 51.51,
        longitude: -0.13
    });
    */
});

// Handle page visibility to update data when user returns to tab
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentCoordinates) {
        // Optional: Refresh data when user returns to tab
        // Uncomment to enable auto-refresh
        // fetchWeatherData();
    }
});

console.log('Weather Dashboard initialized successfully');

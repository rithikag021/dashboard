# 🌍 Real-Time Weather Dashboard

A modern, fully-featured weather dashboard that fetches and displays real-time weather data using asynchronous JavaScript and REST APIs.

## 📋 Features

### ✅ Implemented Features
- **Asynchronous Data Fetching**: Uses modern Fetch API with `async/await` for clean, readable code
- **Search Functionality**: Real-time city search with autocomplete suggestions
- **Comprehensive Error Handling**: Network errors, timeouts, invalid data, and user-friendly error messages
- **Complex JSON Parsing**: Parses and renders deeply nested JSON objects from weather API
- **Real-Time Weather Data**: Live temperature, humidity, wind speed, pressure, visibility, and UV index
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Hourly Forecast**: 24-hour weather predictions
- **7-Day Forecast**: Weekly weather trends with precipitation data
- **Beautiful UI**: Modern gradient design with smooth animations and transitions
- **Timeout Handling**: Automatic request timeout after 10 seconds
- **Debounced Search**: Prevents excessive API calls while typing

## 🚀 Quick Start

1. **Open the Dashboard**
   - Open `index.html` in a web browser (no server required)
   - Or use any local server: `python -m http.server` / `npx http-server`

2. **Search for a City**
   - Type a city name in the search box
   - Select from the autocomplete suggestions
   - Click "Search" or press Enter

3. **View Weather Data**
   - Current weather with detailed metrics
   - 24-hour hourly forecast
   - 7-day weekly forecast

## 🔧 Technical Implementation

### Asynchronous JavaScript Patterns

#### Fetch API with Async/Await
```javascript
async function fetchWeatherData() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        // Process data
    } catch (error) {
        // Handle errors
    }
}
```

#### Custom Fetch with Timeout
```javascript
async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
        const response = await fetch(url, { 
            ...options, 
            signal: controller.signal 
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}
```

### Error Handling Strategy

1. **Network Errors**: Catches `TypeError` and displays connection message
2. **HTTP Errors**: Checks response status and throws custom `APIError`
3. **Timeouts**: Aborts requests exceeding 10 seconds
4. **JSON Parsing Errors**: Catches `SyntaxError` from invalid JSON
5. **Custom Errors**: Uses custom `APIError` class for API-specific issues
6. **User Feedback**: Shows friendly error messages with auto-dismiss

### JSON Data Structure

The dashboard parses complex nested JSON:

```javascript
{
  "current": {
    "temperature_2m": 22.5,
    "relative_humidity_2m": 65,
    "weather_code": 2,
    "wind_speed_10m": 12.3,
    "pressure_msl": 1013,
    // ... more fields
  },
  "hourly": {
    "time": ["2024-01-01T00:00", ...],
    "temperature_2m": [22.5, 21.0, ...],
    "weather_code": [2, 2, ...]
  },
  "daily": {
    "time": ["2024-01-01", ...],
    "temperature_2m_max": [28, 26, ...],
    "temperature_2m_min": [15, 14, ...]
  }
}
```

### Search Implementation

#### Real-Time Suggestions
- Debounced input (300ms delay) to reduce API calls
- Uses Open-Meteo Geocoding API
- Displays city name, region, and country
- Click to select or type and press Enter

#### Data Flow
1. User types city name
2. Debounce timer waits 300ms
3. Fetch city suggestions from Geocoding API
4. Display autocomplete results
5. User selects or confirms search
6. Fetch weather for selected coordinates

## 📡 APIs Used

### Open-Meteo Weather API
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **No Authentication Required**: Free tier available
- **Rate Limit**: 10,000 requests/day
- **Response**: Comprehensive weather data including current, hourly, and daily forecasts

### Open-Meteo Geocoding API
- **Endpoint**: `https://geocoding-api.open-meteo.com/v1/search`
- **Purpose**: Search for city coordinates by name
- **No Authentication Required**

## 📊 Displayed Weather Metrics

- **Temperature**: Current, feels-like, high/low
- **Humidity**: Percentage
- **Wind Speed**: km/h
- **Pressure**: hPa
- **Visibility**: km
- **Cloud Cover**: Percentage
- **UV Index**: With risk level (Low, Moderate, High, Very High, Extreme)
- **Precipitation**: Probability and amount

## 🎨 Design Features

- **Gradient Background**: Modern purple gradient
- **Card-Based Layout**: Organized weather information
- **Animations**: Smooth fade-in and slide effects
- **Responsive Grid**: Auto-adjusting grid for different screen sizes
- **Dark/Light Contrasts**: Readable text with proper color hierarchy
- **Emoji Weather Icons**: Visual weather indicators
- **Hover Effects**: Interactive feedback on clickable elements

## 🔒 Security Features

- **No Sensitive Data**: No API keys needed (public APIs)
- **Input Validation**: Sanitizes user input
- **Error Boundaries**: Prevents app crashes from API errors
- **Timeout Protection**: Prevents hanging requests
- **CORS Compatible**: Uses public CORS-enabled APIs

## 🌐 Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (uses ES6+ features)

## 📱 Responsive Breakpoints

- **Desktop**: Full layout with all features
- **Tablet (768px)**: Adjusted grid and font sizes
- **Mobile (480px)**: Single column layout, simplified cards

## 🔧 Customization Options

### Change Default City
Uncomment in `script.js`:
```javascript
selectCity({
    name: 'London',
    country: 'United Kingdom',
    latitude: 51.51,
    longitude: -0.13
});
```

### Adjust Timeout
Modify `REQUEST_TIMEOUT` in `script.js`:
```javascript
const REQUEST_TIMEOUT = 10000; // Change to desired milliseconds
```

### Enable Auto-Refresh
Uncomment in `script.js` visibility handler:
```javascript
if (!document.hidden && currentCoordinates) {
    fetchWeatherData();
}
```

## 📝 Code Structure

- **HTML (`index.html`)**: Semantic markup with proper accessibility
- **CSS (`styles.css`)**: Modern flexbox/grid layout, mobile-first responsive design
- **JavaScript (`script.js`)**: 
  - Error handling utilities
  - Geocoding/search functionality
  - Weather data fetching
  - JSON parsing and rendering
  - Event listeners and initialization

## 🎓 Learning Outcomes

This project demonstrates:
- ✅ Async/await patterns in modern JavaScript
- ✅ Fetch API for HTTP requests
- ✅ Comprehensive error handling strategies
- ✅ Working with REST APIs and JSON data
- ✅ DOM manipulation and dynamic rendering
- ✅ Event delegation and debouncing
- ✅ Responsive web design
- ✅ State management in vanilla JavaScript

## 📄 License

Free to use and modify for educational purposes.

## 🤝 Contributing

Feel free to extend this project with additional features such as:
- Air quality data
- Weather alerts
- Historical weather data
- Map integration
- Local storage for favorites
- Dark mode toggle
- Multiple temperature unit options

---

**Enjoy exploring weather worldwide! 🌤️⛅🌧️**

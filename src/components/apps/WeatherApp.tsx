import React, { useState } from 'react';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Wind, 
  Droplets, 
  Eye, 
  Compass, 
  Sunrise, 
  Sunset, 
  Thermometer, 
  Search, 
  MapPin, 
  RefreshCw,
  Umbrella,
  Clock
} from 'lucide-react';

interface HourlyForecast {
  time: string;
  temp: number;
  icon: 'sun' | 'cloud' | 'rain' | 'lightning';
  pop: number; // probability of precipitation
}

interface DailyForecast {
  day: string;
  condition: string;
  minTemp: number;
  maxTemp: number;
  icon: 'sun' | 'cloud' | 'rain' | 'lightning';
}

export const WeatherApp: React.FC = () => {
  const [city, setCity] = useState('Brisbane, Australia');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');

  // Meteorological state data
  const currentWeather = {
    temp: 26,
    condition: 'Partly Cloudy',
    high: 29,
    low: 19,
    feelsLike: 27,
    aqi: 28,
    aqiStatus: 'Good',
    uvIndex: 7,
    uvStatus: 'High',
    humidity: 58,
    windSpeed: '16 km/h',
    windDir: 'ENE',
    pressure: '1016 hPa',
    visibility: '10 km',
    dewPoint: '17°C',
    sunrise: '05:04 AM',
    sunset: '06:18 PM',
  };

  const hourly: HourlyForecast[] = [
    { time: 'Now', temp: 26, icon: 'cloud', pop: 10 },
    { time: '1 PM', temp: 28, icon: 'sun', pop: 5 },
    { time: '2 PM', temp: 29, icon: 'sun', pop: 5 },
    { time: '3 PM', temp: 28, icon: 'cloud', pop: 20 },
    { time: '4 PM', temp: 27, icon: 'cloud', pop: 35 },
    { time: '5 PM', temp: 25, icon: 'rain', pop: 60 },
    { time: '6 PM', temp: 23, icon: 'rain', pop: 75 },
    { time: '7 PM', temp: 22, icon: 'lightning', pop: 80 },
    { time: '8 PM', temp: 21, icon: 'cloud', pop: 40 },
    { time: '9 PM', temp: 20, icon: 'cloud', pop: 15 },
  ];

  const daily: DailyForecast[] = [
    { day: 'Today', condition: 'Partly Cloudy', minTemp: 19, maxTemp: 29, icon: 'cloud' },
    { day: 'Thu', condition: 'Scattered Showers', minTemp: 18, maxTemp: 25, icon: 'rain' },
    { day: 'Fri', condition: 'Sunny & Clear', minTemp: 17, maxTemp: 28, icon: 'sun' },
    { day: 'Sat', condition: 'Clear Sky', minTemp: 18, maxTemp: 30, icon: 'sun' },
    { day: 'Sun', condition: 'Thunderstorms', minTemp: 20, maxTemp: 26, icon: 'lightning' },
    { day: 'Mon', condition: 'Light Rain', minTemp: 18, maxTemp: 24, icon: 'rain' },
    { day: 'Tue', condition: 'Mostly Sunny', minTemp: 17, maxTemp: 27, icon: 'sun' },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const renderIcon = (type: string, size = 20, className = 'text-amber-400') => {
    switch (type) {
      case 'sun':
        return <Sun size={size} className="text-amber-400" />;
      case 'rain':
        return <CloudRain size={size} className="text-blue-400" />;
      case 'lightning':
        return <CloudLightning size={size} className="text-purple-400" />;
      default:
        return <Cloud size={size} className="text-neutral-300" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-sky-900 via-neutral-900 to-black text-white font-sans overflow-y-auto select-none">
      {/* Top Bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-sky-400" />
          <span className="font-semibold text-sm tracking-wide">{city}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTemperatureUnit(temperatureUnit === 'C' ? 'F' : 'C')}
            className="px-2.5 py-1 text-xs rounded-lg font-bold bg-white/10 hover:bg-white/20 transition-colors"
          >
            °{temperatureUnit}
          </button>
          <button
            onClick={handleRefresh}
            className={`p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Hero Current Weather */}
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-sky-500/20 flex items-center justify-center mb-3 shadow-2xl backdrop-blur">
          <Sun size={48} className="text-amber-400 animate-spin-slow" />
        </div>
        <div className="text-6xl font-light tracking-tight font-mono">
          {currentWeather.temp}°{temperatureUnit}
        </div>
        <div className="text-lg font-medium text-sky-200 mt-1">{currentWeather.condition}</div>
        <div className="flex items-center gap-4 text-xs text-neutral-300 mt-2">
          <span>H: {currentWeather.high}°</span>
          <span>•</span>
          <span>L: {currentWeather.low}°</span>
          <span>•</span>
          <span>Feels like {currentWeather.feelsLike}°</span>
        </div>
      </div>

      <div className="px-6 space-y-5 pb-8 max-w-4xl mx-auto w-full">
        {/* Hourly Forecast Carousel */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur shadow-lg">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-300 mb-3 flex items-center gap-1.5">
            <Clock size={14} /> 24-Hour Forecast
          </div>
          <div className="flex items-center gap-5 overflow-x-auto pb-2 scrollbar-none">
            {hourly.map((h, i) => (
              <div key={i} className="flex flex-col items-center min-w-[54px] py-1">
                <span className="text-[11px] text-neutral-400">{h.time}</span>
                <div className="my-2">{renderIcon(h.icon, 22)}</div>
                <span className="text-sm font-semibold">{h.temp}°</span>
                {h.pop > 0 && (
                  <span className="text-[10px] text-sky-400 font-mono mt-0.5 flex items-center gap-0.5">
                    <Droplets size={9} /> {h.pop}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Forecast */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur shadow-lg">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-300 mb-3 flex items-center gap-1.5">
            <Umbrella size={14} /> 7-Day Extended Outlook
          </div>
          <div className="divide-y divide-white/5">
            {daily.map((d, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
                <span className="w-16 font-medium text-neutral-200">{d.day}</span>
                <div className="flex items-center gap-2 flex-1 justify-center">
                  {renderIcon(d.icon, 18)}
                  <span className="text-neutral-400 text-[11px]">{d.condition}</span>
                </div>
                <div className="flex items-center gap-3 w-28 justify-end font-mono">
                  <span className="text-neutral-400">{d.minTemp}°</span>
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full"
                      style={{ width: `${((d.maxTemp - d.minTemp) / 15) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold text-white">{d.maxTemp}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2x2 Grid of Detailed Meteorological Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* AQI */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Air Quality</span>
              <Wind size={15} className="text-emerald-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono">{currentWeather.aqi}</span>
              <span className="ml-2 text-xs text-emerald-400 font-semibold">{currentWeather.aqiStatus}</span>
            </div>
            <p className="text-[10px] text-neutral-400">Low particulate risk</p>
          </div>

          {/* UV Index */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>UV Index</span>
              <Sun size={15} className="text-amber-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono">{currentWeather.uvIndex}</span>
              <span className="ml-2 text-xs text-amber-400 font-semibold">{currentWeather.uvStatus}</span>
            </div>
            <p className="text-[10px] text-neutral-400">Sun protection advised</p>
          </div>

          {/* Humidity */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Humidity</span>
              <Droplets size={15} className="text-sky-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono">{currentWeather.humidity}%</span>
            </div>
            <p className="text-[10px] text-neutral-400">Dew point is {currentWeather.dewPoint}</p>
          </div>

          {/* Wind */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Wind</span>
              <Compass size={15} className="text-cyan-400" />
            </div>
            <div className="my-2">
              <span className="text-lg font-bold">{currentWeather.windSpeed}</span>
              <span className="ml-1 text-xs text-cyan-400">{currentWeather.windDir}</span>
            </div>
            <p className="text-[10px] text-neutral-400">Gentle coastal breeze</p>
          </div>
        </div>

        {/* Sunrise / Sunset Card */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-300">
              <Sunrise size={20} />
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Sunrise</span>
              <span className="text-sm font-bold font-mono">{currentWeather.sunrise}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-300">
              <Sunset size={20} />
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Sunset</span>
              <span className="text-sm font-bold font-mono">{currentWeather.sunset}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WeatherApp;

import React, { useState, useEffect, useCallback } from 'react';
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
  Clock,
  ShieldCheck
} from 'lucide-react';

interface HourlyForecast {
  time: string;
  temp: number;
  icon: 'sun' | 'cloud' | 'rain' | 'lightning';
  pop: number;
}

interface DailyForecast {
  day: string;
  condition: string;
  minTemp: number;
  maxTemp: number;
  icon: 'sun' | 'cloud' | 'rain' | 'lightning';
}

interface WeatherPayload {
  ok: boolean;
  offline: boolean;
  city: string;
  current: {
    temp: number;
    condition: string;
    icon: 'sun' | 'cloud' | 'rain' | 'lightning';
    high: number;
    low: number;
    feelsLike: number;
    humidity: number;
    windSpeed: string;
    windDir: string;
    pressure: string;
    uvIndex: number;
    sunrise: string;
    sunset: string;
  };
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

export const WeatherApp: React.FC = () => {
  const [city, setCity] = useState('Brisbane, Australia');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [data, setData] = useState<WeatherPayload | null>(null);

  const fetchWeather = useCallback(async (targetCity: string) => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(targetCity)}`);
      if (res.ok) {
        const json: WeatherPayload = await res.json();
        if (json.ok) {
          setData(json);
          setCity(json.city);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchWeather(city);
  }, [fetchWeather]);

  const handleRefresh = () => {
    void fetchWeather(city);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      void fetchWeather(searchQuery.trim());
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const toUnit = (c: number) => {
    if (temperatureUnit === 'F') return Math.round((c * 9) / 5 + 32);
    return Math.round(c);
  };

  // Fallback defaults
  const currentWeather = data?.current || {
    temp: 24,
    condition: 'Partly Cloudy',
    icon: 'cloud' as const,
    high: 28,
    low: 18,
    feelsLike: 25,
    humidity: 58,
    windSpeed: '16 km/h',
    windDir: 'ENE',
    pressure: '1016 hPa',
    uvIndex: 7,
    sunrise: '05:04 AM',
    sunset: '06:18 PM',
  };

  const hourly: HourlyForecast[] = data?.hourly?.length ? data.hourly : [
    { time: 'Now', temp: 24, icon: 'cloud', pop: 10 },
    { time: '1 PM', temp: 26, icon: 'sun', pop: 5 },
    { time: '2 PM', temp: 27, icon: 'sun', pop: 5 },
    { time: '3 PM', temp: 26, icon: 'cloud', pop: 20 },
    { time: '4 PM', temp: 25, icon: 'cloud', pop: 35 },
  ];

  const daily: DailyForecast[] = data?.daily?.length ? data.daily : [
    { day: 'Today', condition: 'Partly Cloudy', minTemp: 18, maxTemp: 28, icon: 'cloud' },
    { day: 'Tomorrow', condition: 'Clear Sky', minTemp: 17, maxTemp: 27, icon: 'sun' },
    { day: 'Wed', condition: 'Showers', minTemp: 19, maxTemp: 25, icon: 'rain' },
  ];

  const renderIcon = (type: string, size = 20) => {
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
    <div className="flex flex-col h-full bg-gradient-to-b from-sky-950 via-neutral-900 to-black text-white font-sans overflow-y-auto select-none">
      {/* Top Bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-2 flex-1">
          {isSearching ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city (e.g. London, Tokyo)..."
                autoFocus
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-xs text-white placeholder:text-neutral-400 outline-none w-full"
              />
              <button type="submit" className="px-2 py-1 bg-sky-600 rounded text-xs font-semibold">Go</button>
              <button type="button" onClick={() => setIsSearching(false)} className="px-2 py-1 text-xs text-neutral-400">Cancel</button>
            </form>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsSearching(true)}>
              <MapPin size={18} className="text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm tracking-wide group-hover:text-sky-200 transition-colors">{city}</span>
              <Search size={14} className="text-neutral-400 opacity-60 group-hover:opacity-100" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 font-mono">
            <ShieldCheck size={12} /> Zero-Tracking Open-Meteo
          </div>
          <button
            onClick={() => setTemperatureUnit(temperatureUnit === 'C' ? 'F' : 'C')}
            className="px-2.5 py-1 text-xs rounded-lg font-bold bg-white/10 hover:bg-white/20 transition-colors font-mono"
          >
            °{temperatureUnit}
          </button>
          <button
            onClick={handleRefresh}
            className={`p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh weather"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Hero Current Weather */}
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-sky-500/20 flex items-center justify-center mb-3 shadow-2xl backdrop-blur">
          {renderIcon(currentWeather.icon, 48)}
        </div>
        <div className="text-6xl font-light tracking-tight font-mono">
          {toUnit(currentWeather.temp)}°{temperatureUnit}
        </div>
        <div className="text-lg font-medium text-sky-200 mt-1">{currentWeather.condition}</div>
        <div className="flex items-center gap-4 text-xs text-neutral-300 mt-2 font-mono">
          <span>H: {toUnit(currentWeather.high)}°</span>
          <span>•</span>
          <span>L: {toUnit(currentWeather.low)}°</span>
          <span>•</span>
          <span>Feels like {toUnit(currentWeather.feelsLike)}°</span>
        </div>
      </div>

      <div className="px-6 space-y-5 pb-8 max-w-4xl mx-auto w-full">
        {/* Hourly Forecast Carousel */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur shadow-lg">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-300 mb-3 flex items-center gap-1.5">
            <Clock size={14} /> Hourly Forecast
          </div>
          <div className="flex items-center gap-5 overflow-x-auto pb-2 scrollbar-none">
            {hourly.map((h, i) => (
              <div key={i} className="flex flex-col items-center min-w-[54px] py-1">
                <span className="text-[11px] text-neutral-400">{h.time}</span>
                <div className="my-2">{renderIcon(h.icon, 22)}</div>
                <span className="text-sm font-semibold font-mono">{toUnit(h.temp)}°</span>
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
                  <span className="text-neutral-400">{toUnit(d.minTemp)}°</span>
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(15, ((d.maxTemp - d.minTemp) / 15) * 100))}%` }}
                    />
                  </div>
                  <span className="font-semibold text-white">{toUnit(d.maxTemp)}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2x2 Grid of Detailed Meteorological Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* UV Index */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>UV Index</span>
              <Sun size={15} className="text-amber-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold font-mono">{currentWeather.uvIndex}</span>
              <span className="ml-2 text-xs text-amber-400 font-semibold">
                {currentWeather.uvIndex > 7 ? 'Very High' : currentWeather.uvIndex > 5 ? 'High' : currentWeather.uvIndex > 2 ? 'Moderate' : 'Low'}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">Zero-tracking live index</p>
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
            <p className="text-[10px] text-neutral-400">Atmospheric moisture</p>
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
            <p className="text-[10px] text-neutral-400">Ground velocity & bearing</p>
          </div>

          {/* Pressure */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Pressure</span>
              <Thermometer size={15} className="text-violet-400" />
            </div>
            <div className="my-2">
              <span className="text-lg font-bold font-mono">{currentWeather.pressure}</span>
            </div>
            <p className="text-[10px] text-neutral-400">Barometric surface level</p>
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

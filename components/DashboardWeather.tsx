import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, CloudRain, MapPin, Loader2, Sun, Moon, CloudSun } from 'lucide-react';

interface DashboardWeatherProps {
  theme?: 'dark' | 'light';
}

// Coordenadas padrão: Marília-SP
const DEFAULT_COORDS = {
  lat: -22.2142,
  lon: -49.9458
};

interface WeatherData {
  temp: number;
  rainChance: number;
  humidity: number;
}

const DashboardWeather: React.FC<DashboardWeatherProps> = ({ theme = 'dark' }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>('');

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day&hourly=precipitation_probability&forecast_days=1&timezone=auto`
      );

      if (!res.ok) throw new Error('Falha ao obter dados do clima');

      const data = await res.json();
      const currentHour = new Date().getHours();
      const rainChance = data.hourly.precipitation_probability[currentHour] || 0;

      return {
        temp: Math.round(data.current.temperature_2m),
        humidity: Math.round(data.current.relative_humidity_2m),
        rainChance: rainChance,
        isDay: data.current.is_day === 1
      };
    } catch (err) {
      console.warn('Erro Open-Meteo:', err);
      return null;
    }
  };

  const fetchCityName = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`
      );
      if (!res.ok) throw new Error('Falha ao obter localidade');
      const data = await res.json();
      const city = data.city || data.locality || '';
      const state = data.principalSubdivisionCode ? data.principalSubdivisionCode.split('-')[1] : data.principalSubdivision;
      if (city && state) return `${city}, ${state}`;
      return city || state || 'Sua localização';
    } catch (err) {
      return 'Marília, SP';
    }
  };

  const loadData = async () => {
    setLoading(true);

    let coords = DEFAULT_COORDS;

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        coords = { lat: position.coords.latitude, lon: position.coords.longitude };
      } catch (e) {
        // Use default coords
      }
    }

    const [weather, city] = await Promise.all([
      fetchWeatherData(coords.lat, coords.lon),
      fetchCityName(coords.lat, coords.lon)
    ]);

    if (weather) setWeatherData(weather);
    setLocationName(city);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine weather icon based on conditions
  const getWeatherIcon = () => {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;

    if (weatherData && weatherData.rainChance > 50) {
      return CloudRain;
    }
    if (isNight) {
      return Moon;
    }
    if (weatherData && weatherData.rainChance > 20) {
      return CloudSun;
    }
    return Sun;
  };

  const WeatherIcon = getWeatherIcon();

  // Temperature color based on value
  const getTempColor = (temp: number) => {
    if (temp <= 15) return { text: 'text-cyan-400', bg: 'from-cyan-500/20 to-blue-500/20' };
    if (temp <= 22) return { text: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-500/20' };
    if (temp <= 28) return { text: 'text-amber-400', bg: 'from-amber-500/20 to-orange-500/20' };
    return { text: 'text-rose-400', bg: 'from-rose-500/20 to-red-500/20' };
  };

  const tempColors = weatherData ? getTempColor(weatherData.temp) : { text: 'text-amber-400', bg: 'from-amber-500/20 to-orange-500/20' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`mt-6 rounded-2xl border overflow-hidden ${theme === 'dark'
        ? 'bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-800/40 border-white/10'
        : 'bg-white border-slate-200 shadow-lg'
        }`}
    >
      {/* Header with gradient */}
      <div className={`relative px-5 py-4 border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
        {/* Background gradient accent */}
        <div className={`absolute inset-0 bg-gradient-to-r ${tempColors.bg} opacity-30`} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated Weather Icon */}
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`p-2.5 rounded-xl bg-gradient-to-br ${tempColors.bg}`}
            >
              <WeatherIcon size={24} className={tempColors.text} />
            </motion.div>

            <div>
              <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                Clima Atual
              </h3>
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-cyan-500" />
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {loading ? 'Localizando...' : locationName}
                </span>
              </div>
            </div>
          </div>

          {/* Main Temperature Display */}
          <div className="text-right">
            {loading ? (
              <Loader2 size={24} className="text-cyan-400 animate-spin" />
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-baseline gap-1"
              >
                <span className={`text-3xl font-bold ${tempColors.text}`}>
                  {weatherData?.temp ?? '--'}
                </span>
                <span className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  °C
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 divide-x divide-white/5">
        {/* Rain Chance */}
        <motion.div
          whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)' }}
          className="px-5 py-4 transition-colors cursor-default"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="p-2 rounded-lg bg-blue-500/20"
            >
              <CloudRain size={18} className="text-blue-400" />
            </motion.div>
            <div>
              <p className={`text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Chuva
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
              >
                {weatherData?.rainChance ?? 0}
                <span className="text-sm font-medium opacity-60">%</span>
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Humidity */}
        <motion.div
          whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(129, 140, 248, 0.05)' : 'rgba(129, 140, 248, 0.03)' }}
          className="px-5 py-4 transition-colors cursor-default"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="p-2 rounded-lg bg-indigo-500/20"
            >
              <Droplets size={18} className="text-indigo-400" />
            </motion.div>
            <div>
              <p className={`text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Umidade
              </p>
              {loading ? (
                <div className="w-12 h-5 bg-slate-700/50 rounded animate-pulse mt-1" />
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                >
                  {weatherData?.humidity ?? '--'}
                  <span className="text-sm font-medium opacity-60">%</span>
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      </div>


    </motion.div>
  );
};

export default DashboardWeather;

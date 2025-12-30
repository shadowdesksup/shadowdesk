import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  MapPin,
  Loader2,
  Thermometer,
  Wind,
  Droplets,
  RefreshCw,
  Umbrella,
  Bell,
  Radar,
  Satellite,
  Waves,
  Zap,
  CloudRain,
  Flag
} from 'lucide-react';

interface ClimaPageProps {
  theme?: 'dark' | 'light';
  userId?: string;
}

// Coordenadas padrão: Marília-SP
const DEFAULT_COORDS = {
  lat: -22.2142,
  lon: -49.9458
};

// Map Layer Configuration
const MAP_LAYERS = [
  { id: 'radar', name: 'Radar', icon: Radar },
  { id: 'satellite', name: 'Satélite', icon: Satellite },
  { id: 'wind', name: 'Vento', icon: Wind },
  { id: 'rain', name: 'Chuva, raios', icon: CloudRain },
  { id: 'temp', name: 'Temperatura', icon: Thermometer },
  { id: 'clouds', name: 'Nuvens', icon: Cloud },
  { id: 'waves', name: 'Ondas', icon: Waves },
  { id: 'rainAccu', name: 'Acúmulo chuva', icon: Droplets },
  { id: 'gust', name: 'Rajadas', icon: Flag },
];

const ClimaPage: React.FC<ClimaPageProps> = ({ theme = 'dark', userId }) => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Obtendo localização...');
  const [weatherData, setWeatherData] = useState<{ temp: number, wind: number, rainChance: number, humidity: number, description: string } | null>(null);

  // Map Layer State
  const [mapLayer, setMapLayer] = useState<string>('rain');

  // Estados para Refresh
  const [loading, setLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Carregar dados meteorológicos (Open-Meteo)
  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m&hourly=precipitation_probability&forecast_days=1&timezone=auto`
      );

      if (!res.ok) throw new Error('Falha ao obter dados do clima');

      const data = await res.json();

      const currentHour = new Date().getHours();
      const rainChance = data.hourly.precipitation_probability[currentHour] || 0;

      return {
        temp: Math.round(data.current.temperature_2m),
        wind: Math.round(data.current.wind_speed_10m),
        humidity: Math.round(data.current.relative_humidity_2m),
        rainChance: rainChance,
        description: rainChance > 50 ? 'Possibilidade de chuva' : 'Tempo estável'
      };
    } catch (err) {
      console.warn('Erro Open-Meteo:', err);
      return {
        temp: 28,
        wind: 12,
        humidity: 60,
        rainChance: 0,
        description: 'Dados indisponíveis'
      };
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setLocationName('Sua localização');
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          setCoords(DEFAULT_COORDS);
          setLocationName('Marília, SP (padrão)');
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      setCoords(DEFAULT_COORDS);
      setLocationName('Marília, SP (padrão)');
    }
  }, []);

  useEffect(() => {
    if (coords) {
      fetchWeatherData(coords.lat, coords.lon).then(data => {
        if (data) setWeatherData(data);
      });
    }
  }, [coords]);

  const loadAllData = async () => {
    if (!coords) return;
    setLoading(true);

    const data = await fetchWeatherData(coords.lat, coords.lon);
    if (data) setWeatherData(data);

    setIframeKey(prev => prev + 1);

    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const getWindyEmbedUrl = () => {
    if (!coords) return '';

    const params = new URLSearchParams({
      lat: coords.lat.toString(),
      lon: coords.lon.toString(),
      detailLat: coords.lat.toString(),
      detailLon: coords.lon.toString(),
      width: '650',
      height: '450',
      zoom: '11',
      level: 'surface',
      overlay: mapLayer, // Use dynamic map layer
      product: 'ecmwf',
      menu: '',
      message: 'true',
      marker: 'true',
      calendar: 'now',
      pressure: 'false',
      type: 'map',
      location: 'coordinates',
      detail: '',
      metricWind: 'km/h',
      metricTemp: '°C',
      radarRange: '-1'
    });

    return `https://embed.windy.com/embed2.html?${params.toString()}`;
  };

  return (
    <>
      <div className="flex flex-col h-full gap-2 pr-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-1"
        >
          <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden p-2 scrollbar-hide max-w-[85vw] md:max-w-none">
            {/* Botão Refresh */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                loadAllData();
              }}
              disabled={loading}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border ${theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                : 'bg-white hover:bg-slate-50 text-slate-600 shadow-sm border-slate-200'
                } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="hidden xl:inline text-sm whitespace-nowrap">{loading ? 'Atualizando...' : 'Atualizar'}</span>
            </motion.button>

            {/* Vertical Separator */}
            <div className={`h-6 w-px mx-1 flex-shrink-0 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />

            {/* Map Layer Buttons */}
            {MAP_LAYERS.map((layer) => {
              const Icon = layer.icon;
              const isActive = mapLayer === layer.id;
              return (
                <motion.button
                  key={layer.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMapLayer(layer.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border ${isActive
                    ? (theme === 'dark'
                      ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                      : 'bg-cyan-50 border-cyan-200 text-cyan-600')
                    : (theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                      : 'bg-white hover:bg-slate-50 text-slate-600 shadow-sm border-slate-200')
                    }`}
                >
                  <Icon size={16} />
                  <span className="text-sm whitespace-nowrap">{layer.name}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="mr-6">
            <h1 className={`text-3xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <Cloud className="text-cyan-400" size={32} />
              Clima
            </h1>
            <p className={`mt-0 flex items-center gap-1 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              <MapPin size={16} className="text-cyan-500" />
              {locationName}
            </p>
          </div>
        </motion.div>

        {/* Mapa Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`flex-1 rounded-2xl border overflow-hidden relative ${theme === 'dark'
            ? 'bg-slate-900/50 border-white/10'
            : 'bg-white border-slate-200 shadow-lg'
            }`}
        >
          {!coords ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-inherit">
              <Loader2 size={48} className="text-cyan-500 animate-spin" />
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Obtendo localização...
              </p>
            </div>
          ) : (
            <iframe
              key={iframeKey}
              src={getWindyEmbedUrl()}
              width="100%"
              height="100%"
              title="Mapa Windy"
              className="w-full h-full rounded-2xl border-none"
            ></iframe>
          )}
        </motion.div>

        {/* Cards de Clima */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Card Temperatura */}
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme === 'dark'
            ? 'bg-slate-900/50 border-white/10'
            : 'bg-white border-slate-200 shadow-sm'
            }`}>
            <div className="p-3 rounded-full bg-orange-500/20 text-orange-500">
              <Thermometer size={24} />
            </div>
            <div>
              <p className="text-xs uppercase font-bold opacity-60">Temperatura</p>
              <p className="text-2xl font-bold">{weatherData?.temp ?? '--'}°C</p>
            </div>
          </div>

          {/* Card Vento */}
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme === 'dark'
            ? 'bg-slate-900/50 border-white/10'
            : 'bg-white border-slate-200 shadow-sm'
            }`}>
            <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-500">
              <Wind size={24} />
            </div>
            <div>
              <p className="text-xs uppercase font-bold opacity-60">Vento</p>
              <p className="text-2xl font-bold">{weatherData?.wind ?? '--'} km/h</p>
            </div>
          </div>

          {/* Card Chuva */}
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme === 'dark'
            ? 'bg-slate-900/50 border-white/10'
            : 'bg-white border-slate-200 shadow-sm'
            }`}>
            <div className="p-3 rounded-full bg-blue-500/20 text-blue-500">
              <Umbrella size={24} />
            </div>
            <div>
              <p className="text-xs uppercase font-bold opacity-60">Chance Chuva</p>
              <p className="text-2xl font-bold">{weatherData?.rainChance ?? 0}%</p>
            </div>
          </div>

          {/* Card Umidade */}
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme === 'dark'
            ? 'bg-slate-900/50 border-white/10'
            : 'bg-white border-slate-200 shadow-sm'
            }`}>
            <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-500">
              <Droplets size={24} />
            </div>
            <div>
              <p className="text-xs uppercase font-bold opacity-60">Umidade</p>
              <p className="text-2xl font-bold">{weatherData?.humidity ?? '--'}%</p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ClimaPage;

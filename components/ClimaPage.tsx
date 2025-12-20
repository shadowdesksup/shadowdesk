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
  Umbrella // Icone para chuva
} from 'lucide-react';

interface ClimaPageProps {
  theme?: 'dark' | 'light';
}

// Coordenadas padrão: Marília-SP
const DEFAULT_COORDS = {
  lat: -22.2142,
  lon: -49.9458
};

const ClimaPage: React.FC<ClimaPageProps> = ({ theme = 'dark' }) => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Obtendo localização...');
  // Adicionado humidity no estado
  const [weatherData, setWeatherData] = useState<{ temp: number, wind: number, rainChance: number, humidity: number, description: string } | null>(null);

  // Estados para Refresh
  const [loading, setLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Obter geolocalização do usuário
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

  // Carregar dados meteorológicos (Open-Meteo)
  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      // Busca temperatura, vento e UMIDADE
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

  // Carrega dados iniciais quando coords estiver pronto
  useEffect(() => {
    if (coords) {
      fetchWeatherData(coords.lat, coords.lon).then(data => {
        if (data) setWeatherData(data);
      });
    }
  }, [coords]);

  // Função de Soft Refresh
  const loadAllData = async () => {
    if (!coords) return;
    setLoading(true);

    // Atualiza dados numéricos
    const data = await fetchWeatherData(coords.lat, coords.lon);
    if (data) setWeatherData(data);

    // Força reload do iframe
    setIframeKey(prev => prev + 1);

    // Pequeno delay visual
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
      zoom: '5',
      level: 'surface',
      overlay: 'rain',
      product: 'ecmwf',
      menu: '',
      message: 'true',
      marker: 'true',
      calendar: 'now',
      pressure: 'false', // Desativado por padrão conforme solicitado
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
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className={`text-3xl font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            <Cloud className="text-cyan-400" size={32} />
            Clima
          </h1>
          <p className={`mt-2 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            <MapPin size={16} className="text-cyan-500" />
            {locationName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botão Refresh */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              loadAllData();
            }}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${theme === 'dark'
              ? 'bg-white/5 hover:bg-white/10 text-slate-300'
              : 'bg-white hover:bg-slate-50 text-slate-600 shadow-sm border border-slate-200'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{loading ? 'Atualizando...' : 'Atualizar'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Mapa Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`flex-1 rounded-2xl border overflow-hidden relative ${theme === 'dark'
          ? 'bg-slate-900/50 border-white/10'
          : 'bg-white border-slate-200 shadow-lg'
          }`}
        style={{ minHeight: '500px' }}
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
            style={{ minHeight: '500px' }}
          ></iframe>
        )}
      </motion.div>

      {/* Info Cards - Agora com 4 Colunas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Temperatura */}
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme === 'dark'
          ? 'bg-slate-900/50 border-white/10'
          : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className="p-3 rounded-full bg-orange-500/20">
            <Thermometer size={24} className="text-orange-500" />
          </div>
          <div>
            <p className={`text-xs uppercase font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Temperatura
            </p>
            <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {weatherData ? `${weatherData.temp}°C` : '--°C'}
            </p>
          </div>
        </div>

        {/* Vento */}
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme === 'dark'
          ? 'bg-slate-900/50 border-white/10'
          : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className="p-3 rounded-full bg-cyan-500/20">
            <Wind size={24} className="text-cyan-500" />
          </div>
          <div>
            <p className={`text-xs uppercase font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Vento
            </p>
            <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {weatherData ? `${weatherData.wind} km/h` : '-- km/h'}
            </p>
          </div>
        </div>

        {/* Chuva */}
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme === 'dark'
          ? 'bg-slate-900/50 border-white/10'
          : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className="p-3 rounded-full bg-blue-500/20">
            {/* Ícone atualizado para guarda-chuva para diferenciar */}
            <Umbrella size={24} className="text-blue-500" />
          </div>
          <div>
            <p className={`text-xs uppercase font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Chance Chuva
            </p>
            <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {weatherData ? `${weatherData.rainChance}%` : '--%'}
            </p>
          </div>
        </div>

        {/* Umidade */}
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme === 'dark'
          ? 'bg-slate-900/50 border-white/10'
          : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className="p-3 rounded-full bg-indigo-500/20">
            <Droplets size={24} className="text-indigo-500" />
          </div>
          <div>
            <p className={`text-xs uppercase font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Umidade
            </p>
            <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {weatherData ? `${weatherData.humidity}%` : '--%'}
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default ClimaPage;

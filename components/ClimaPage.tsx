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
  Umbrella, // Icone para chuva
  Bell
} from 'lucide-react';
import WeatherNotificationModal, { WeatherAlertPreferences } from './WeatherNotificationModal';
import { saveWeatherAlertPreferences, getWeatherAlertPreferences } from '../firebase/weatherAlerts';

interface ClimaPageProps {
  theme?: 'dark' | 'light';
  userId?: string;
}

// Coordenadas padrão: Marília-SP
const DEFAULT_COORDS = {
  lat: -22.2142,
  lon: -49.9458
};

const ClimaPage: React.FC<ClimaPageProps> = ({ theme = 'dark', userId }) => {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Obtendo localização...');
  // Adicionado humidity no estado
  const [weatherData, setWeatherData] = useState<{ temp: number, wind: number, rainChance: number, humidity: number, description: string } | null>(null);

  // Estados para Refresh
  const [loading, setLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Estado para o modal de notificações
  const [showNotificationModal, setShowNotificationModal] = useState(false);

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
    <>
      <div className="flex flex-col h-full gap-2">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 -mt-6"
        >
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

            {/* Botão Notifique-me */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotificationModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${theme === 'dark'
                ? 'bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366]'
                : 'bg-green-50 hover:bg-green-100 text-green-600 shadow-sm border border-green-200'
                }`}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="hidden sm:inline">Notifique-me</span>
            </motion.button>
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

      {/* Weather Notification Modal */}
      {
        showNotificationModal && (
          <WeatherNotificationModal
            theme={theme}
            onClose={() => setShowNotificationModal(false)}
            onSave={async (preferences) => {
              // Save to Firestore if user is logged in
              if (userId) {
                await saveWeatherAlertPreferences(userId, preferences);
              }
              // Also save to localStorage as fallback
              localStorage.setItem('weather_alert_preferences', JSON.stringify(preferences));
              console.log('Weather alert preferences saved:', preferences);
            }}
            initialPreferences={(() => {
              try {
                const saved = localStorage.getItem('weather_alert_preferences');
                return saved ? JSON.parse(saved) : null;
              } catch {
                return null;
              }
            })()}
          />
        )
      }
    </>
  );
};

export default ClimaPage;

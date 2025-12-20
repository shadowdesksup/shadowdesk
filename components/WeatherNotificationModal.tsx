import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  Thermometer,
  Wind,
  Droplets,
  Umbrella,
  Check,
  Save
} from 'lucide-react';

interface WeatherNotificationModalProps {
  theme?: 'dark' | 'light';
  onClose: () => void;
  onSave: (preferences: WeatherAlertPreferences) => Promise<void>;
  initialPreferences?: WeatherAlertPreferences | null;
}

export interface ThresholdConfig {
  enabled: boolean;
  thresholds: number[];
  custom?: number;
}

export interface WeatherAlertPreferences {
  telefone: string;
  temperatura?: ThresholdConfig;
  ventos?: ThresholdConfig;
  chuva?: ThresholdConfig;
  umidade?: ThresholdConfig;
}

const TEMP_OPTIONS = [39, 40];
const WIND_OPTIONS = [70, 80, 90];
const RAIN_OPTIONS = [70, 80, 90, 100];
const HUMIDITY_OPTIONS = [45, 40, 30];

const WeatherNotificationModal: React.FC<WeatherNotificationModalProps> = ({
  theme = 'dark',
  onClose,
  onSave,
  initialPreferences
}) => {
  // Phone number state - synced with LembreteModal localStorage (same logic)
  const [telefone, setTelefone] = useState(() => {
    if (initialPreferences?.telefone) return initialPreferences.telefone;
    const manter = localStorage.getItem('whatsapp_manter_numero') !== 'false';
    const saved = localStorage.getItem('last_whatsapp_number') || '';
    return manter ? saved : '';
  });

  const [manterNumeroSalvo, setManterNumeroSalvo] = useState(() => {
    return localStorage.getItem('whatsapp_manter_numero') !== 'false';
  });

  // Toggle states for each category
  const [tempEnabled, setTempEnabled] = useState(initialPreferences?.temperatura?.enabled || false);
  const [tempThresholds, setTempThresholds] = useState<number[]>(initialPreferences?.temperatura?.thresholds || []);
  const [tempCustomEnabled, setTempCustomEnabled] = useState(!!initialPreferences?.temperatura?.custom);
  const [tempCustom, setTempCustom] = useState<string>(initialPreferences?.temperatura?.custom?.toString() || '');

  const [windEnabled, setWindEnabled] = useState(initialPreferences?.ventos?.enabled || false);
  const [windThresholds, setWindThresholds] = useState<number[]>(initialPreferences?.ventos?.thresholds || []);
  const [windCustomEnabled, setWindCustomEnabled] = useState(!!initialPreferences?.ventos?.custom);
  const [windCustom, setWindCustom] = useState<string>(initialPreferences?.ventos?.custom?.toString() || '');

  const [rainEnabled, setRainEnabled] = useState(initialPreferences?.chuva?.enabled || false);
  const [rainThresholds, setRainThresholds] = useState<number[]>(initialPreferences?.chuva?.thresholds || []);
  const [rainCustomEnabled, setRainCustomEnabled] = useState(!!initialPreferences?.chuva?.custom);
  const [rainCustom, setRainCustom] = useState<string>(initialPreferences?.chuva?.custom?.toString() || '');

  const [humidityEnabled, setHumidityEnabled] = useState(initialPreferences?.umidade?.enabled || false);
  const [humidityThresholds, setHumidityThresholds] = useState<number[]>(initialPreferences?.umidade?.thresholds || []);
  const [humidityCustomEnabled, setHumidityCustomEnabled] = useState(!!initialPreferences?.umidade?.custom);
  const [humidityCustom, setHumidityCustom] = useState<string>(initialPreferences?.umidade?.custom?.toString() || '');

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Auto-save phone number when typing (same logic as LembreteModal)
  useEffect(() => {
    if (manterNumeroSalvo) {
      if (telefone) {
        localStorage.setItem('last_whatsapp_number', telefone);
      } else {
        localStorage.removeItem('last_whatsapp_number');
      }
    }
  }, [telefone, manterNumeroSalvo]);

  const toggleThreshold = (current: number[], value: number): number[] => {
    if (current.includes(value)) {
      return current.filter(t => t !== value);
    }
    return [...current, value];
  };

  const handleSave = async () => {
    if (!telefone.trim()) {
      setErro('Por favor, insira seu número de WhatsApp');
      return;
    }

    const hasAnyEnabled = tempEnabled || windEnabled || rainEnabled || humidityEnabled;
    if (!hasAnyEnabled) {
      setErro('Ative pelo menos uma notificação');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const preferences: WeatherAlertPreferences = {
        telefone: telefone.trim(),
        ...(tempEnabled && {
          temperatura: {
            enabled: true,
            thresholds: tempThresholds,
            ...(tempCustomEnabled && tempCustom && { custom: parseInt(tempCustom) })
          }
        }),
        ...(windEnabled && {
          ventos: {
            enabled: true,
            thresholds: windThresholds,
            ...(windCustomEnabled && windCustom && { custom: parseInt(windCustom) })
          }
        }),
        ...(rainEnabled && {
          chuva: {
            enabled: true,
            thresholds: rainThresholds,
            ...(rainCustomEnabled && rainCustom && { custom: parseInt(rainCustom) })
          }
        }),
        ...(humidityEnabled && {
          umidade: {
            enabled: true,
            thresholds: humidityThresholds,
            ...(humidityCustomEnabled && humidityCustom && { custom: parseInt(humidityCustom) })
          }
        })
      };

      await onSave(preferences);
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar preferências');
    } finally {
      setSalvando(false);
    }
  };

  // Reusable toggle switch component
  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <div
      className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${enabled
        ? 'bg-cyan-500'
        : (theme === 'dark' ? 'bg-white/10' : 'bg-slate-200')
        }`}
      onClick={onToggle}
    >
      <motion.div
        className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ x: enabled ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </div>
  );

  // Reusable checkbox component
  const ThresholdCheckbox = ({
    label,
    checked,
    onToggle,
    disabled
  }: {
    label: string;
    checked: boolean;
    onToggle: () => void;
    disabled?: boolean;
  }) => (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${disabled ? 'opacity-40 cursor-not-allowed' : ''
        } ${checked
          ? (theme === 'dark' ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-cyan-50 border-cyan-300')
          : (theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50')
        }`}
      onClick={() => !disabled && onToggle()}
    >
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${checked
          ? 'bg-cyan-500 border-cyan-500'
          : (theme === 'dark' ? 'border-slate-500 bg-transparent' : 'border-slate-300 bg-white')
          }`}
      >
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-lg rounded-2xl border overflow-hidden flex flex-col max-h-[90vh] ${theme === 'dark'
            ? 'bg-slate-900 border-white/10'
            : 'bg-white border-slate-200 shadow-2xl'
            }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-5 border-b shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
            <h2 className={`text-xl font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <div className="p-2 rounded-xl bg-cyan-500/20">
                <Bell className="text-cyan-400" size={22} />
              </div>
              Alertas Meteorológicos
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={`p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
            >
              <X size={20} className={theme === 'dark' ? 'text-white' : 'text-slate-600'} />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {/* WhatsApp Phone Input */}
            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#25D366]/10 border-[#25D366]/30' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Seu WhatsApp
                </span>
              </div>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))}
                placeholder="14999077324"
                className={`w-full px-4 py-3 rounded-xl border text-base font-medium ${theme === 'dark'
                  ? 'bg-white/10 border-white/10 text-white placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                  } focus:outline-none focus:ring-2 focus:ring-[#25D366]`}
              />
              <div className="mt-4 flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${manterNumeroSalvo
                    ? 'bg-[#25D366] border-[#25D366]'
                    : (theme === 'dark' ? 'border-slate-500 bg-white/5' : 'border-slate-300 bg-white')
                    }`}
                  onClick={() => {
                    const newValue = !manterNumeroSalvo;
                    setManterNumeroSalvo(newValue);
                    localStorage.setItem('whatsapp_manter_numero', String(newValue));
                    if (!newValue) {
                      localStorage.removeItem('last_whatsapp_number');
                      setTelefone('');
                    }
                  }}
                >
                  {manterNumeroSalvo && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
                <label className={`text-sm font-medium cursor-pointer ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Lembrar este número
                </label>
              </div>
            </div>

            {/* Temperature Alerts */}
            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/20">
                    <Thermometer size={20} className="text-orange-500" />
                  </div>
                  <span className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    Temperatura
                  </span>
                </div>
                <ToggleSwitch enabled={tempEnabled} onToggle={() => setTempEnabled(!tempEnabled)} />
              </div>
              <AnimatePresence>
                {tempEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2"
                  >
                    {TEMP_OPTIONS.map(t => (
                      <ThresholdCheckbox
                        key={t}
                        label={`${t}°C`}
                        checked={tempThresholds.includes(t)}
                        onToggle={() => setTempThresholds(toggleThreshold(tempThresholds, t))}
                      />
                    ))}
                    <ThresholdCheckbox
                      label="Outro"
                      checked={tempCustomEnabled}
                      onToggle={() => setTempCustomEnabled(!tempCustomEnabled)}
                    />
                    {tempCustomEnabled && (
                      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                        <input
                          type="number"
                          value={tempCustom}
                          onChange={(e) => setTempCustom(e.target.value)}
                          placeholder="Ex: 42"
                          className={`w-20 bg-transparent text-sm font-semibold outline-none ${theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
                        />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>°C</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wind Alerts */}
            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20">
                    <Wind size={20} className="text-cyan-500" />
                  </div>
                  <span className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    Ventos
                  </span>
                </div>
                <ToggleSwitch enabled={windEnabled} onToggle={() => setWindEnabled(!windEnabled)} />
              </div>
              <AnimatePresence>
                {windEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2"
                  >
                    {WIND_OPTIONS.map(w => (
                      <ThresholdCheckbox
                        key={w}
                        label={`${w}km/h`}
                        checked={windThresholds.includes(w)}
                        onToggle={() => setWindThresholds(toggleThreshold(windThresholds, w))}
                      />
                    ))}
                    <ThresholdCheckbox
                      label="Outro"
                      checked={windCustomEnabled}
                      onToggle={() => setWindCustomEnabled(!windCustomEnabled)}
                    />
                    {windCustomEnabled && (
                      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                        <input
                          type="number"
                          value={windCustom}
                          onChange={(e) => setWindCustom(e.target.value)}
                          placeholder="Ex: 100"
                          className={`w-20 bg-transparent text-sm font-semibold outline-none ${theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
                        />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>km/h</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rain Alerts */}
            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/20">
                    <Umbrella size={20} className="text-blue-500" />
                  </div>
                  <span className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    Chuva
                  </span>
                </div>
                <ToggleSwitch enabled={rainEnabled} onToggle={() => setRainEnabled(!rainEnabled)} />
              </div>
              <AnimatePresence>
                {rainEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2"
                  >
                    {RAIN_OPTIONS.map(r => (
                      <ThresholdCheckbox
                        key={r}
                        label={`${r}%`}
                        checked={rainThresholds.includes(r)}
                        onToggle={() => setRainThresholds(toggleThreshold(rainThresholds, r))}
                      />
                    ))}
                    <ThresholdCheckbox
                      label="Outro"
                      checked={rainCustomEnabled}
                      onToggle={() => setRainCustomEnabled(!rainCustomEnabled)}
                    />
                    {rainCustomEnabled && (
                      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                        <input
                          type="number"
                          value={rainCustom}
                          onChange={(e) => setRainCustom(e.target.value)}
                          placeholder="Ex: 65"
                          className={`w-20 bg-transparent text-sm font-semibold outline-none ${theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
                        />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>%</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Humidity Alerts */}
            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20">
                    <Droplets size={20} className="text-indigo-500" />
                  </div>
                  <span className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    Umidade
                  </span>
                </div>
                <ToggleSwitch enabled={humidityEnabled} onToggle={() => setHumidityEnabled(!humidityEnabled)} />
              </div>
              <AnimatePresence>
                {humidityEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2"
                  >
                    {HUMIDITY_OPTIONS.map(h => (
                      <ThresholdCheckbox
                        key={h}
                        label={`${h}%`}
                        checked={humidityThresholds.includes(h)}
                        onToggle={() => setHumidityThresholds(toggleThreshold(humidityThresholds, h))}
                      />
                    ))}
                    <ThresholdCheckbox
                      label="Outro"
                      checked={humidityCustomEnabled}
                      onToggle={() => setHumidityCustomEnabled(!humidityCustomEnabled)}
                    />
                    {humidityCustomEnabled && (
                      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                        <input
                          type="number"
                          value={humidityCustom}
                          onChange={(e) => setHumidityCustom(e.target.value)}
                          placeholder="Ex: 25"
                          className={`w-20 bg-transparent text-sm font-semibold outline-none ${theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
                        />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>%</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            {erro && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                {erro}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex gap-3 p-5 border-t shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={`py-3 px-5 rounded-xl font-semibold text-sm ${theme === 'dark'
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                } transition-colors`}
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={salvando}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {salvando ? 'Salvando...' : 'Salvar Alertas'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WeatherNotificationModal;

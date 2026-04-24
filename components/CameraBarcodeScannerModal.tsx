import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, X, RefreshCw, AlertCircle, Flashlight } from 'lucide-react';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  theme?: 'dark' | 'light';
}

// Verifica suporte nativo ao BarcodeDetector
const isBarcodeDetectorSupported = (): boolean => {
  return 'BarcodeDetector' in window;
};

const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const lastScanRef = useRef<string>('');

  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [torchOn, setTorchOn] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setError('');
    setScannedCode(null);
    lastScanRef.current = '';
    stopCamera();

    if (!isBarcodeDetectorSupported()) {
      setSupported(false);
      setError('Seu navegador não suporta leitura de código de barras pela câmera. Use o Chrome no Android.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Criar detector suportando formatos de barcode do sistema
      // @ts-ignore
      detectorRef.current = new BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'data_matrix', 'pdf417', 'aztec'],
      });

      setScanning(true);
    } catch (err: any) {
      console.error('Erro ao acessar a câmera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Permissão negada. Permita o acesso à câmera nas configurações do navegador.');
      } else if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada neste dispositivo.');
      } else {
        setError('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    }
  }, [stopCamera]);

  // Loop de detecção — roda em requestAnimationFrame para não travar a UI
  const detectLoop = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current || !streamRef.current) return;
    if (videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        // Evitar disparar o mesmo código múltiplas vezes seguidas
        if (code && code !== lastScanRef.current) {
          lastScanRef.current = code;
          setScannedCode(code);
          cancelAnimationFrame(rafRef.current);
          // Feedback de 800ms antes de fechar
          setTimeout(() => {
            stopCamera();
            onScan(code);
            onClose();
          }, 800);
          return;
        }
      }
    } catch (_) {
      // BarcodeDetector pode lançar erro se o frame ainda não está pronto, ignora
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  }, [onScan, onClose, stopCamera]);

  // Inicia o loop quando scanning = true
  useEffect(() => {
    if (scanning) {
      rafRef.current = requestAnimationFrame(detectLoop);
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [scanning, detectLoop]);

  // Abre/fecha câmera conforme o modal
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
      setScannedCode(null);
      setError('');
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Troca câmera
  const toggleCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  // Tenta ativar lanterna (apenas câmera traseira que suporta)
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      await (track as any).applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(prev => !prev);
    } catch {
      // Lanterna não suportada neste dispositivo, ignora silenciosamente
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
              isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <ScanLine className="text-cyan-500" size={20} />
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Escanear Código do Equipamento
                </span>
              </div>
              <button
                onClick={handleClose}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Viewfinder */}
            <div className="relative w-full bg-black overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <AlertCircle size={48} className="text-rose-500 opacity-80" />
                  <p className="text-sm text-rose-400 font-medium">{error}</p>
                  {supported && (
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl text-sm font-bold hover:bg-rose-500/30 transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay guia de escaneamento */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Escurecimento ao redor */}
                    <div className="absolute inset-0 bg-black/40" />
                    {/* Janela transparente */}
                    <div
                      className="relative rounded-xl overflow-hidden"
                      style={{ width: '75%', height: '35%' }}
                    >
                      {/* Fundo transparente "cortando" o escuro */}
                      <div className="absolute inset-0 bg-transparent mix-blend-destination-out" />

                      {/* Bordas animadas dos cantos */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Canto TL */}
                        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-cyan-400 rounded-tl-md" />
                        {/* Canto TR */}
                        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-400 rounded-tr-md" />
                        {/* Canto BL */}
                        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-cyan-400 rounded-bl-md" />
                        {/* Canto BR */}
                        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyan-400 rounded-br-md" />
                      </div>

                      {/* Linha de scan deslizando */}
                      <motion.div
                        animate={{ top: ['10%', '85%', '10%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-[2px] bg-cyan-400/80 shadow-[0_0_8px_2px_rgba(34,211,238,0.5)]"
                        style={{ position: 'absolute' }}
                      />
                    </div>
                  </div>

                  {/* Sucesso ao detectar */}
                  <AnimatePresence>
                    {scannedCode && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70"
                      >
                        <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                          <motion.div
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                          >
                            <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth={3}>
                              <motion.path
                                d="M5 13l4 4L19 7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.4 }}
                              />
                            </svg>
                          </motion.div>
                        </div>
                        <p className="text-green-400 font-bold text-sm">Código detectado!</p>
                        <p className="text-white font-mono text-xs bg-white/10 px-3 py-1 rounded-lg">{scannedCode}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between gap-3 px-5 py-4 border-t ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
              {/* Lanterna */}
              <button
                onClick={toggleTorch}
                disabled={!!error || facingMode === 'user'}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                  torchOn
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Lanterna"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2h8l2 8H6L8 2z"/>
                  <path d="M6 10l-2 12h16L18 10"/>
                  <line x1="12" y1="10" x2="12" y2="16"/>
                </svg>
                <span className="hidden sm:inline">{torchOn ? 'Desligar' : 'Lanterna'}</span>
              </button>

              {/* Instrução */}
              <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Aponte para o código de barras
              </p>

              {/* Trocar câmera */}
              <button
                onClick={toggleCamera}
                disabled={!!error}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Virar Câmera"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Virar</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(CameraBarcodeScannerModal);

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RefreshCw, Check, AlertCircle, RotateCcw } from 'lucide-react';

interface WebcamCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  theme?: 'dark' | 'light';
}

// Detecta se é um dispositivo móvel (tela touch + largura pequena)
const isMobileDevice = (): boolean => {
  return 'ontouchstart' in window && (window.innerWidth < 1024 || window.innerHeight < 1024);
};

const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({ isOpen, onClose, onCapture, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturing, setCapturing] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detecta orientação do dispositivo
  useEffect(() => {
    if (!isOpen) return;

    const checkOrientation = () => {
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      if (mobile) {
        setIsPortrait(window.innerHeight > window.innerWidth);
      } else {
        setIsPortrait(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    const handleOrientationChange = () => {
      // Pequeno delay pra dar tempo do browser atualizar as dimensões
      setTimeout(checkOrientation, 150);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isOpen]);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setError('');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error('Erro ao acessar a câmera:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        setError('Erro interno ao capturar a foto.');
        setCapturing(false);
        return;
      }

      // Define canvas dimensions directly matching the video element's natural aspect ratio or width/height
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw image
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to WebP base64 with moderate quality to save space
      const imageBase64 = canvas.toDataURL('image/webp', 0.82);
      
      // Small simulated flash effect before closing
      setTimeout(() => {
        onCapture(imageBase64);
        handleClose();
        setCapturing(false);
      }, 150);
    }
  };

  // Determina a classe de aspecto com base na orientação
  const mobilePortrait = isMobile && isPortrait;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 no-print">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-black/70' : 'bg-slate-900/40'}`}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full ${mobilePortrait ? 'max-w-sm' : 'max-w-2xl'} rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center gap-2 text-cyan-500 font-bold">
                <Camera size={20} />
                <span>Tirar Foto do Equipamento</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Orientation indicator on mobile */}
                {isMobile && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${isPortrait
                    ? (isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600')
                    : (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600')
                  }`}>
                    {isPortrait ? 'Retrato' : 'Paisagem'}
                  </span>
                )}
                <button
                  onClick={handleClose}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Camera Viewport - adapts aspect ratio based on orientation */}
            <div className={`relative w-full ${mobilePortrait ? 'aspect-[3/4]' : 'aspect-video'} bg-black flex items-center justify-center overflow-hidden`}>
              {error ? (
                <div className="flex flex-col items-center justify-center text-rose-500 p-6 text-center gap-3">
                  <AlertCircle size={48} className="opacity-80" />
                  <p className="font-medium text-sm sm:text-base">{error}</p>
                  <button onClick={() => startCamera(facingMode)} className="mt-4 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg text-sm font-bold hover:bg-rose-500/30 transition-colors">
                    Tentar Novamente
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                  />
                  {capturing && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="absolute inset-0 bg-white" 
                      transition={{ duration: 0.1 }}
                    />
                  )}
                  {/* Overlay crosshairs/guides */}
                  <div className="absolute inset-0 pointer-events-none border-[1px] border-white/20 sm:m-8 m-4 rounded-xl flex items-center justify-center">
                    <div className="w-16 h-16 border-[1px] border-white/30 rounded-full" />
                  </div>
                </>
              )}
            </div>

            {/* Hidden Canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Actions Footer */}
            <div className={`p-4 gap-3 flex items-center justify-center sm:justify-between flex-wrap ${isDark ? 'bg-slate-900 border-t border-slate-800' : 'bg-white border-t border-slate-100'}`}>
              
              {/* Swap Camera Button (More useful on mobile) */}
              <button
                onClick={toggleCamera}
                disabled={!!error}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <RefreshCw size={18} />
                <span className="hidden sm:inline">Virar Câmera</span>
              </button>

              {/* Capture Button */}
              <button
                onClick={capturePhoto}
                disabled={!!error || capturing}
                className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all active:scale-95 shadow-lg shadow-cyan-500/30 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:pointer-events-none"
              >
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                Capturar Foto
              </button>

              {/* Placeholder to balance flex-between or Cancel button on mobile */}
              <div className="w-32 hidden sm:block" />
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WebcamCaptureModal;

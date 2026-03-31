import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  /**
   * Threshold em milissegundos para diferenciar um Leitor Ótico de um Humano digitando.
   * Scanners costumam disparar teclas num intervalo < 20ms.
   * Tolerância segura para navegadores é ~50ms.
   */
  timeThreshold?: number;
  /** Minimo de caracteres aceito como um código válido para ignorar falsos positivos */
  minLength?: number;
}

export function useBarcodeScanner({ onScan, timeThreshold = 40, minLength = 3 }: UseBarcodeScannerProps) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora eventos caso o usuário esteja digitando num textarea ou algo similar que trate enters com salto de linha
      // Mas *NÃO* ignoramos inputs de type='text' porque o usuário costuma clicar na barra de busca antes de bipar.
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'textarea') return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      
      // Se demorou mais do que o threshold entre teclas, assumimos que é digitação humana e limpamos o buffer
      if (timeDiff > timeThreshold) {
        bufferRef.current = '';
      }

      // Se pressionou Enter
      if (e.key === 'Enter') {
        const code = bufferRef.current;
        // Se temos um buffer acumulado longo o suficiente, é um SCAN válido.
        if (code.length >= minLength) {
          onScan(code);
          // Opcional: Impedir que o Enter do scanner submeta algum form genérico nativamente na página.
          // e.preventDefault(); 
        }
        bufferRef.current = ''; // Reseta após o Enter, seja scan válido ou não
        return; // Não atualiza lastKeyTimeRef no Enter para não emendar em leituras parciais
      }

      // Se a tecla tiver exatamente tamanho 1 (caractere visível normal como 'a', '1', '-')
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      // Atualiza o tempo da última tecla
      lastKeyTimeRef.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, timeThreshold, minLength]);
}

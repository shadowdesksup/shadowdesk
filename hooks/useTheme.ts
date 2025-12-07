import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'shadowdesk-theme';

export function useTheme() {
  // Inicializar com tema do localStorage ou dark como padrão
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
  });

  // Persistir mudanças no localStorage
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  return { theme, toggleTheme, isDark };
}

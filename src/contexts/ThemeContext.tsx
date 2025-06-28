import React, { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'default' | 'liquid-glass';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  getThemeClasses: (baseClasses: string) => string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  toggleTheme: () => {},
  getThemeClasses: (baseClasses: string) => baseClasses,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('default');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'default' ? 'liquid-glass' : 'default'));
  };

  const getThemeClasses = (baseClasses: string) => {
    if (theme === 'default') {
      return `${baseClasses} bg-dark-gray/50 border border-gray-700 transition-all duration-500`;
    }
    return `${baseClasses} bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg 
      hover:bg-white/10 hover:border-white/20 hover:shadow-xl 
      transition-all duration-500 ease-out`;
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, getThemeClasses }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  return context;
}
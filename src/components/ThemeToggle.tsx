import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl \
        text-white border border-white/20 \
        hover:bg-white/20 hover:border-white/40 hover:shadow-lg\
        active:scale-95\
        transition-all duration-300 ease-out\
        font-medium tracking-wide"
    >
      <div className="flex items-center space-x-2">
        {theme === 'default' ? (
          <>
            <span className="text-lg">🌊</span>
            <span>Liquid Glass</span>
          </>
        ) : (
          <>
            <span className="text-lg">✨</span>
            <span>Default</span>
          </>
        )}
      </div>
    </button>
  );
}

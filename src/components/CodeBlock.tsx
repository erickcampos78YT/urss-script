import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript' }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Clean the code by removing any HTML tags
  const cleanCode = code.replace(/<[^>]*>/g, '');

  return (
    <div className={`
      relative rounded-lg overflow-hidden
      ${theme === 'dark' 
        ? 'bg-dark-gray/50 border border-gray-700' 
        : 'bg-glass backdrop-blur-2xl border border-glass-light shadow-glass-light'
      }
    `}>
      <div className={`
        flex items-center justify-between px-4 py-2
        ${theme === 'dark' 
          ? 'bg-dark-gray/70 border-b border-gray-700' 
          : 'bg-glass-light/30 border-b border-glass-light'
        }
      `}>
        <span className={`
          text-sm font-mono
          ${theme === 'dark' 
            ? 'text-gray-300' 
            : 'text-white/80'
          }
        `}>
          {language}
        </span>
        <button
          onClick={handleCopy}
          className={`
            p-2 rounded-lg transition-all duration-300
            ${theme === 'dark' 
              ? 'hover:bg-dark-gray/70' 
              : 'hover:bg-white/10'
            }
          `}
          title="Copy code"
        >
          {copied ? (
            <span className="text-green-500">✓</span>
          ) : (
            <span className={`
              ${theme === 'dark' 
                ? 'text-gray-400' 
                : 'text-white/60'
              }
            `}>
              📋
            </span>
          )}
        </button>
      </div>
      <div className="relative">
        <pre className={`
          p-4 overflow-x-auto font-mono text-sm
          ${theme === 'dark' 
            ? 'text-gray-300' 
            : 'text-white/90'
          }
        `}>
          <code>{cleanCode}</code>
        </pre>
        <div className={`
          absolute inset-y-0 right-0 w-8
          ${theme === 'dark' 
            ? 'bg-gradient-to-l from-dark-gray/50' 
            : 'bg-gradient-to-l from-glass/50'
          }
        `} />
      </div>
    </div>
  );
};

export default CodeBlock; 
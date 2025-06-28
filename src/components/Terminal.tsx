import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

interface TerminalProps {
  initialText?: string;
  onCommand?: (command: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ initialText = '', onCommand }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const { theme } = useTheme();
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialText) {
      setOutput(prev => [...prev, initialText]);
    }
  }, [initialText]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setOutput(prev => [...prev, `$ ${input}`]);
    if (onCommand) {
      onCommand(input);
    }
    setInput('');
    inputRef.current?.focus();
  };

  // Função para identificar tipo de linha
  function getLineType(line: string) {
    if (line.startsWith('$')) return 'command';
    if (/error|not found|failed|exception/i.test(line)) return 'error';
    return 'output';
  }

  // Função para destacar comandos, variáveis e strings
  function highlightTerminal(line: string) {
    return Prism.highlight(line, Prism.languages.bash, 'bash');
  }

  return (
    <div className={`
      rounded-lg overflow-hidden w-full
      ${theme === 'liquid-glass' 
        ? 'script-interface'
        : 'bg-dark-gray/50 border border-gray-700'
      }
    `}>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <div 
        ref={terminalRef}
        className={`
          p-4 font-mono text-sm terminal-container overflow-y-auto
          ${theme === 'liquid-glass' 
            ? 'script-interface'
            : 'bg-dark-gray/50'
          }
        `}
      >
        <div className="space-y-1">
          {output.map((line, i) => {
            const type = getLineType(line);
            return (
              <div key={i} className="break-words">
                <pre className={`language-bash m-0 ${
                  type === 'command' ? 'text-green-400' :
                  type === 'error' ? 'text-red-400' :
                  'text-gray-300'
                }`} style={{margin: 0}}>
                  <code dangerouslySetInnerHTML={{ __html: highlightTerminal(line) }} />
                </pre>
              </div>
            );
          })}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center mt-2">
          <span className={`
            mr-2 whitespace-nowrap select-none px-2 py-1 rounded bg-gray-800 text-green-400 font-bold shadow-sm border border-gray-700
          `}>
            $
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`
              flex-1 bg-transparent outline-none min-w-0
              ${theme === 'liquid-glass' 
                ? 'text-white' 
                : 'text-white'
              }
            `}
            autoFocus
          />
        </form>
      </div>
    </div>
  );
};

export default Terminal;
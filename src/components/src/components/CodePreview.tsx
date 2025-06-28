import React, { useState, useEffect } from 'react';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';

interface CodePreviewProps {
  code: string;
  language?: string;
  maxHeight?: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, language = 'plaintext', maxHeight = '400px' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCode, setDisplayedCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Simulate loading for large files
    const timer = setTimeout(() => {
      setDisplayedCode(code);
      setIsLoading(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative bg-[#1e1e1e] rounded-xl overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-carmine/30">
        <div className="text-sm text-gray-400">
          {language} - {code.length} characters
        </div>
        <button
          onClick={handleCopy}
          className="p-1 text-gray-400 hover:text-carmine transition-colors"
          title="Copy to clipboard"
        >
          <ClipboardDocumentIcon className="h-5 w-5" />
          {copied && (
            <span className="absolute -top-8 right-0 bg-carmine/90 text-white px-2 py-1 rounded text-sm">
              Copied!
            </span>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div 
        className="relative overflow-auto font-mono text-sm border border-carmine/30 rounded-b-xl"
        style={{ maxHeight }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-carmine"></div>
          </div>
        ) : (
          <pre className="p-4 text-gray-200">
            <code>{displayedCode}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

export default CodePreview; 
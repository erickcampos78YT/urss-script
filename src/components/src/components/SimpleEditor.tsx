import React from 'react';

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

const SimpleEditor: React.FC<SimpleEditorProps> = ({ value, onChange, language, readOnly = false }) => {
  return (
    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-700">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
        <div className="text-gray-400 text-sm">{language || 'plaintext'}</div>
        <div className="text-gray-400 text-xs">
          {value.split('\n').length} lines
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[300px] p-4 bg-transparent text-gray-300 font-mono text-sm focus:outline-none resize-y"
          style={{ 
            lineHeight: '1.5',
            tabSize: 2
          }}
          spellCheck={false}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};

export default SimpleEditor;

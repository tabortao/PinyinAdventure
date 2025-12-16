import { useEffect, useState } from 'react';

interface PinyinKeyboardProps {
  onInput: (char: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  onTone: (tone: number) => void; // 1, 2, 3, 4, 0 (neutral)
  disabled?: boolean;
}

const TONES = ['ā', 'á', 'ǎ', 'à', 'a']; // Visual representation
const TONE_LABELS = ['-', '/', 'V', '\\', '·'];

export const PinyinKeyboard = ({ onInput, onDelete, onConfirm, onTone, disabled }: PinyinKeyboardProps) => {
  const rows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ü'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  // Handle physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const key = e.key.toLowerCase();
      
      if (key === 'backspace') {
        onDelete();
      } else if (key === 'enter') {
        onConfirm();
      } else if (/^[a-z]$/.test(key)) {
        if (key === 'v') onInput('ü'); // V maps to Ü often in pinyin input
        else onInput(key);
      } else if (['1', '2', '3', '4', '5', '0'].includes(key)) {
        onTone(parseInt(key) === 5 ? 0 : parseInt(key));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onInput, onDelete, onConfirm, onTone, disabled]);

  const KeyButton = ({ char, wide = false, action = false }: { char: string | React.ReactNode, wide?: boolean, action?: boolean }) => (
    <button
      onClick={() => {
        if (typeof char === 'string' && char.length === 1 && !action) onInput(char);
        else if (char === 'DEL') onDelete();
        else if (char === 'OK') onConfirm();
      }}
      disabled={disabled}
      className={`
        h-12 md:h-14 rounded-lg shadow-md font-bold text-xl transition-all active:scale-95 active:shadow-sm select-none
        ${wide ? 'flex-[1.5]' : 'flex-1'}
        ${action 
          ? 'bg-brand-secondary text-white' 
          : 'bg-white text-slate-700 hover:bg-slate-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {char}
    </button>
  );

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-100 p-2 md:p-4 rounded-t-3xl md:rounded-3xl shadow-inner">
      {/* Tone Bar */}
      <div className="flex gap-2 mb-3">
        {[1, 2, 3, 4, 0].map((tone) => (
          <button
            key={tone}
            onClick={() => onTone(tone)}
            disabled={disabled}
            className="flex-1 h-10 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg border-2 border-brand-primary/30 font-bold text-lg flex items-center justify-center transition-all active:scale-95"
          >
            {tone === 0 ? '轻声' : `声调 ${tone}`}
            <span className="ml-1 text-xs opacity-60">({tone === 0 ? '5' : tone})</span>
          </button>
        ))}
      </div>

      {/* Letters */}
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-1 md:gap-2">
            {i === 2 && <div className="flex-[0.5]" />} {/* Spacer for alignment */}
            {row.map((char) => (
              <KeyButton key={char} char={char} />
            ))}
            {i === 2 && (
              <button
                onClick={onDelete}
                className="flex-[1.5] bg-slate-200 text-slate-600 rounded-lg shadow-md font-bold active:scale-95"
              >
                ⌫
              </button>
            )}
             {i === 2 && <div className="flex-[0.5]" />}
          </div>
        ))}
        
        {/* Enter Key (Full width at bottom or integrated?) Let's put it separate for emphasis */}
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="w-full h-14 mt-2 bg-brand-secondary hover:bg-orange-500 text-white text-xl font-bold rounded-xl shadow-lg active:scale-95 transition-all"
        >
          确认 (Enter)
        </button>
      </div>
    </div>
  );
};

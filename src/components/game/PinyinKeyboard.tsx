import { useEffect } from 'react';
import { audioEngine } from '../../lib/audio';

interface PinyinKeyboardProps {
  onInput: (char: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  onTone: (tone: number) => void; // 1, 2, 3, 4, 0 (neutral)
  disabled?: boolean;
}

const TONES = ['ā', 'á', 'ǎ', 'à', 'a']; // Visual representation
const TONE_LABELS = ['-', '/', 'V', '\\', '·'];

// Map keys to piano notes roughly
const NOTE_MAP: Record<string, string> = {
  'q': 'C4', 'w': 'D4', 'e': 'E4', 'r': 'F4', 't': 'G4', 'y': 'A4', 'u': 'B4', 'i': 'C5', 'o': 'D5', 'p': 'E5',
  'a': 'F3', 's': 'G3', 'd': 'A3', 'f': 'B3', 'g': 'C4', 'h': 'D4', 'j': 'E4', 'k': 'F4', 'l': 'G4', 'ü': 'A4',
  'z': 'C3', 'x': 'D3', 'c': 'E3', 'v': 'F3', 'b': 'G3', 'n': 'A3', 'm': 'B3'
};

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
      } else if (key === ' ') {
        e.preventDefault();
        onInput(' ');
        audioEngine.playNote('C2'); // Low note for space
      } else if (/^[a-z]$/.test(key)) {
        if (key === 'v') onInput('ü'); 
        else onInput(key);
        
        const note = NOTE_MAP[key === 'v' ? 'v' : key];
        if (note) audioEngine.playNote(note);
      } else if (['1', '2', '3', '4', '5', '0'].includes(key)) {
        onTone(parseInt(key) === 5 ? 0 : parseInt(key));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onInput, onDelete, onConfirm, onTone, disabled]);

  const handleKeyClick = (char: string) => {
    onInput(char);
    const note = NOTE_MAP[char];
    if (note) audioEngine.playNote(note);
  };

  const KeyButton = ({ char, wide = false, action = false }: { char: string | React.ReactNode, wide?: boolean, action?: boolean }) => (
    <button
      onClick={() => {
        if (typeof char === 'string' && char.length === 1 && !action) handleKeyClick(char);
        else if (char === 'DEL') onDelete();
        else if (char === 'OK') onConfirm();
        else if (char === 'SPACE') {
          onInput(' ');
          audioEngine.playNote('C2');
        }
      }}
      disabled={disabled}
      className={`
        h-10 md:h-12 rounded-lg shadow-md font-bold text-lg md:text-xl transition-all active:scale-95 active:shadow-sm select-none
        ${wide ? 'flex-[1.5]' : 'flex-1'}
        ${action 
          ? 'bg-brand-secondary text-white' 
          : 'bg-white text-slate-700 hover:bg-slate-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {char === 'SPACE' ? '␣' : char}
    </button>
  );

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-100 p-2 md:p-4 rounded-t-3xl md:rounded-3xl shadow-inner pb-6 md:pb-4">
      {/* Tone Bar */}
      <div className="flex gap-2 mb-3">
        {[1, 2, 3, 4, 0].map((tone) => (
          <button
            key={tone}
            onClick={() => onTone(tone)}
            disabled={disabled}
            className="flex-1 h-9 md:h-10 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg border-2 border-brand-primary/30 font-bold text-lg flex items-center justify-center transition-all active:scale-95"
          >
            {tone === 0 ? '·' : ['-', '/', 'V', '\\'][tone-1]}
          </button>
        ))}
      </div>

      {/* Letters */}
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-1 md:gap-2">
            {i === 2 && <div className="flex-[0.5]" />} 
            {row.map((char) => (
              <KeyButton key={char} char={char} />
            ))}
            {i === 2 && (
              <button
                onClick={onDelete}
                className="flex-[1.5] bg-slate-200 text-slate-600 rounded-lg shadow-md font-bold active:scale-95 text-xl"
              >
                ⌫
              </button>
            )}
             {i === 2 && <div className="flex-[0.5]" />}
          </div>
        ))}
        
        {/* Space and Enter */}
        <div className="flex gap-2 mt-1">
           <KeyButton char="SPACE" wide />
           <button
            onClick={onConfirm}
            disabled={disabled}
            className="flex-[2] h-10 md:h-12 bg-brand-secondary hover:bg-orange-500 text-white text-lg font-bold rounded-lg shadow-lg active:scale-95 transition-all"
          >
            提交 (Enter)
          </button>
        </div>
      </div>
    </div>
  );
};

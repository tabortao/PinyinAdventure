// Map of vowels to their toned versions
const TONE_MAP: Record<string, string[]> = {
  'a': ['ā', 'á', 'ǎ', 'à', 'a'],
  'o': ['ō', 'ó', 'ǒ', 'ò', 'o'],
  'e': ['ē', 'é', 'ě', 'è', 'e'],
  'i': ['ī', 'í', 'ǐ', 'ì', 'i'],
  'u': ['ū', 'ú', 'ǔ', 'ù', 'u'],
  'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  'v': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'], // Handle v as ü
};

// Vowels in order of priority for tone placement
// Rule: a > o > e > i/u/ü. 
// Exception: iu -> iū, ui -> uī (tone on the last one)
const VOWELS = ['a', 'o', 'e', 'i', 'u', 'ü', 'v'];

export const applyTone = (pinyin: string, tone: number): string => {
  if (tone === 0 || tone === 5) return pinyin; // Neutral tone usually leaves it plain or dot, here plain.

  // 1. Find the vowel to mark
  let vowelIndex = -1;
  let vowelChar = '';

  // Check for 'a', 'o', 'e' first (highest priority)
  for (const v of ['a', 'o', 'e']) {
    if (pinyin.includes(v)) {
      vowelIndex = pinyin.indexOf(v);
      vowelChar = v;
      break;
    }
  }

  // If not found, check others
  if (vowelIndex === -1) {
    // Special case: iu or ui -> mark the second one
    if (pinyin.includes('iu')) {
      vowelIndex = pinyin.indexOf('u'); // iu -> u gets tone
      vowelChar = 'u';
    } else if (pinyin.includes('ui')) {
      vowelIndex = pinyin.indexOf('i'); // ui -> i gets tone
      vowelChar = 'i';
    } else {
      // Find first occurrence of i, u, ü
      for (const v of ['i', 'u', 'ü', 'v']) {
        const idx = pinyin.indexOf(v);
        if (idx !== -1) {
          vowelIndex = idx;
          vowelChar = v;
          break;
        }
      }
    }
  }

  if (vowelIndex !== -1 && TONE_MAP[vowelChar]) {
    const tonedChar = TONE_MAP[vowelChar][tone - 1]; // tone 1 is index 0
    return pinyin.substring(0, vowelIndex) + tonedChar + pinyin.substring(vowelIndex + 1);
  }

  return pinyin;
};

// Helper to check if user input matches answer (ignoring some loose cases if needed, but strict for now)
export const checkAnswer = (input: string, answer: string): boolean => {
  return input.trim() === answer.trim();
};

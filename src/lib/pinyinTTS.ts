// Mapping pinyin letters to Chinese characters for better TTS pronunciation
// Especially for initials (声母) which are often read as English letters by default

export const pinyinToTTSMap: Record<string, string> = {
  // Initials (声母) - using '呼读音'
  'b': '波',
  'p': '坡',
  'm': '摸',
  'f': '佛',
  'd': '得',
  't': '特',
  'n': '呢',
  'l': '勒',
  'g': '哥',
  'k': '科',
  'h': '喝',
  'j': '基',
  'q': '欺',
  'x': '希',
  'zh': '知',
  'ch': '吃',
  'sh': '诗',
  'r': '日',
  'z': '资',
  'c': '雌',
  's': '思',
  'y': '医',
  'w': '屋',
  
  // Single Finals (单韵母)
  'a': '啊',
  'o': '喔',
  'e': '鹅',
  'i': '衣',
  'u': '乌',
  'v': '迂', // ü often typed as v
  'ü': '迂',
  
  // Some complex ones if needed, but usually they are fine
};

export const getPinyinTTS = (text: string): string => {
  // If it's a known mapping, return the Chinese character
  if (pinyinToTTSMap[text]) {
    return pinyinToTTSMap[text];
  }
  // If it contains ü but not mapped above
  if (text.includes('ü')) {
     return text.replace('ü', '鱼'); // Approximate
  }
  
  return text;
};

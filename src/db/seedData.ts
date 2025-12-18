import { Question, Level } from '../types/types';

const COMMON_CHARS = [
  // Grade 1
  { h: '天', p: 'tiān' }, { h: '地', p: 'dì' }, { h: '人', p: 'rén' }, { h: '你', p: 'nǐ' }, { h: '我', p: 'wǒ' },
  { h: '他', p: 'tā' }, { h: '一', p: 'yī' }, { h: '二', p: 'èr' }, { h: '三', p: 'sān' }, { h: '四', p: 'sì' },
  { h: '五', p: 'wǔ' }, { h: '上', p: 'shàng' }, { h: '下', p: 'xià' }, { h: '口', p: 'kǒu' }, { h: '耳', p: 'ěr' },
  { h: '目', p: 'mù' }, { h: '手', p: 'shǒu' }, { h: '足', p: 'zú' }, { h: '站', p: 'zhàn' }, { h: '坐', p: 'zuò' },
  { h: '日', p: 'rì' }, { h: '月', p: 'yuè' }, { h: '水', p: 'shuǐ' }, { h: '火', p: 'huǒ' }, { h: '山', p: 'shān' },
  { h: '石', p: 'shí' }, { h: '田', p: 'tián' }, { h: '禾', p: 'hé' }, { h: '对', p: 'duì' }, { h: '云', p: 'yún' },
  { h: '雨', p: 'yǔ' }, { h: '风', p: 'fēng' }, { h: '花', p: 'huā' }, { h: '鸟', p: 'niǎo' }, { h: '虫', p: 'chóng' },
  
  // Grade 2
  { h: '吃', p: 'chī' }, { h: '叫', p: 'jiào' }, { h: '主', p: 'zhǔ' }, { h: '江', p: 'jiāng' }, { h: '住', p: 'zhù' },
  { h: '没', p: 'méi' }, { h: '以', p: 'yǐ' }, { h: '会', p: 'huì' }, { h: '走', p: 'zǒu' }, { h: '北', p: 'běi' },
  { h: '京', p: 'jīng' }, { h: '门', p: 'mén' }, { h: '广', p: 'guǎng' }, { h: '过', p: 'guò' }, { h: '各', p: 'gè' },
  { h: '种', p: 'zhǒng' }, { h: '样', p: 'yàng' }, { h: '伙', p: 'huǒ' }, { h: '伴', p: 'bàn' }, { h: '这', p: 'zhè' },
  { h: '太', p: 'tài' }, { h: '阳', p: 'yáng' }, { h: '校', p: 'xiào' }, { h: '金', p: 'jīn' }, { h: '秋', p: 'qiū' },
  
  // Grade 3
  { h: '晨', p: 'chén' }, { h: '绒', p: 'róng' }, { h: '球', p: 'qiú' }, { h: '汉', p: 'hàn' }, { h: '艳', p: 'yàn' },
  { h: '服', p: 'fú' }, { h: '装', p: 'zhuāng' }, { h: '扮', p: 'bàn' }, { h: '读', p: 'dú' }, { h: '静', p: 'jìng' },
  { h: '停', p: 'tíng' }, { h: '粗', p: 'cū' }, { h: '影', p: 'yǐng' }, { h: '落', p: 'luò' }, { h: '荒', p: 'huāng' },
  { h: '笛', p: 'dí' }, { h: '舞', p: 'wǔ' }, { h: '狂', p: 'kuáng' }, { h: '罚', p: 'fá' }, { h: '假', p: 'jiǎ' },
  
  // Grade 4
  { h: '潮', p: 'cháo' }, { h: '称', p: 'chēng' }, { h: '盐', p: 'yán' }, { h: '笼', p: 'lóng' }, { h: '罩', p: 'zhào' },
  { h: '蒙', p: 'méng' }, { h: '薄', p: 'bó' }, { h: '雾', p: 'wù' }, { h: '昂', p: 'áng' }, { h: '沸', p: 'fèi' },
  { h: '贯', p: 'guàn' }, { h: '旧', p: 'jiù' }, { h: '恢', p: 'huī' }, { h: '灿', p: 'càn' }, { h: '烂', p: 'làn' },
  { h: '杆', p: 'gān' }, { h: '茫', p: 'máng' }, { h: '桨', p: 'jiǎng' }, { h: '律', p: 'lǜ' }, { h: '支', p: 'zhī' },

  // Grade 5
  { h: '亩', p: 'mǔ' }, { h: '播', p: 'bō' }, { h: '浇', p: 'jiāo' }, { h: '吩', p: 'fēn' }, { h: '咐', p: 'fù' },
  { h: '亭', p: 'tíng' }, { h: '榨', p: 'zhà' }, { h: '慕', p: 'mù' }, { h: '矮', p: 'ǎi' }, { h: '嫌', p: 'xián' },
  { h: '韵', p: 'yùn' }, { h: '杭', p: 'háng' }, { h: '苏', p: 'sū' }, { h: '萝', p: 'luó' }, { h: '婆', p: 'pó' },
  { h: '糕', p: 'gāo' }, { h: '饼', p: 'bǐng' }, { h: '浸', p: 'jìn' }, { h: '缠', p: 'chán' }, { h: '茶', p: 'chá' },

  // Grade 6
  { h: '毯', p: 'tǎn' }, { h: '陈', p: 'chén' }, { h: '裳', p: 'shang' }, { h: '虹', p: 'hóng' }, { h: '蹄', p: 'tí' },
  { h: '腐', p: 'fǔ' }, { h: '稍', p: 'shāo' }, { h: '微', p: 'wēi' }, { h: '笨', p: 'bèn' }, { h: '拙', p: 'zhuō' },
  { h: '怨', p: 'yuàn' }, { h: '德', p: 'dé' }, { h: '恍', p: 'huǎng' }, { h: '悟', p: 'wù' }, { h: '喜', p: 'xǐ' },
  { h: '鹊', p: 'què' }, { h: '蝉', p: 'chán' }, { h: '稻', p: 'dào' }, { h: '惊', p: 'jīng' }, { h: '聚', p: 'jù' }
];

export const PINYIN_DATA = [
  // Initials (声母) 23
  { pinyin: 'b', type: 'initial', emoji: '👄' }, { pinyin: 'p', type: 'initial', emoji: '💦' },
  { pinyin: 'm', type: 'initial', emoji: '🚪' }, { pinyin: 'f', type: 'initial', emoji: '🗽' },
  { pinyin: 'd', type: 'initial', emoji: '🥁' }, { pinyin: 't', type: 'initial', emoji: '⛱️' },
  { pinyin: 'n', type: 'initial', emoji: '🚪' }, { pinyin: 'l', type: 'initial', emoji: '🪵' },
  { pinyin: 'g', type: 'initial', emoji: '🕊️' }, { pinyin: 'k', type: 'initial', emoji: '蝌' },
  { pinyin: 'h', type: 'initial', emoji: '🪑' }, { pinyin: 'j', type: 'initial', emoji: '🐔' },
  { pinyin: 'q', type: 'initial', emoji: '🎈' }, { pinyin: 'x', type: 'initial', emoji: '🍉' },
  { pinyin: 'zh', type: 'initial', emoji: '🕷️' }, { pinyin: 'ch', type: 'initial', emoji: '🥄' },
  { pinyin: 'sh', type: 'initial', emoji: '🦁' }, { pinyin: 'r', type: 'initial', emoji: '☀️' },
  { pinyin: 'z', type: 'initial', emoji: '💜' }, { pinyin: 'c', type: 'initial', emoji: '🦔' },
  { pinyin: 's', type: 'initial', emoji: '🐍' }, { pinyin: 'y', type: 'initial', emoji: '👔' },
  { pinyin: 'w', type: 'initial', emoji: '🏠' },

  // Finals (韵母) 24
  { pinyin: 'a', type: 'final', emoji: '😮' }, { pinyin: 'o', type: 'final', emoji: '🐔' },
  { pinyin: 'e', type: 'final', emoji: '🦆' }, { pinyin: 'i', type: 'final', emoji: '👕' },
  { pinyin: 'u', type: 'final', emoji: '🐢' }, { pinyin: 'ü', type: 'final', emoji: '🐟' },
  { pinyin: 'ai', type: 'final', emoji: '👵' }, { pinyin: 'ei', type: 'final', emoji: '🔨' },
  { pinyin: 'ui', type: 'final', emoji: '🐢' }, { pinyin: 'ao', type: 'final', emoji: '🧥' },
  { pinyin: 'ou', type: 'final', emoji: '🐦' }, { pinyin: 'iu', type: 'final', emoji: '🏊' },
  { pinyin: 'ie', type: 'final', emoji: '🥥' }, { pinyin: 'üe', type: 'final', emoji: '🌙' },
  { pinyin: 'er', type: 'final', emoji: '👂' }, { pinyin: 'an', type: 'final', emoji: '⛩️' },
  { pinyin: 'en', type: 'final', emoji: '👋' }, { pinyin: 'in', type: 'final', emoji: '🥤' },
  { pinyin: 'un', type: 'final', emoji: '☁️' }, { pinyin: 'ün', type: 'final', emoji: '☁️' },
  { pinyin: 'ang', type: 'final', emoji: '🐑' }, { pinyin: 'eng', type: 'final', emoji: '💡' },
  { pinyin: 'ing', type: 'final', emoji: '🦅' }, { pinyin: 'ong', type: 'final', emoji: '⏰' },

  // Overall Recognition (整体认读) 16
  { pinyin: 'zhi', type: 'overall', emoji: '🕷️' }, { pinyin: 'chi', type: 'overall', emoji: '🥄' },
  { pinyin: 'shi', type: 'overall', emoji: '🦁' }, { pinyin: 'ri', type: 'overall', emoji: '☀️' },
  { pinyin: 'zi', type: 'overall', emoji: '💜' }, { pinyin: 'ci', type: 'overall', emoji: '🦔' },
  { pinyin: 'si', type: 'overall', emoji: '🐍' }, { pinyin: 'yi', type: 'overall', emoji: '👔' },
  { pinyin: 'wu', type: 'overall', emoji: '🏠' }, { pinyin: 'yu', type: 'overall', emoji: '🐟' },
  { pinyin: 'ye', type: 'overall', emoji: '🥥' }, { pinyin: 'yue', type: 'overall', emoji: '🌙' },
  { pinyin: 'yuan', type: 'overall', emoji: '⭕' }, { pinyin: 'yin', type: 'overall', emoji: '🎵' },
  { pinyin: 'yun', type: 'overall', emoji: '☁️' }, { pinyin: 'ying', type: 'overall', emoji: '🦅' }
];

export const generateQuizData = () => {
  const levels: Level[] = [];
  const questions: Question[] = [];
  
  let levelIdCounter = 1;
  let questionIdCounter = 10000; // Start high to avoid collision

  // 6 Grades
  for (let grade = 1; grade <= 6; grade++) {
    // 5 Levels per Grade
    for (let chapter = 1; chapter <= 5; chapter++) {
      const levelId = levelIdCounter++;
      levels.push({
        id: levelId,
        grade: grade,
        chapter: chapter,
        name: `第${chapter}关`,
        description: `${grade}年级 第${chapter}关`
      });

      // 10 Questions per Level
      for (let q = 0; q < 10; q++) {
        // Pick random char from list (cycling)
        // To make it deterministic or at least cover the list:
        // Filter chars for this grade if possible, or just use all for variety in this demo
        // Ideally we should segment COMMON_CHARS by grade. 
        // For simplicity, I will segment by index range roughly
        // 0-34: G1, 35-59: G2, etc.
        // Actually, let's just pick random from the whole list to ensure variety if list is small
        // OR better:
        
        const startIndex = (grade - 1) * 20; // 20 chars per grade roughly in my list
        const gradeChars = COMMON_CHARS.slice(startIndex, startIndex + 30);
        const sourceList = gradeChars.length > 0 ? gradeChars : COMMON_CHARS;
        
        const charObj = sourceList[Math.floor(Math.random() * sourceList.length)];
        
        questions.push({
          id: questionIdCounter++,
          level_id: levelId,
          type: 'character',
          content: charObj.h,
          pinyin: charObj.p,
          audio_url: null
        });
      }
    }
  }

  return { levels, questions };
};

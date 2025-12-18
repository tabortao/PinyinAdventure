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
  // 声母 (Initials) - 23个
  { pinyin: 'b', type: 'initial', category: 'initial', emoji: '📻', mnemonic: '听广播 b b b', example_word: '菠菜', example_pinyin: 'bō cài' },
  { pinyin: 'p', type: 'initial', category: 'initial', emoji: '⛰️', mnemonic: '爬山坡 p p p', example_word: '爬山', example_pinyin: 'pá shān' },
  { pinyin: 'm', type: 'initial', category: 'initial', emoji: '🚪', mnemonic: '两个门洞 m m m', example_word: '摸人', example_pinyin: 'mō rén' },
  { pinyin: 'f', type: 'initial', category: 'initial', emoji: '🗿', mnemonic: '一尊佛像 f f f', example_word: '大佛', example_pinyin: 'dà fó' },
  { pinyin: 'd', type: 'initial', category: 'initial', emoji: '🥁', mnemonic: '左下半圆 d d d', example_word: '打鼓', example_pinyin: 'dǎ gǔ' },
  { pinyin: 't', type: 'initial', category: 'initial', emoji: '🌂', mnemonic: '伞柄朝下 t t t', example_word: '特别', example_pinyin: 'tè bié' },
  { pinyin: 'n', type: 'initial', category: 'initial', emoji: '🚪', mnemonic: '一个门洞 n n n', example_word: '哪吒', example_pinyin: 'né zhā' },
  { pinyin: 'l', type: 'initial', category: 'initial', emoji: '🥢', mnemonic: '一根小棍 l l l', example_word: '快乐', example_pinyin: 'kuài lè' },
  { pinyin: 'g', type: 'initial', category: 'initial', emoji: '🕊️', mnemonic: '鸽子鸽子 g g g', example_word: '哥哥', example_pinyin: 'gē ge' },
  { pinyin: 'k', type: 'initial', category: 'initial', emoji: '👶', mnemonic: '蝌蚪蝌蚪 k k k', example_word: '蝌蚪', example_pinyin: 'kē dǒu' },
  { pinyin: 'h', type: 'initial', category: 'initial', emoji: '🪑', mnemonic: '一把椅子 h h h', example_word: '喝水', example_pinyin: 'hē shuǐ' },
  { pinyin: 'j', type: 'initial', category: 'initial', emoji: '🐔', mnemonic: '母鸡母鸡 j j j', example_word: '母鸡', example_pinyin: 'mǔ jī' },
  { pinyin: 'q', type: 'initial', category: 'initial', emoji: '🎈', mnemonic: '气球气球 q q q', example_word: '气球', example_pinyin: 'qì qiú' },
  { pinyin: 'x', type: 'initial', category: 'initial', emoji: '🍉', mnemonic: '西瓜西瓜 x x x', example_word: '西瓜', example_pinyin: 'xī guā' },
  { pinyin: 'zh', type: 'initial', category: 'initial', emoji: '🧶', mnemonic: '织毛衣 zh zh zh', example_word: '蜘蛛', example_pinyin: 'zhī zhū' },
  { pinyin: 'ch', type: 'initial', category: 'initial', emoji: '🥄', mnemonic: '吃苹果 ch ch ch', example_word: '吃饭', example_pinyin: 'chī fàn' },
  { pinyin: 'sh', type: 'initial', category: 'initial', emoji: '🦁', mnemonic: '石狮子 sh sh sh', example_word: '狮子', example_pinyin: 'shī zi' },
  { pinyin: 'r', type: 'initial', category: 'initial', emoji: '☀️', mnemonic: '红日红日 r r r', example_word: '日出', example_pinyin: 'rì chū' },
  { pinyin: 'z', type: 'initial', category: 'initial', emoji: '✍️', mnemonic: '像个2字 z z z', example_word: '写字', example_pinyin: 'xiě zì' },
  { pinyin: 'c', type: 'initial', category: 'initial', emoji: '🦔', mnemonic: '半个圆圈 c c c', example_word: '刺猬', example_pinyin: 'cì wei' },
  { pinyin: 's', type: 'initial', category: 'initial', emoji: '🐍', mnemonic: '半个8字 s s s', example_word: '吐丝', example_pinyin: 'tǔ sī' },
  { pinyin: 'y', type: 'initial', category: 'initial', emoji: '🌲', mnemonic: '像个树杈 y y y', example_word: '鸭梨', example_pinyin: 'yā lí' },
  { pinyin: 'w', type: 'initial', category: 'initial', emoji: '🏠', mnemonic: '像间屋子 w w w', example_word: '乌鸦', example_pinyin: 'wū yā' },

  // 韵母 (Finals) - 24个
  // 单韵母
  { pinyin: 'a', type: 'final', category: 'final_simple', emoji: '😮', mnemonic: '张大嘴巴 a a a', example_word: '阿姨', example_pinyin: 'ā yí' },
  { pinyin: 'o', type: 'final', category: 'final_simple', emoji: '🐓', mnemonic: '圆圆嘴巴 o o o', example_word: '喔喔', example_pinyin: 'wō wō' },
  { pinyin: 'e', type: 'final', category: 'final_simple', emoji: '🦢', mnemonic: '扁扁嘴巴 e e e', example_word: '白鹅', example_pinyin: 'bái é' },
  { pinyin: 'i', type: 'final', category: 'final_simple', emoji: '👕', mnemonic: '一件衣服 i i i', example_word: '衣服', example_pinyin: 'yī fu' },
  { pinyin: 'u', type: 'final', category: 'final_simple', emoji: '🐢', mnemonic: '一只乌龟 u u u', example_word: '乌龟', example_pinyin: 'wū guī' },
  { pinyin: 'ü', type: 'final', category: 'final_simple', emoji: '🐟', mnemonic: '一条小鱼 ü ü ü', example_word: '金鱼', example_pinyin: 'jīn yú' },
  
  // 复韵母
  { pinyin: 'ai', type: 'final', category: 'final_compound', emoji: '👵', mnemonic: '挨在一起 ai ai ai', example_word: '喜爱', example_pinyin: 'xǐ ài' },
  { pinyin: 'ei', type: 'final', category: 'final_compound', emoji: '🔨', mnemonic: '用力砍树 ei ei ei', example_word: '杯子', example_pinyin: 'bēi zi' },
  { pinyin: 'ui', type: 'final', category: 'final_compound', emoji: '🧣', mnemonic: '围巾围巾 ui ui ui', example_word: '水杯', example_pinyin: 'shuǐ bēi' },
  { pinyin: 'ao', type: 'final', category: 'final_compound', emoji: '🧥', mnemonic: '一件棉袄 ao ao ao', example_word: '书包', example_pinyin: 'shū bāo' },
  { pinyin: 'ou', type: 'final', category: 'final_compound', emoji: '🕊️', mnemonic: '一只海鸥 ou ou ou', example_word: '海鸥', example_pinyin: 'hǎi ōu' },
  { pinyin: 'iu', type: 'final', category: 'final_compound', emoji: '🏊', mnemonic: '游泳游泳 iu iu iu', example_word: '柳树', example_pinyin: 'liǔ shù' },
  { pinyin: 'ie', type: 'final', category: 'final_compound', emoji: '🥥', mnemonic: '椰子椰子 ie ie ie', example_word: '椰子', example_pinyin: 'yē zi' },
  { pinyin: 'üe', type: 'final', category: 'final_compound', emoji: '🌙', mnemonic: '月亮月亮 üe üe üe', example_word: '月亮', example_pinyin: 'yuè liang' },
  { pinyin: 'er', type: 'final', category: 'final_compound', emoji: '👂', mnemonic: '一只耳朵 er er er', example_word: '耳朵', example_pinyin: 'ěr duo' },
  
  // 前鼻韵母
  { pinyin: 'an', type: 'final', category: 'final_front', emoji: '🚪', mnemonic: '天安门 an an an', example_word: '天安门', example_pinyin: 'tiān ān mén' },
  { pinyin: 'en', type: 'final', category: 'final_front', emoji: '🔘', mnemonic: '摁门铃 en en en', example_word: '摁住', example_pinyin: 'èn zhù' },
  { pinyin: 'in', type: 'final', category: 'final_front', emoji: '🌲', mnemonic: '树荫树荫 in in in', example_word: '音乐', example_pinyin: 'yīn yuè' },
  { pinyin: 'un', type: 'final', category: 'final_front', emoji: '🦟', mnemonic: '蚊子蚊子 un un un', example_word: '温水', example_pinyin: 'wēn shuǐ' },
  { pinyin: 'ün', type: 'final', category: 'final_front', emoji: '☁️', mnemonic: '白云白云 ün ün ün', example_word: '白云', example_pinyin: 'bái yún' },
  
  // 后鼻韵母
  { pinyin: 'ang', type: 'final', category: 'final_back', emoji: '🐑', mnemonic: '一只山羊 ang ang ang', example_word: '山羊', example_pinyin: 'shān yáng' },
  { pinyin: 'eng', type: 'final', category: 'final_back', emoji: '💡', mnemonic: '开灯关灯 eng eng eng', example_word: '台灯', example_pinyin: 'tái dēng' },
  { pinyin: 'ing', type: 'final', category: 'final_back', emoji: '🦅', mnemonic: '老鹰老鹰 ing ing ing', example_word: '老鹰', example_pinyin: 'lǎo yīng' },
  { pinyin: 'ong', type: 'final', category: 'final_back', emoji: '🕰️', mnemonic: '大钟大钟 ong ong ong', example_word: '闹钟', example_pinyin: 'nào zhōng' },

  // 整体认读音节 (Overall Recognition) - 16个
  { pinyin: 'zhi', type: 'overall', category: 'overall', emoji: '🕸️', mnemonic: '织网织网 zhi zhi zhi', example_word: '织布', example_pinyin: 'zhī bù' },
  { pinyin: 'chi', type: 'overall', category: 'overall', emoji: '🥄', mnemonic: '吃饭吃饭 chi chi chi', example_word: '吃亏', example_pinyin: 'chī kuī' },
  { pinyin: 'shi', type: 'overall', category: 'overall', emoji: '🦁', mnemonic: '狮子狮子 shi shi shi', example_word: '老师', example_pinyin: 'lǎo shī' },
  { pinyin: 'ri', type: 'overall', category: 'overall', emoji: '🗓️', mnemonic: '日历日历 ri ri ri', example_word: '日记', example_pinyin: 'rì jì' },
  { pinyin: 'zi', type: 'overall', category: 'overall', emoji: '💜', mnemonic: '紫色紫色 zi zi zi', example_word: '写字', example_pinyin: 'xiě zì' },
  { pinyin: 'ci', type: 'overall', category: 'overall', emoji: '🦔', mnemonic: '刺猬刺猬 ci ci ci', example_word: '歌词', example_pinyin: 'gē cí' },
  { pinyin: 'si', type: 'overall', category: 'overall', emoji: '🧶', mnemonic: '蚕丝蚕丝 si si si', example_word: '司机', example_pinyin: 'sī jī' },
  { pinyin: 'yi', type: 'overall', category: 'overall', emoji: '👕', mnemonic: '衣服衣服 yi yi yi', example_word: '阿姨', example_pinyin: 'ā yí' },
  { pinyin: 'wu', type: 'overall', category: 'overall', emoji: '🐦', mnemonic: '乌鸦乌鸦 wu wu wu', example_word: '房屋', example_pinyin: 'fáng wū' },
  { pinyin: 'yu', type: 'overall', category: 'overall', emoji: '🌽', mnemonic: '玉米玉米 yu yu yu', example_word: '玉米', example_pinyin: 'yù mǐ' },
  { pinyin: 'ye', type: 'overall', category: 'overall', emoji: '🌴', mnemonic: '椰树椰树 ye ye ye', example_word: '树叶', example_pinyin: 'shù yè' },
  { pinyin: 'yue', type: 'overall', category: 'overall', emoji: '🌙', mnemonic: '月亮月亮 yue yue yue', example_word: '音乐', example_pinyin: 'yīn yuè' },
  { pinyin: 'yuan', type: 'overall', category: 'overall', emoji: '🏐', mnemonic: '圆圆足球 yuan yuan yuan', example_word: '公园', example_pinyin: 'gōng yuán' },
  { pinyin: 'yin', type: 'overall', category: 'overall', emoji: '🎵', mnemonic: '音乐音乐 yin yin yin', example_word: '因为', example_pinyin: 'yīn wèi' },
  { pinyin: 'yun', type: 'overall', category: 'overall', emoji: '☁️', mnemonic: '白云白云 yun yun yun', example_word: '运气', example_pinyin: 'yùn qì' },
  { pinyin: 'ying', type: 'overall', category: 'overall', emoji: '🦅', mnemonic: '老鹰老鹰 ying ying ying', example_word: '电影', example_pinyin: 'diàn yǐng' }
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

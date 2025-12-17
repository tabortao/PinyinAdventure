export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

export interface Level {
  id: number;
  grade: number;
  chapter: number;
  name: string;
  description: string | null;
  icon?: string;
}

export type QuestionType = 'character' | 'word' | 'sentence';

export interface Question {
  id: number;
  level_id: number;
  type: QuestionType;
  content: string;
  pinyin: string;
  audio_url: string | null;
  hint_emoji?: string;
}

export interface UserProgress {
  id: string | number;
  user_id: string;
  level_id: number;
  stars: number;
  score: number;
  completed_at: string;
}
export interface Mistake {
  id: string | number;
  user_id: string;
  question_id: number;
  wrong_pinyin: string;
  error_count: number;
  last_reviewed_at: string;
  next_review_at: string;
  review_stage: number;
  question?: Question; // Joined
}

export interface PinyinChart {
  id: string;
  category: string; // 'final', 'initial', 'overall'
  group_name: string;
  pinyin: string;
  mnemonic: string;
  emoji: string;
  example_word: string;
  example_pinyin: string;
  sort_order: number;
}

export interface UserPinyinProgress {
  id: string | number;
  user_id: string;
  pinyin_char: string;
  study_count: number;
  is_mastered: boolean;
  last_studied_at: string;
  next_review_at: string;
  mastery_level: number;
}

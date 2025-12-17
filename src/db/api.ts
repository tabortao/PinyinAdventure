import { initDB, seedDatabase } from './localDB';
import { Level, Question, UserProgress, Mistake, PinyinChart, UserPinyinProgress } from '../types/types';

// Initialize DB on module load or first call
// We can expose an init function
export const initializeApp = async () => {
  await seedDatabase();
};

// Levels
export const getLevels = async (grade?: number) => {
  const db = await initDB();
  if (grade) {
    return await db.getAllFromIndex('levels', 'by-grade', grade);
  }
  return await db.getAll('levels');
};

export const getLevelById = async (id: number) => {
  const db = await initDB();
  return await db.get('levels', id) || null;
};

// Questions
export const getQuestionsByLevel = async (levelId: number) => {
  const db = await initDB();
  return await db.getAllFromIndex('questions', 'by-level', levelId);
};

export const getRandomQuestionsByGrade = async (grade: number, type: string, count: number = 10) => {
  const db = await initDB();
  // Get levels for grade
  const levels = await db.getAllFromIndex('levels', 'by-grade', grade);
  if (!levels || levels.length === 0) return [];
  
  // Optimization: use Promise.all
  const questionsPromises = levels.map(l => db.getAllFromIndex('questions', 'by-level', l.id));
  const questionsArrays = await Promise.all(questionsPromises);
  
  let allQuestions: Question[] = [];
  for (const qs of questionsArrays) {
     const filtered = qs.filter(q => q.type === type);
     allQuestions = allQuestions.concat(filtered);
  }

  // Shuffle
  return allQuestions.sort(() => 0.5 - Math.random()).slice(0, count);
};

// Progress
export const getUserProgress = async (userId: string) => {
  const db = await initDB();
  return await db.getAllFromIndex('user_progress', 'by-user', userId);
};

export const saveUserProgress = async (userId: string, levelId: number, stars: number, score: number) => {
  const db = await initDB();
  
  // Find existing
  const index = db.transaction('user_progress').store.index('by-user-level');
  const existing = await index.get([userId, levelId]);

  let newStars = stars;
  let newScore = score;
  let id: string | number | undefined = undefined;

  if (existing) {
    newStars = Math.max(existing.stars, stars);
    newScore = Math.max(existing.score || 0, score);
    id = existing.id;
  }

  const item: UserProgress = {
    id: id as (string | number), // if undefined, autoInc will handle
    user_id: userId,
    level_id: levelId,
    stars: newStars,
    score: newScore,
    completed_at: new Date().toISOString()
  };
  
  // Typescript trick for autoInc id
  if (!id) delete (item as any).id;

  const tx = db.transaction('user_progress', 'readwrite');
  await tx.store.put(item);
  await tx.done;
  
  return item;
};

export const getTotalScore = async (userId: string) => {
  const progress = await getUserProgress(userId);
  return progress.reduce((acc, curr) => acc + (curr.score || 0), 0) || 0;
};

// Mistakes / Ebbinghaus
export const getMistakes = async (userId: string) => {
  const db = await initDB();
  const now = new Date().toISOString();
  
  // Get all mistakes for user
  const mistakes = await db.getAllFromIndex('mistakes', 'by-user', userId);
  
  // Filter due reviews and join question
  const dueMistakes = mistakes.filter(m => m.next_review_at <= now);
  
  // Join question
  // Optimization: parallel fetch
  const results = await Promise.all(dueMistakes.map(async m => {
    const q = await db.get('questions', m.question_id);
    return { ...m, question: q };
  }));
  
  // Sort
  return results.sort((a, b) => a.next_review_at.localeCompare(b.next_review_at));
};

export const recordMistake = async (userId: string, questionId: number, wrongPinyin: string) => {
  const db = await initDB();
  
  const mistakes = await db.getAllFromIndex('mistakes', 'by-user', userId);
  const existing = mistakes.find(m => m.question_id === questionId);

  const tx = db.transaction('mistakes', 'readwrite');
  
  if (existing) {
    existing.wrong_pinyin = wrongPinyin;
    existing.error_count += 1;
    existing.review_stage = 0;
    existing.last_reviewed_at = new Date().toISOString();
    existing.next_review_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await tx.store.put(existing);
  } else {
    await tx.store.add({
      user_id: userId,
      question_id: questionId,
      wrong_pinyin: wrongPinyin,
      review_stage: 0,
      next_review_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      error_count: 1
    } as any);
  }
  await tx.done;
};

export const reviewMistakeSuccess = async (mistakeId: string | number, currentStage: number) => {
  const db = await initDB();
  const intervals = [5, 30, 720, 1440, 2880, 5760, 10080, 21600];
  const nextStage = currentStage + 1;
  let minutesToAdd = 30 * 24 * 60; // default long time
  
  if (nextStage < intervals.length) {
    minutesToAdd = intervals[nextStage];
  }

  // Handle ID type
  const id = Number(mistakeId);
  const mistake = await db.get('mistakes', id);
  if (!mistake) return;

  mistake.review_stage = nextStage;
  mistake.last_reviewed_at = new Date().toISOString();
  mistake.next_review_at = new Date(Date.now() + minutesToAdd * 60 * 1000).toISOString();

  await db.put('mistakes', mistake);
};

// Pinyin Study API

export const getPinyinCharts = async () => {
  const db = await initDB();
  return await db.getAllFromIndex('pinyin_charts', 'by-sort');
};

export const getUserPinyinProgress = async (userId: string) => {
  const db = await initDB();
  return await db.getAllFromIndex('user_pinyin_progress', 'by-user', userId);
};

export const updatePinyinProgress = async (userId: string, pinyinId: string, isMastered: boolean) => {
  const db = await initDB();
  
  const index = db.transaction('user_pinyin_progress').store.index('by-user-pinyin');
  const existing = await index.get([userId, pinyinId]);

  const now = new Date();
  const nextReview = new Date();
  if (isMastered) {
    nextReview.setDate(now.getDate() + 3);
  } else {
    nextReview.setDate(now.getDate() + 1);
  }

  const tx = db.transaction('user_pinyin_progress', 'readwrite');

  if (existing) {
    existing.study_count += 1;
    existing.is_mastered = isMastered;
    existing.last_studied_at = now.toISOString();
    existing.next_review_at = nextReview.toISOString();
    existing.mastery_level = isMastered ? Math.min(existing.mastery_level + 1, 5) : Math.max(existing.mastery_level - 1, 0);
    await tx.store.put(existing);
  } else {
    await tx.store.add({
      user_id: userId,
      pinyin_char: pinyinId,
      study_count: 1,
      is_mastered: isMastered,
      last_studied_at: now.toISOString(),
      next_review_at: nextReview.toISOString(),
      mastery_level: isMastered ? 1 : 0
    } as any);
  }
  await tx.done;
  return true;
};

export const getPinyinReviewList = async (userId: string) => {
  const db = await initDB();
  const now = new Date().toISOString();
  
  const allProgress = await db.getAllFromIndex('user_pinyin_progress', 'by-user', userId);
  
  // Filter
  const due = allProgress.filter(p => !p.is_mastered || p.next_review_at <= now);
  
  // Limit
  const sliced = due.slice(0, 20);
  
  // Join
  const results = await Promise.all(sliced.map(async p => {
    const chart = await db.get('pinyin_charts', p.pinyin_char);
    if (!chart) return null;
    return {
      ...chart,
      progress_id: p.id,
      study_count: p.study_count,
      is_mastered: p.is_mastered
    };
  }));
  
  return results.filter(r => r !== null) as (PinyinChart & { progress_id: string, study_count: number, is_mastered: boolean })[];
};

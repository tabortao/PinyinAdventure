import { initDB, seedDatabase } from './localDB';
import { Level, Question, UserProgress, Mistake, PinyinChart, UserPinyinProgress, UserQuizProgress } from '../types/types';

// Initialize DB on module load or first call
import { AIConfig, generateReviewQuestions } from '../lib/ai';
// We can expose an init function
export const initializeApp = async () => {
  await seedDatabase();
};

export const getTotalScore = async (userId: string) => {
  const db = await initDB();
  const progress = await db.getAllFromIndex('user_progress', 'by-user', userId);
  const quizProgress = await db.getAllFromIndex('user_quiz_progress', 'by-user', userId);

  let total = 0;
  progress.forEach(p => total += (p.score || 0));
  quizProgress.forEach(p => total += (p.score || 0));
  
  return total;
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
export const addPracticeScore = async (userId: string, points: number) => {
  const db = await initDB();
  const PRACTICE_LEVEL_ID = 99999;
  
  const index = db.transaction('user_progress').store.index('by-user-level');
  const existing = await index.get([userId, PRACTICE_LEVEL_ID]);

  let newScore = points;
  let id: string | number | undefined = undefined;

  if (existing) {
    newScore = (existing.score || 0) + points;
    id = existing.id;
  }

  const item: UserProgress = {
    id: id as (string | number),
    user_id: userId,
    level_id: PRACTICE_LEVEL_ID,
    stars: 3,
    score: newScore,
    completed_at: new Date().toISOString()
  };
  
  if (!id) delete (item as any).id;

  const tx = db.transaction('user_progress', 'readwrite');
  await tx.store.put(item);
  await tx.done;
  
  return item;
};

export const getQuestionsByLevel = async (levelId: number, type?: string) => {
  const db = await initDB();
  let questions = await db.getAllFromIndex('questions', 'by-level', levelId);
  if (type) {
    questions = questions.filter(q => q.type === type);
  }
  return questions;
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

export const getUserQuizProgress = async (userId: string) => {
  const db = await initDB();
  return await db.getAllFromIndex('user_quiz_progress', 'by-user', userId);
};

export const saveUserQuizProgress = async (userId: string, levelId: number, score: number) => {
  const db = await initDB();
  
  // Find existing
  const index = db.transaction('user_quiz_progress').store.index('by-user-level');
  const existing = await index.get([userId, levelId]);

  let newScore = score;
  let id: string | number | undefined = undefined;

  if (existing) {
    newScore = Math.max(existing.score || 0, score);
    id = existing.id;
  }

  const item: UserQuizProgress = {
    id: id as (string | number),
    user_id: userId,
    level_id: levelId,
    score: newScore,
    completed_at: new Date().toISOString()
  };
  
  if (!id) delete (item as any).id;

  const tx = db.transaction('user_quiz_progress', 'readwrite');
  await tx.store.put(item);
  await tx.done;
  
  return item;
};

export const getQuizQuestions = async (levelId: number, count: number = 10, mode: string = 'character') => {
  const db = await initDB();
  // Get questions for this level
  const questions = await db.getAllFromIndex('questions', 'by-level', levelId);
  
  // Filter by mode
  // If mode is 'all', we allow character and word (exclude sentence for quiz?)
  // User said "Look and Spell doesn't need sentence mode".
  let candidates = [];
  if (mode === 'all') {
      candidates = questions.filter(q => q.type !== 'sentence');
  } else {
      candidates = questions.filter(q => q.type === mode);
  }

  // If not enough, fetch from same grade levels
  if (candidates.length < count) {
     const level = await db.get('levels', levelId);
     if (level) {
       const levels = await db.getAllFromIndex('levels', 'by-grade', level.grade);
       const otherLevelIds = levels.map(l => l.id).filter(id => id !== levelId);
       
       for (const lId of otherLevelIds) {
         if (candidates.length >= count) break;
         const qs = await db.getAllFromIndex('questions', 'by-level', lId);
         if (mode === 'all') {
             candidates = candidates.concat(qs.filter(q => q.type !== 'sentence'));
         } else {
             candidates = candidates.concat(qs.filter(q => q.type === mode));
         }
       }
     }
  }

  // Deduplicate by ID
  candidates = Array.from(new Map(candidates.map(item => [item.id, item])).values());
  
  // Shuffle and pick count
  candidates = candidates.sort(() => 0.5 - Math.random()).slice(0, count);

  // For each question, generate 3 distractors
  const allLevelsQuestions = await db.getAll('questions'); 
  
  // Filter pool based on mode to ensure distractors make sense (e.g. don't mix word pinyin with char pinyin if strict, 
  // but if mode is 'all', maybe mixed is okay? 
  // Actually, for a specific question of type 'character', distractors should probably be 'character' pinyins.
  // But to keep it simple, if mode is 'all', we use 'all' pool (minus sentences).
  let poolSource = allLevelsQuestions;
  if (mode === 'all') {
      poolSource = allLevelsQuestions.filter(q => q.type !== 'sentence');
  } else {
      poolSource = allLevelsQuestions.filter(q => q.type === mode);
  }
  
  const pinyinPool = Array.from(new Set(poolSource.map(q => q.pinyin).filter(p => p)));

  const results = candidates.map(q => {
    const correct = q.pinyin;
    // ... same similarity logic ...
    const similarity = (target: string, candidate: string) => {
        if (!target || !candidate) return 0;
        let score = 0;
        if (target.length === candidate.length) score += 2;
        if (target[0] === candidate[0]) score += 1;
        if (target[target.length-1] === candidate[candidate.length-1]) score += 1;
        if (target.includes(candidate) || candidate.includes(target)) score += 1;
        return score;
    };

    let others = pinyinPool.filter(p => p !== correct);
    // Optimization: if we have mixed types, maybe we should prefer distractors of same length/type?
    // The similarity function rewards same length, so it naturally picks better distractors.
    
    const scored = others.map(p => ({ p, score: similarity(correct, p) }));
    
    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return 0.5 - Math.random();
    });
    
    const topCandidates = scored.slice(0, 10);
    const distractors = topCandidates.sort(() => 0.5 - Math.random()).slice(0, 3).map(i => i.p);
    
    while (distractors.length < 3) {
        distractors.push('ā'); 
    }

    const options = [correct, ...distractors].sort(() => 0.5 - Math.random());
    
    return {
      ...q,
      options
    };
  });
  
  return results;
};

export const getAIQuestions = async (userId: string, count: number = 10, aiConfig?: AIConfig) => {
  const db = await initDB();
  
  // 1. Fetch user's mistakes (Weaknesses)
  const mistakes = await db.getAllFromIndex('mistakes', 'by-user', userId);
  
  // Sort by error_count desc
  mistakes.sort((a, b) => b.error_count - a.error_count);
  
  // Pick top mistakes
  const topMistakes = mistakes.slice(0, 5);
  const questionIds = topMistakes.map(m => m.question_id);
  
  // Fetch these questions
  let candidates: Question[] = [];
  const mistakeQuestions: { question: Question, wrong_pinyin: string }[] = [];

  for (const m of topMistakes) {
      const q = await db.get('questions', m.question_id);
      if (q) {
        candidates.push(q);
        mistakeQuestions.push({ question: q, wrong_pinyin: m.wrong_pinyin });
      }
  }
  
  // 2. AI Generation (if configured)
  if (aiConfig && aiConfig.apiKey && mistakeQuestions.length > 0) {
      try {
          // Generate 3-5 new questions based on mistakes
          const aiCount = Math.min(5, Math.max(2, mistakeQuestions.length));
          const aiQuestions = await generateReviewQuestions(mistakeQuestions, aiConfig, aiCount);
          if (aiQuestions && aiQuestions.length > 0) {
              candidates = [...candidates, ...aiQuestions];
          }
      } catch (e) {
          console.error("AI Generation failed, falling back to local questions", e);
      }
  }

  // 3. Fill the rest with random questions (Strengthen/Explore)
  // Ensure we have at least 'count' questions if possible, but don't force duplicates if DB is small
  let needed = count - candidates.length;
  if (needed > 0) {
      const allQuestions = await db.getAll('questions');
      const filtered = allQuestions.filter(q => q.type === 'character' && !questionIds.includes(q.id));
      const randomPicks = filtered.sort(() => 0.5 - Math.random()).slice(0, needed);
      candidates = [...candidates, ...randomPicks];
  }
  
  // Deduplicate and Shuffle
  // Use a map to deduplicate by content (since AI might generate similar content to existing ones)
  const uniqueMap = new Map();
  candidates.forEach(c => uniqueMap.set(c.content, c));
  candidates = Array.from(uniqueMap.values());
  
  candidates = candidates.sort(() => 0.5 - Math.random()).slice(0, count);
  
  // 4. Generate Options
  const allLevelsQuestions = await db.getAll('questions');
  const pinyinPool = Array.from(new Set(allLevelsQuestions.map(q => q.pinyin).filter(p => p)));
  
  const results = candidates.map(q => {
    const correct = q.pinyin;
    const similarity = (target: string, candidate: string) => {
        if (!target || !candidate) return 0;
        let score = 0;
        if (target.length === candidate.length) score += 2;
        if (target[0] === candidate[0]) score += 1;
        if (target[target.length-1] === candidate[candidate.length-1]) score += 1;
        if (target.includes(candidate) || candidate.includes(target)) score += 1;
        return score;
    };

    let others = pinyinPool.filter(p => p !== correct);
    const scored = others.map(p => ({ p, score: similarity(correct, p) }));
    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return 0.5 - Math.random();
    });
    
    const topCandidates = scored.slice(0, 10);
    const distractors = topCandidates.sort(() => 0.5 - Math.random()).slice(0, 3).map(i => i.p);
    
    while (distractors.length < 3) {
        distractors.push('ā'); 
    }

    const options = [correct, ...distractors].sort(() => 0.5 - Math.random());
    
    return {
      ...q,
      options
    };
  });
  
  return results;
};


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
  return results.filter(r => r.question).sort((a, b) => a.next_review_at.localeCompare(b.next_review_at));
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

export const getFishingQuestions = async (difficulty: number, count: number = 10) => {
  const db = await initDB();
  const allQuestions = await db.getAll('questions');
  const candidates = allQuestions.filter(q => q.type === 'character'); 

  const isLevel1 = (pinyin: string) => {
    if (!pinyin) return false;
    const base = pinyin.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return /^[bpmfdtnlgkhjqxzhchshrzcsyw]?[aoeiuüv]$/i.test(base);
  };

  const isLevel2 = (pinyin: string) => {
    if (!pinyin) return false;
    const base = pinyin.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return /([ae]i|ui|ao|ou|iu|ie|ve|er|[aeiuv]n)$/i.test(base) && !/(ang|eng|ing|ong)$/i.test(base);
  };

  const isLevel3 = (pinyin: string) => {
    if (!pinyin) return false;
    const base = pinyin.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const overall = ['zhi', 'chi', 'shi', 'ri', 'zi', 'ci', 'si', 'yi', 'wu', 'yu', 'ye', 'yue', 'yuan', 'yin', 'yun', 'ying'];
    return /(ang|eng|ing|ong)$/i.test(base) || overall.includes(base);
  };

  let filtered: Question[] = [];
  if (difficulty === 1) {
      filtered = candidates.filter(q => isLevel1(q.pinyin));
      if (filtered.length < count) filtered = candidates; 
  } else if (difficulty === 2) {
      filtered = candidates.filter(q => isLevel2(q.pinyin));
      if (filtered.length < count) filtered = candidates;
  } else {
      filtered = candidates.filter(q => isLevel3(q.pinyin));
      if (filtered.length < count) filtered = candidates;
  }
  
  return filtered.sort(() => 0.5 - Math.random()).slice(0, count);
};

// Stats
export const updateDailyStats = async (userId: string, correctDelta: number, totalDelta: number, durationDelta: number = 0) => {
    const db = await initDB();
    const today = new Date().toISOString().split('T')[0];
    const tx = db.transaction('daily_stats', 'readwrite');
    const index = tx.store.index('by-user-date');
    const existing = await index.get([userId, today]);
    
    if (existing) {
        existing.correct_count += correctDelta;
        existing.total_count += totalDelta;
        existing.study_duration += durationDelta;
        await tx.store.put(existing);
    } else {
        await tx.store.add({
            user_id: userId,
            date: today,
            correct_count: correctDelta,
            total_count: totalDelta,
            study_duration: durationDelta
        });
    }
    await tx.done;
};

export const getUserStats = async (userId: string) => {
    const db = await initDB();
    return await db.getAllFromIndex('daily_stats', 'by-user', userId);
};

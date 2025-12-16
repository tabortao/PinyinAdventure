import { supabase } from './supabase';
import { Level, Question, UserProgress, Mistake, PinyinChart, UserPinyinProgress } from '../types/types';

// Levels
export const getLevels = async (grade?: number) => {
  let query = supabase.from('levels').select('*').order('grade').order('chapter');
  if (grade) {
    query = query.eq('grade', grade);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Level[];
};

export const getLevelById = async (id: number) => {
  const { data, error } = await supabase.from('levels').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Level | null;
};

// Questions
export const getQuestionsByLevel = async (levelId: number) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('level_id', levelId)
    .order('id');
  if (error) throw error;
  return data as Question[];
};

export const getRandomQuestionsByGrade = async (grade: number, type: string, count: number = 10) => {
  // First get all level IDs for this grade
  const { data: levels } = await supabase
    .from('levels')
    .select('id')
    .eq('grade', grade);
  
  if (!levels || levels.length === 0) return [];
  const levelIds = levels.map(l => l.id);

  // Then fetch questions of specific type from these levels
  // Note: Random ordering in SQL via supabase-js is tricky without RPC, 
  // so we'll fetch a batch and shuffle client-side or use a simple randomizer if data is huge.
  // For MVP, fetching 'character' type might be large, but 'sentence' is manageable.
  // Let's use a limit.
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('level_id', levelIds)
    .eq('type', type)
    .limit(50); // Fetch a pool to randomize from

  if (error) throw error;
  
  if (!data) return [];

  // Shuffle and slice
  return data.sort(() => 0.5 - Math.random()).slice(0, count) as Question[];
};

// Progress
export const getUserProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data as UserProgress[];
};

export const saveUserProgress = async (userId: string, levelId: number, stars: number, score: number) => {
  // First check existing progress to not overwrite higher score/stars if we want strict max logic
  // But requirement says "re-play score not cumulative", usually implies we just update the record with latest or max.
  // Let's implement MAX logic: Keep highest stars and highest score independently or together.
  // Standard game logic: High Score.
  
  const { data: existing } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('level_id', levelId)
    .maybeSingle();

  let newStars = stars;
  let newScore = score;

  if (existing) {
    newStars = Math.max(existing.stars, stars);
    newScore = Math.max(existing.score || 0, score);
  }

  const { data, error } = await supabase
    .from('user_progress')
    .upsert({ 
      user_id: userId, 
      level_id: levelId, 
      stars: newStars, 
      score: newScore,
      completed_at: new Date().toISOString() 
    }, { onConflict: 'user_id,level_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data as UserProgress;
};

export const getTotalScore = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('score')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data?.reduce((acc, curr) => acc + (curr.score || 0), 0) || 0;
};

// Mistakes / Ebbinghaus
export const getMistakes = async (userId: string) => {
  const { data, error } = await supabase
    .from('mistakes')
    .select('*, question:questions(*)')
    .eq('user_id', userId)
    .lte('next_review_at', new Date().toISOString()) // Only due reviews
    .order('next_review_at');
  
  if (error) throw error;
  return data as Mistake[];
};

export const recordMistake = async (userId: string, questionId: number, wrongPinyin: string) => {
  // Check if exists
  const { data: existing } = await supabase
    .from('mistakes')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (existing) {
    // Reset stage to 0
    const { error } = await supabase
      .from('mistakes')
      .update({
        wrong_pinyin: wrongPinyin,
        error_count: existing.error_count + 1,
        review_stage: 0,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 mins later
      })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    // Create new
    const { error } = await supabase
      .from('mistakes')
      .insert({
        user_id: userId,
        question_id: questionId,
        wrong_pinyin: wrongPinyin,
        review_stage: 0,
        next_review_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      });
    if (error) throw error;
  }
};

export const reviewMistakeSuccess = async (mistakeId: string, currentStage: number) => {
  // Ebbinghaus intervals (in minutes): 5, 30, 720 (12h), 1440 (1d), 2880 (2d), 5760 (4d), 10080 (7d), 21600 (15d)
  const intervals = [5, 30, 720, 1440, 2880, 5760, 10080, 21600];
  const nextStage = currentStage + 1;
  
  if (nextStage >= intervals.length) {
    // Mastered! Maybe delete or archive? For now, push far into future (30 days)
    const { error } = await supabase
      .from('mistakes')
      .update({
        review_stage: nextStage,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', mistakeId);
    if (error) throw error;
  } else {
    const minutesToAdd = intervals[nextStage];
    const { error } = await supabase
      .from('mistakes')
      .update({
        review_stage: nextStage,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: new Date(Date.now() + minutesToAdd * 60 * 1000).toISOString()
      })
      .eq('id', mistakeId);
    if (error) throw error;
  }
};

// Pinyin Study API

export const getPinyinCharts = async () => {
  const { data, error } = await supabase
    .from('pinyin_charts')
    .select('*')
    .order('sort_order');
  
  if (error) {
    console.error('Error fetching pinyin charts:', error);
    return [];
  }
  return data as PinyinChart[];
};

export const getUserPinyinProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_pinyin_progress')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching pinyin progress:', error);
    return [];
  }
  return data as UserPinyinProgress[];
};

export const updatePinyinProgress = async (userId: string, pinyinId: string, isMastered: boolean) => {
  // First check if record exists
  const { data: existing } = await supabase
    .from('user_pinyin_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('pinyin_char', pinyinId)
    .maybeSingle();

  const now = new Date();
  // Simple review interval logic (can be enhanced)
  const nextReview = new Date();
  if (isMastered) {
    nextReview.setDate(now.getDate() + 3); // Review in 3 days
  } else {
    nextReview.setDate(now.getDate() + 1); // Review tomorrow
  }

  if (existing) {
    const { error } = await supabase
      .from('user_pinyin_progress')
      .update({
        study_count: existing.study_count + 1,
        is_mastered: isMastered,
        last_studied_at: now.toISOString(),
        next_review_at: nextReview.toISOString(),
        mastery_level: isMastered ? Math.min(existing.mastery_level + 1, 5) : Math.max(existing.mastery_level - 1, 0)
      })
      .eq('id', existing.id);
    return !error;
  } else {
    const { error } = await supabase
      .from('user_pinyin_progress')
      .insert({
        user_id: userId,
        pinyin_char: pinyinId,
        study_count: 1,
        is_mastered: isMastered,
        last_studied_at: now.toISOString(),
        next_review_at: nextReview.toISOString(),
        mastery_level: isMastered ? 1 : 0
      });
    return !error;
  }
};

export const getPinyinReviewList = async (userId: string) => {
  const now = new Date().toISOString();
  
  // Get items due for review or not mastered
  const { data, error } = await supabase
    .from('user_pinyin_progress')
    .select('*, pinyin_chart:pinyin_charts(*)')
    .eq('user_id', userId)
    .or(`is_mastered.eq.false,next_review_at.lte.${now}`)
    .limit(20);

  if (error) {
    console.error('Error fetching review list:', error);
    return [];
  }
  
  // Transform to include pinyin details directly
  return data.map((item: any) => ({
    ...item.pinyin_chart,
    progress_id: item.id,
    study_count: item.study_count,
    is_mastered: item.is_mastered
  })) as (PinyinChart & { progress_id: string, study_count: number, is_mastered: boolean })[];
};
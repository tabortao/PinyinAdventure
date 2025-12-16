import { supabase } from './supabase';
import { Level, Question, UserProgress, Mistake } from '../types/types';

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

// Progress
export const getUserProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data as UserProgress[];
};

export const saveUserProgress = async (userId: string, levelId: number, stars: number) => {
  // Upsert progress
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({ user_id: userId, level_id: levelId, stars, completed_at: new Date().toISOString() }, { onConflict: 'user_id,level_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data as UserProgress;
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

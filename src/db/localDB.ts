import { openDB, DBSchema, IDBPDatabase } from 'idb';
// import { supabase } from './supabase'; // Removed for offline mode
import { Level, Question, UserProgress, Mistake, PinyinChart, UserPinyinProgress, UserQuizProgress } from '../types/types';

interface AppDB extends DBSchema {
  levels: {
    key: number;
    value: Level;
    indexes: { 'by-grade': number };
  };
  questions: {
    key: number;
    value: Question;
    indexes: { 'by-level': number; 'by-type': string };
  };
  pinyin_charts: {
    key: string;
    value: PinyinChart;
    indexes: { 'by-category': string; 'by-sort': number };
  };
  user_progress: {
    key: number;
    value: UserProgress;
    indexes: { 'by-user-level': [string, number]; 'by-user': string };
  };
  mistakes: {
    key: number;
    value: Mistake;
    indexes: { 'by-user': string; 'by-review-time': string };
  };
  user_pinyin_progress: {
    key: number;
    value: UserPinyinProgress;
    indexes: { 'by-user-pinyin': [string, string]; 'by-user': string };
  };
  user_quiz_progress: {
    key: number;
    value: UserQuizProgress;
    indexes: { 'by-user-level': [string, number]; 'by-user': string };
  };
  daily_stats: {
    key: number;
    value: {
        id?: number;
        user_id: string;
        date: string;
        correct_count: number;
        total_count: number;
        study_duration: number;
    };
    indexes: { 'by-user-date': [string, string]; 'by-user': string };
  };
}

const DB_NAME = 'pinyin-game-db';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<AppDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Levels
        if (!db.objectStoreNames.contains('levels')) {
          const store = db.createObjectStore('levels', { keyPath: 'id' });
          store.createIndex('by-grade', 'grade');
        }
        // Questions
        if (!db.objectStoreNames.contains('questions')) {
          const store = db.createObjectStore('questions', { keyPath: 'id' });
          store.createIndex('by-level', 'level_id');
          store.createIndex('by-type', 'type');
        }
        // Pinyin Charts
        if (!db.objectStoreNames.contains('pinyin_charts')) {
          const store = db.createObjectStore('pinyin_charts', { keyPath: 'id' });
          store.createIndex('by-category', 'category');
          store.createIndex('by-sort', 'sort_order');
        }
        // User Progress
        if (!db.objectStoreNames.contains('user_progress')) {
          const store = db.createObjectStore('user_progress', { keyPath: 'id', autoIncrement: true });
          store.createIndex('by-user-level', ['user_id', 'level_id'], { unique: true });
          store.createIndex('by-user', 'user_id');
        }
        // Mistakes
        if (!db.objectStoreNames.contains('mistakes')) {
          const store = db.createObjectStore('mistakes', { keyPath: 'id', autoIncrement: true });
          store.createIndex('by-user', 'user_id');
          store.createIndex('by-review-time', 'next_review_at');
        }
        // User Pinyin Progress
        if (!db.objectStoreNames.contains('user_pinyin_progress')) {
          const store = db.createObjectStore('user_pinyin_progress', { keyPath: 'id', autoIncrement: true });
          store.createIndex('by-user-pinyin', ['user_id', 'pinyin_char'], { unique: true });
          store.createIndex('by-user', 'user_id');
        }
        // User Quiz Progress (Added in v2)
        if (!db.objectStoreNames.contains('user_quiz_progress')) {
          const store = db.createObjectStore('user_quiz_progress', { keyPath: 'id', autoIncrement: true });
          store.createIndex('by-user-level', ['user_id', 'level_id'], { unique: true });
          store.createIndex('by-user', 'user_id');
        }
        // Daily Stats (Added in v3)
        if (!db.objectStoreNames.contains('daily_stats')) {
          const store = db.createObjectStore('daily_stats', { keyPath: 'id', autoIncrement: true });
          store.createIndex('by-user-date', ['user_id', 'date'], { unique: true });
          store.createIndex('by-user', 'user_id');
        }
      },
    });
  }
  return dbPromise;
};

import { generateQuizData, PINYIN_DATA } from './seedData';
import { generateFishingGameData } from './fishingData';

// Seeding function
export const seedDatabase = async () => {
  const db = await initDB();
  
  const charCount = await db.countFromIndex('questions', 'by-type', 'character');
  
  // Always update Pinyin Charts to ensure latest data (mnemonics, categories)
  console.log('Seeding Pinyin Data...');
  {
    const tx = db.transaction('pinyin_charts', 'readwrite');
    for (const p of PINYIN_DATA) {
        await tx.store.put({
            id: p.pinyin,
            pinyin: p.pinyin,
            type: p.type,
            category: p.category || p.type, 
            emoji: p.emoji,
            group_name: '',
            mnemonic: p.mnemonic || '',
            example_word: p.example_word || '',
            example_pinyin: p.example_pinyin || '',
            description: '',
            audio_url: '',
            sort_order: 0 
        } as PinyinChart);
    }
    await tx.done;
  }
  
  // Seed Quiz Data if missing
  if (charCount < 100) { // Increased threshold to ensure we check for fishing data
      console.log('Seeding Quiz Data...');
      const { levels, questions } = generateQuizData();
  
      // Add Levels if they don't exist
      {
        const tx = db.transaction('levels', 'readwrite');
        for (const l of levels) {
          const existing = await tx.store.get(l.id);
          if (!existing) {
             await tx.store.add(l);
          }
        }
        await tx.done;
      }
      
      // Add Questions
      {
        const tx = db.transaction('questions', 'readwrite');
        for (const q of questions) {
           const existing = await tx.store.get(q.id);
           if (!existing) {
              await tx.store.add(q);
           }
        }
        await tx.done;
      }
  }

  // Seed Fishing Data
  const fishingLevel = await db.get('levels', 20001);
  if (!fishingLevel) {
      console.log('Seeding Fishing Game Data...');
      const { levels, questions } = generateFishingGameData();
      
      const tx = db.transaction(['levels', 'questions'], 'readwrite');
      const lStore = tx.objectStore('levels');
      const qStore = tx.objectStore('questions');
      
      for (const l of levels) {
          await lStore.put(l);
      }
      for (const q of questions) {
          await qStore.put(q);
      }
      await tx.done;
  }
  
  console.log('Database seeded successfully.');
};

// Export and Import helpers
export const exportData = async (userId: string) => {
  const db = await initDB();
  const progress = await db.getAllFromIndex('user_progress', 'by-user', userId);
  const mistakes = await db.getAllFromIndex('mistakes', 'by-user', userId);
  const pinyinProgress = await db.getAllFromIndex('user_pinyin_progress', 'by-user', userId);
  const quizProgress = await db.getAllFromIndex('user_quiz_progress', 'by-user', userId);
  const dailyStats = await db.getAllFromIndex('daily_stats', 'by-user', userId);

  return JSON.stringify({
    user_progress: progress,
    mistakes: mistakes,
    user_pinyin_progress: pinyinProgress,
    user_quiz_progress: quizProgress,
    daily_stats: dailyStats,
    version: 1,
    exported_at: new Date().toISOString()
  });
};

export const importData = async (json: string, userId: string) => {
  try {
    const data = JSON.parse(json);
    const db = await initDB();

    if (data.user_progress && Array.isArray(data.user_progress)) {
      const tx = db.transaction('user_progress', 'readwrite');
      // Clear existing for this user? Or merge?
      // Let's merge/overwrite
      for (const item of data.user_progress) {
        // Ensure user_id matches current user if we want strictness, 
        // but user might want to import another's data. 
        // We will overwrite user_id to current user to be safe.
        item.user_id = userId;
        // Delete id to avoid key collision if autoIncrement, or keep it if we want to restore exact state?
        // Since id is autoInc, better delete it and let DB assign new, OR use put directly.
        // But `put` needs key.
        // Let's assume we want to overwrite based on logical keys (user_id, level_id)
        // Check if exists
        const index = tx.store.index('by-user-level');
        const existing = await index.get([userId, item.level_id]);
        if (existing) {
          item.id = existing.id;
        } else {
          delete item.id;
        }
        await tx.store.put(item);
      }
      await tx.done;
    }

    if (data.mistakes && Array.isArray(data.mistakes)) {
       const tx = db.transaction('mistakes', 'readwrite');
       // For mistakes, logical key is (user_id, question_id) usually, but schema has next_review_at index
       // Currently `mistakes` table doesn't have a unique constraint on question_id in my schema definition above?
       // Let's check api.ts `recordMistake`: it checks `maybeSingle`.
       // So logical key is user_id + question_id.
       // I should probably add an index for that to make it easier, but I can scan.
       // Or just clear all mistakes for user and re-add. That's safer for import.
       
       // Let's clear user's mistakes first
       // Index scan delete is hard in IDB without range delete.
       // Easier to just put.
       for (const item of data.mistakes) {
         item.user_id = userId;
         // Find existing
         // Iterate cursor? Too slow.
         // Let's just put. If duplicate question_id, logic in app handles it. 
         // But for IDB import, better to be clean.
         delete item.id; // Generate new IDs
         await tx.store.put(item);
       }
       await tx.done;
    }

    if (data.user_pinyin_progress && Array.isArray(data.user_pinyin_progress)) {
      const tx = db.transaction('user_pinyin_progress', 'readwrite');
      for (const item of data.user_pinyin_progress) {
        item.user_id = userId;
        const index = tx.store.index('by-user-pinyin');
        const existing = await index.get([userId, item.pinyin_char]);
        if (existing) {
          item.id = existing.id;
        } else {
          delete item.id;
        }
        await tx.store.put(item);
      }
      await tx.done;
    }

    if (data.user_quiz_progress && Array.isArray(data.user_quiz_progress)) {
      const tx = db.transaction('user_quiz_progress', 'readwrite');
      for (const item of data.user_quiz_progress) {
        item.user_id = userId;
        const index = tx.store.index('by-user-level');
        const existing = await index.get([userId, item.level_id]);
        if (existing) {
          item.id = existing.id;
        } else {
          delete item.id;
        }
        await tx.store.put(item);
      }
      await tx.done;
    }
    
    if (data.daily_stats && Array.isArray(data.daily_stats)) {
      const tx = db.transaction('daily_stats', 'readwrite');
      for (const item of data.daily_stats) {
        item.user_id = userId;
        const index = tx.store.index('by-user-date');
        const existing = await index.get([userId, item.date]);
        if (existing) {
          item.id = existing.id;
        } else {
          delete item.id;
        }
        await tx.store.put(item);
      }
      await tx.done;
    }
    
    return true;
  } catch (e) {
    console.error('Import failed', e);
    return false;
  }
};

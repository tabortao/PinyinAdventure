import { Question, Level } from '../types/types';
import { getQuestionsByLevel } from './api';

export const getFishingQuestions = async (levelId: number, count: number = 10): Promise<Question[]> => {
    // In our implementation, fishing questions are standard questions
    // But we might want to ensure they are from the correct fishing levels
    // The GamePage already calls getQuestionsByLevel(levelId)
    // So this helper is just an alias for now, or could include specific logic
    return getQuestionsByLevel(levelId);
};
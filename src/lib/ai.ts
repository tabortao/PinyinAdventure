import { Question } from '../types/types';

export interface AIConfig {
  host: string;
  apiKey: string;
  model: string;
}

export const generateReviewQuestions = async (
  mistakes: { question: Question, wrong_pinyin: string }[],
  config: AIConfig,
  count: number = 5
): Promise<Question[]> => {
  if (!config.apiKey || !config.host) {
    throw new Error('AI配置缺失');
  }

  const mistakeText = mistakes.map(m => 
    `${m.question.content} (正确: ${m.question.pinyin}, 误读: ${m.wrong_pinyin})`
  ).join(', ');

  const prompt = `
你是一个中文拼音教学助手。用户的易错词如下：${mistakeText}。
请基于这些易错字，生成 ${count} 个新的练习题目。
可以是包含这些字的词语或短句。
请返回纯 JSON 数组，格式如下：
[
  { "content": "词语或句子", "pinyin": "ci2 yu3 huo4 ju4 zi" }
]
注意：
1. pinyin 字段必须使用数字声调（如 zhong1 guo2）。
2. content 字段必须是中文。
3. 难度适合小学生。
4. 只返回JSON，不要有markdown标记。
`;

  try {
    const response = await fetch(`${config.host}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`AI Request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON
    let parsed: any[] = [];
    try {
      // Handle markdown code blocks if present
      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI 返回格式错误");
    }

    // Convert to Question type
    return parsed.map((item: any, index: number) => ({
      id: 90000 + index + Date.now(), // Temp ID
      level_id: -1,
      type: item.content.length === 1 ? 'character' : (item.content.length < 5 ? 'word' : 'sentence'),
      content: item.content,
      pinyin: item.pinyin,
      audio_url: null,
      hint_emoji: '🤖'
    }));

  } catch (error) {
    console.error("AI Generation Error:", error);
    return [];
  }
};

export async function queryDeepSeek(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  onStream?: (chunk: string) => void
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';

  if (!apiKey) {
    return '⚠️ DeepSeek API 密钥未配置，请在 .env.local 中设置 DEEPSEEK_API_KEY。';
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API 错误 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '抱歉，AI 暂时无法回答。';
  } catch (error) {
    console.error('DeepSeek API call failed:', error);
    return `⚠️ AI 服务暂时不可用: ${error instanceof Error ? error.message : '未知错误'}`;
  }
}

export function buildSystemPrompt(context?: string): string {
  return `你是一个专业的数据库学习助手，帮助大学生学习和理解数据库知识。

你的能力：
1. 回答数据库概念问题（SQL、关系模型、事务、索引、范式等）
2. 解释 SQL 查询的写法、优化和原理
3. 出练习题并讲解答案
4. 根据上下文进行辅导式教学

回答风格：
- 简明扼要，适合大学生理解
- 用中文回答
- 适当用例子辅助说明
- 遇到复杂概念时先讲核心，再展开细节

${context ? `当前学习场景：${context}` : ''}`;
}

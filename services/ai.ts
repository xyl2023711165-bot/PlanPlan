import { Task } from '@/types';
import { ApiConfig } from './storage';

export const PROVIDERS = {
  siliconflow: {
    id: 'siliconflow',
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: [
      'Pro/MiniMaxAI/MiniMax-M2.5',
      'Qwen/Qwen2.5-7B-Instruct',
      'Qwen/Qwen2.5-14B-Instruct',
      'THUDM/glm-4-9b-chat',
      'deepseek-ai/DeepSeek-V2-Chat',
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
    ],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      'deepseek-chat',
      'deepseek-coder',
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      'claude-sonnet-4-20250514',
      'claude-4-opus-20250514',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
    ],
  },
} as const;

export type ProviderId = keyof typeof PROVIDERS;

interface PlanTask {
  day: number;
  tasks: string[];
}

interface PlanResult {
  plan: PlanTask[];
}

function getDaysUntil(dateStr: string): number {
  if (!dateStr) return 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export async function generateLearningPlan(tasks: Task[], apiConfig?: ApiConfig): Promise<PlanResult> {
  // 优先使用传入的配置，否则尝试从环境变量获取
  let apiKey: string;
  let baseUrl: string;
  let model: string;

  if (apiConfig?.apiKey) {
    apiKey = apiConfig.apiKey;
    baseUrl = apiConfig.baseUrl || PROVIDERS[apiConfig.provider as ProviderId]?.baseUrl || PROVIDERS.siliconflow.baseUrl;
    model = apiConfig.model || PROVIDERS[apiConfig.provider as ProviderId]?.models[0] || 'Pro/MiniMaxAI/MiniMax-M2.5';
  } else {
    // 后备：从环境变量获取
    apiKey = process.env.SILICONFLOW_API_KEY || '';
    baseUrl = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1';
    model = process.env.SILICONFLOW_MODEL || 'Pro/MiniMaxAI/MiniMax-M2.5';
  }

  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const tasksWithDays = tasks.map(t => ({
    ...t,
    ddlDays: getDaysUntil(t.ddlDate)
  }));

  const maxDays = Math.max(...tasksWithDays.map(t => t.ddlDays), 1);

  // 构建详细的任务信息，包含目标程度
  const taskListText = tasksWithDays
    .map((t, i) => {
      const goalInfo = t.goal ? `，目标：${t.goal}` : '';
      return `${i + 1}. ${t.title}${goalInfo} (目标日期: ${t.ddlDate}，剩余${t.ddlDays}天，优先级${i + 1})`;
    })
    .join('\n');

  const systemPrompt = `你是一个学习计划生成专家。你的任务是将用户的学习任务拆解为非常详细的每日学习计划。

重要规则 - 请严格按照以下步骤执行：

【第一步：分别拆解每个学习任务】
1. 逐一处理用户添加的每个学习任务（大项目）
2. 根据该任务的ddl_days（剩余天数）和目标程度，将它拆分成若干个小任务
3. 明确标注每个小任务来自哪个大项目

【第二步：综合优先级，将任务集中到每天】
1. 按照大项目的优先级（数组中index越小优先级越高）分配每天的学习量
2. 考虑每个任务的剩余天数，确保在截止日前完成
3. 每天的任务量要合理分配，不要一天做太多

【第三步：整合输出】
1. 输出必须是合法的JSON格式，不允许有Markdown标记
2. 在每个任务描述前加上所属项目名称，格式："[项目名] 具体任务描述"

每日的每个任务必须非常详细，包含：
- 所属大项目名称（用[]包裹）
- 需要花多少分钟
- 具体做什么内容
- 预期达到什么效果

输出格式示例：
{
  "plan": [
    {
      "day": 1,
      "tasks": [
        "[Python] 观看基础视频第1-2节，约30分钟，理解变量和数据类型概念",
        "[Python] 完成练习题第1-10题，约45分钟，巩固语法知识",
        "[英语] 背诵单词20个，约20分钟，记忆词汇"
      ]
    }
  ]
}

关键要求：每个任务描述必须以"[项目名]"开头，明确标识任务来自哪个大项目！`;

  const userPrompt = `请为以下学习任务生成详细的每日计划，总天数必须至少${maxDays}天。确保每个任务都详细到具体的时间和内容：\n${taskListText}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content returned from API');
  }

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse AI response as JSON');
  }
}
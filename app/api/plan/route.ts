import { NextRequest, NextResponse } from 'next/server';
import { generateLearningPlan } from '@/services/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks, apiConfig } = body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: '请提供学习任务列表' },
        { status: 400 }
      );
    }

    const plan = await generateLearningPlan(tasks, apiConfig);

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Plan generation error:', error);

    const message = error instanceof Error ? error.message : '生成计划失败';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
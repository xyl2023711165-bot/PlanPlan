export interface Task {
  id: string;
  title: string;
  goal?: string;
  description?: string;
  ddlDate: string; // 用户选择的目标日期 (YYYY-MM-DD)
  createdAt: string;
}

export interface DailyPlanTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface DayPlan {
  day: number;
  tasks: DailyPlanTask[];
}

export interface LearningPlan {
  id: string;
  taskId: string;
  createdAt: string;
  days: DayPlan[];
}

export interface UserProgress {
  taskId: string;
  planId: string;
  completedTasks: Record<string, string[]>; // day -> taskIds
}
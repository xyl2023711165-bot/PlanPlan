import { Task } from '@/types';

const TASKS_KEY = 'planplan_tasks';
const PLAN_KEY = 'planplan_plan';
const PROGRESS_KEY = 'planplan_progress';

export function getTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(TASKS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function getPlan(): unknown {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(PLAN_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function savePlan(plan: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function getProgress(): unknown {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(PROGRESS_KEY);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function saveProgress(progress: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// API 配置存储
const API_CONFIG_KEY = 'planplan_api_config';
const SETUP_COMPLETE_KEY = 'planplan_setup_complete';

export interface ApiConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
}

const DEFAULT_API_CONFIG: ApiConfig = {
  provider: 'siliconflow',
  apiKey: '',
  baseUrl: '',
  model: '',
};

export function getApiConfig(): ApiConfig {
  if (typeof window === 'undefined') return DEFAULT_API_CONFIG;
  const data = localStorage.getItem(API_CONFIG_KEY);
  if (!data) return DEFAULT_API_CONFIG;
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_API_CONFIG;
  }
}

export function saveApiConfig(config: ApiConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
}

export function isSetupComplete(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SETUP_COMPLETE_KEY) === 'true';
}

export function setSetupComplete(complete: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETUP_COMPLETE_KEY, complete ? 'true' : 'false');
}

// 打卡记录：{ "day1-taskIndex": true, "day2-taskIndex": false }
const CHECKIN_KEY = 'planplan_checkin';

export function getCheckins(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(CHECKIN_KEY);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function saveCheckin(key: string, completed: boolean): void {
  if (typeof window === 'undefined') return;
  const checkins = getCheckins();
  checkins[key] = completed;
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkins));
}

export function toggleCheckin(key: string): boolean {
  if (typeof window === 'undefined') return false;
  const checkins = getCheckins();
  const newState = !checkins[key];
  checkins[key] = newState;
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkins));
  return newState;
}

export function clearAllCheckins(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHECKIN_KEY);
}
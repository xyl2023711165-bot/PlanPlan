'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { TaskInput } from '@/components/TaskInput';
import { TaskList } from '@/components/TaskList';
import { getTasks, getPlan, getCheckins, savePlan, toggleCheckin, clearAllCheckins, isSetupComplete, getApiConfig } from '@/services/storage';

interface PlanTask {
  day: number;
  tasks: string[];
}

interface PlanData {
  plan: PlanTask[];
  createdAt?: string;
}

interface TaskProgress {
  name: string;
  completed: number;
  total: number;
}

export default function Home() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [generatingTip, setGeneratingTip] = useState('正在准备...');

  const [plan, setPlan] = useState<PlanData | null>(null);
  const [tasks, setTasks] = useState<{ id: string; title: string; goal?: string; createdAt: string }[]>([]);
  const [checkins, setCheckins] = useState<Record<string, boolean>>({});
  const [currentDay, setCurrentDay] = useState(1);
  const [planCreatedDate, setPlanCreatedDate] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'tasks' | 'plan'>('tasks');

  const taskInputRef = useRef<HTMLDivElement>(null);
  const planSectionRef = useRef<HTMLDivElement>(null);

  const handleTaskAdded = () => {
    setRefreshKey((k) => k + 1);
  };

  // 首次引导检查 - 在 useEffect 内部检查
  useEffect(() => {
    if (!isSetupComplete()) {
      router.push('/settings?from=wizard');
      return;
    }
    setInitialized(true);
  }, [router]);

  useEffect(() => {
    const tasks = getTasks();
    setTaskCount(tasks.length);
    setTasks(tasks);
  }, [refreshKey]);

  useEffect(() => {
    const loadPlanData = () => {
      const planData = getPlan();
      if (planData) {
        const savedData = planData as PlanData;
        if (savedData.createdAt) {
          setPlanCreatedDate(savedData.createdAt);
        } else {
          const now = new Date().toISOString();
          setPlanCreatedDate(now);
          savedData.createdAt = now;
          savePlan(savedData);
        }
        setPlan(savedData);
      }
      setCheckins(getCheckins());

      const savedPlan = planData as PlanData | null;
      if (savedPlan?.plan && savedPlan.plan.length > 0) {
        const createdAt = (savedPlan as PlanData).createdAt;
        if (createdAt) {
          const created = new Date(createdAt);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          setCurrentDay(Math.min(diffDays + 1, savedPlan.plan.length));
        } else {
          setCurrentDay(1);
        }
      }
    };

    loadPlanData();
    const interval = setInterval(() => loadPlanData(), 2000);
    return () => clearInterval(interval);
  }, []);

  // 监听滚动位置来更新activeSection
  useEffect(() => {
    const handleScroll = () => {
      const planSection = planSectionRef.current;
      if (planSection) {
        const rect = planSection.getBoundingClientRect();
        if (rect.top <= 200) {
          setActiveSection('plan');
        } else {
          setActiveSection('tasks');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [plan]);

  const scrollToTaskInput = () => {
    taskInputRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPlan = () => {
    planSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGeneratePlan = async () => {
    const currentTasks = getTasks();
    if (currentTasks.length === 0) {
      alert('请先添加学习任务');
      return;
    }

    const apiConfig = getApiConfig();

    setGenerating(true);
    setGeneratingProgress(0);

    // 模拟进度条
    const progressSteps = [
      { progress: 10, text: '正在分析您的学习目标...' },
      { progress: 30, text: '正在拆解任务计划...' },
      { progress: 50, text: '正在生成每日学习方案...' },
      { progress: 70, text: '正在优化任务分配...' },
      { progress: 90, text: '即将完成...' },
    ];
    let stepIndex = 0;
    setGeneratingTip(progressSteps[0].text);
    const progressInterval = setInterval(() => {
      setGeneratingProgress(prev => {
        if (prev >= 90 || stepIndex >= progressSteps.length - 1) {
          clearInterval(progressInterval);
          return 90;
        }
        stepIndex++;
        setGeneratingTip(progressSteps[stepIndex].text);
        return progressSteps[stepIndex].progress;
      });
    }, 800);

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: currentTasks, apiConfig }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('生成计划失败');
      }

      const result = await response.json();
      result.createdAt = new Date().toISOString();
      savePlan(result);

      // 更新所有状态 - 先清除所有打卡记录
      clearAllCheckins();
      const freshTasks = getTasks();
      setTasks(freshTasks);
      setTaskCount(freshTasks.length);
      setPlan(result);
      setPlanCreatedDate(result.createdAt);
      setCheckins({});
      setCurrentDay(1);
      setGeneratingProgress(100);
      setRefreshKey(prev => prev + 1);

      setTimeout(() => scrollToPlan(), 300);
    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      alert('生成计划失败，请重试');
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setGeneratingProgress(0);
        setGeneratingTip('正在准备...');
      }, 500);
    }
  };

  const handleToggle = (day: number, taskIndex: number) => {
    const key = `day${day}-task${taskIndex}`;

    // 切换状态并保存到localStorage
    toggleCheckin(key);

    // 刷新所有状态确保进度实时更新
    const freshCheckins = getCheckins();
    const freshTasks = getTasks();

    setCheckins({ ...freshCheckins });
    setTasks(freshTasks);
    setTaskCount(freshTasks.length);
  };

  const getDayDate = (dayNum: number): Date | null => {
    if (!planCreatedDate) return null;
    const created = new Date(planCreatedDate);
    const targetDate = new Date(created);
    targetDate.setDate(created.getDate() + dayNum - 1);
    return targetDate;
  };

  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    return { dateStr: `${month}月${day}日`, weekday };
  };

  const hasPlan = plan && plan.plan && plan.plan.length > 0;
  const totalTasks = hasPlan ? plan.plan.reduce((sum, day) => sum + day.tasks.length, 0) : 0;
  const completedTasks = Object.values(checkins).filter(Boolean).length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 改进的项目进度计算 - 显示所有用户添加的任务
  const taskProgressMap: Record<string, { completed: number; total: number }> = {};

  // 初始化所有用户添加的任务
  tasks.forEach((task) => {
    taskProgressMap[task.title] = { completed: 0, total: 0 };
  });

  if (hasPlan) {
    plan.plan.forEach((dayPlan) => {
      dayPlan.tasks.forEach((taskName, taskIndex) => {
        const key = `day${dayPlan.day}-task${taskIndex}`;
        const isCompleted = checkins[key] || false;

        // 尝试匹配原始任务
        let matched = false;
        for (const origTask of tasks) {
          // 检查任务名是否包含原始任务名
          // 支持格式：[项目名] 任务描述
          const taskText = taskName.replace(/^\[[^\]]+\]\s*/, ''); // 去掉 [项目名] 前缀
          const taskLower = taskText.toLowerCase();
          const origLower = origTask.title.toLowerCase();

          if (taskLower.includes(origLower) || origLower.includes(taskLower.split('：')[0].toLowerCase())) {
            taskProgressMap[origTask.title].total += 1;
            if (isCompleted) taskProgressMap[origTask.title].completed += 1;
            matched = true;
            break;
          }
        }

        // 如果没匹配到，尝试从 [项目名] 格式中提取
        if (!matched) {
          const bracketMatch = taskName.match(/^\[([^\]]+)\]/);
          if (bracketMatch) {
            const projectName = bracketMatch[1];
            const matchedTask = tasks.find(t => t.title.toLowerCase() === projectName.toLowerCase());
            if (matchedTask) {
              taskProgressMap[matchedTask.title].total += 1;
              if (isCompleted) taskProgressMap[matchedTask.title].completed += 1;
            }
          }
        }
      });
    });
  }

  // 显示所有任务（包括进度为0的）
  const taskProgressList: TaskProgress[] = Object.entries(taskProgressMap)
    .map(([name, data]) => ({ name, completed: data.completed, total: data.total }));

  if (!initialized) {
    return (
      <div className="page-container">
        <NavBar />
        <main className="main-content" style={{ paddingTop: '100px', textAlign: 'center' }}>
          加载中...
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <NavBar />

      {/* 左侧书签导航 */}
      <div className="left-sidebar">
        <button
          className={`bookmark ${activeSection === 'tasks' ? 'active' : ''}`}
          onClick={scrollToTaskInput}
        >
          <span className="bookmark-text">首页</span>
        </button>
        <button
          className={`bookmark ${activeSection === 'plan' ? 'active' : ''}`}
          onClick={scrollToPlan}
        >
          <span className="bookmark-text">计划</span>
        </button>
      </div>

      <main className="main-content">
        {/* 添加任务区域 */}
        <section className="section" ref={taskInputRef}>
          <h2 className="section-title">添加学习目标</h2>
          <TaskInput onTaskAdded={handleTaskAdded} />
        </section>

        {/* 任务列表 */}
        <section className="section">
          <TaskList refreshKey={refreshKey} />
        </section>

        {/* 生成计划按钮 */}
        {taskCount > 0 && (
          <section className="section">
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="generate-btn"
            >
              {generating ? '生成中...' : hasPlan ? '重新生成学习计划' : '生成学习计划'}
            </button>
          </section>
        )}

        {/* 学习计划日历 */}
        {hasPlan && (
          <>
            {/* 加载遮罩 */}
            {generating && (
              <div className="loading-overlay">
                <div className="loading-content">
                  <div className="loading-title">AI 正在为您规划学习方案</div>
                  <div className="progress-container">
                    <div className="progress-track">
                      <div
                        className="progress-bar"
                        style={{ width: `${Math.min(generatingProgress, 100)}%` }}
                      />
                    </div>
                    <div className="progress-text">{Math.round(Math.min(generatingProgress, 100))}%</div>
                  </div>
                  <div className="loading-tips">
                    {generatingTip}
                  </div>
                </div>
              </div>
            )}

            {/* 移动端进度 */}
            <section className="section progress-section-mobile">
              <div className="progress-card">
                <div className="progress-header">
                  <span className="progress-label">总体进度</span>
                  <span className="progress-value">{overallProgress}%</span>
                </div>
                <div className="progress-bar-thin">
                  <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
                </div>
                <div className="progress-stats">
                  <span>{completedTasks} / {totalTasks}</span>
                </div>
              </div>
            </section>

            {/* 日历网格 */}
            <section className="section" ref={planSectionRef} id="plan-section">
              <h2 className="section-title">每日学习计划</h2>
              <div className="calendar-grid">
                {plan.plan.map((dayPlan) => {
                  const dayDate = getDayDate(dayPlan.day);
                  const dateInfo = dayDate ? formatDate(dayDate) : null;
                  return (
                    <div
                      key={dayPlan.day}
                      className={`day-card ${dayPlan.day === currentDay ? 'today' : ''}`}
                    >
                      <div className="day-header">
                        <div className="day-title">
                          <h3>Day {dayPlan.day}</h3>
                          {dateInfo && <span className="day-date">{dateInfo.dateStr} {dateInfo.weekday}</span>}
                        </div>
                        {dayPlan.day === currentDay && <span className="today-tag">今天</span>}
                      </div>
                      <ul className="task-list">
                        {dayPlan.tasks.map((task, index) => {
                          const key = `day${dayPlan.day}-task${index}`;
                          const isCompleted = checkins[key] || false;

                          // 匹配这个任务属于哪个大项目 - 优先从 [项目名] 格式提取
                          let projectName = '';
                          const bracketMatch = task.match(/^\[([^\]]+)\]/);
                          if (bracketMatch) {
                            projectName = bracketMatch[1];
                          } else {
                            // 后备：模糊匹配
                            for (const origTask of tasks) {
                              if (task.toLowerCase().includes(origTask.title.toLowerCase()) ||
                                  origTask.title.toLowerCase().includes(task.toLowerCase().split('：')[0])) {
                                projectName = origTask.title;
                                break;
                              }
                            }
                          }

                          return (
                            <li key={index} className={`task-item ${isCompleted ? 'completed' : ''}`}>
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={isCompleted}
                                  onChange={() => handleToggle(dayPlan.day, index)}
                                />
                                <div className="task-content">
                                  {projectName && <span className="task-project-tag">{projectName}</span>}
                                  <span className="task-text">{task}</span>
                                </div>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      {/* 右侧进度侧边栏 */}
      {hasPlan && (
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>综合进度</h3>
            <div className="overall-progress">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${overallProgress}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">{overallProgress}%</text>
              </svg>
              <div className="overall-stats">
                <p className="completed-count">{completedTasks}</p>
                <p className="total-count">/ {totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>项目进度</h3>
            <div className="task-progress-list">
              {taskProgressList.length > 0 ? (
                taskProgressList.map((item) => {
                  const progress = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
                  return (
                    <div key={item.name} className="task-progress-item">
                      <div className="task-progress-header">
                        <span className="task-name">{item.name}</span>
                        <span className="task-percent">{progress}%</span>
                      </div>
                      <div className="task-progress-bar">
                        <div className="task-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="no-tasks">暂无项目进度</p>
              )}
            </div>
          </div>
        </aside>
      )}

      <style>{`
        .page-container {
          min-height: 100vh;
          background: #f7f8fa;
        }

        /* 固定头部空间 */
        .page-container > div:first-child {
          height: 72px;
        }

        .main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 80px;
          padding-right: 400px;
          min-height: calc(100vh - 72px);
        }

        /* 左侧书签 */
        .left-sidebar {
          position: fixed;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 20px;
          z-index: 100;
        }

        .bookmark {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 28px;
          background: #e2e8f0;
          color: #4a5568;
          border: none;
          border-radius: 0 16px 16px 0;
          cursor: pointer;
          transition: all 0.3s;
          min-width: 64px;
        }

        .bookmark:hover {
          background: #cbd5e0;
          padding-left: 36px;
        }

        .bookmark.active {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          color: white;
          transform: scale(1.15);
          box-shadow: 0 8px 24px rgba(26, 32, 44, 0.5);
          border-left: 4px solid #4a5568;
        }

        .bookmark-text {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .section {
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 26px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 24px;
          letter-spacing: -0.5px;
        }

        .generate-btn {
          width: 100%;
          padding: 20px 40px;
          background: #2d3748;
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 1px;
          box-shadow: 0 4px 16px rgba(45, 55, 72, 0.25);
        }

        .generate-btn:hover:not(:disabled) {
          background: #1a202c;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(45, 55, 72, 0.35);
        }

        .generate-btn:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* 加载遮罩 */
        .loading-overlay {
          position: fixed;
          top: 72px;
          left: 0;
          right: 360px;
          bottom: 0;
          background: rgba(247, 248, 250, 0.98);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }

        .loading-content {
          text-align: center;
          padding: 40px;
        }

        .loading-title {
          font-size: 22px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 32px;
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .progress-track {
          width: 300px;
          height: 12px;
          background: #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #2d3748 0%, #4a5568 100%);
          border-radius: 6px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 18px;
          font-weight: 700;
          color: #2d3748;
          min-width: 50px;
        }

        .loading-tips {
          font-size: 14px;
          color: #718096;
        }

        .progress-section-mobile {
          display: none;
        }

        .progress-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .progress-label {
          font-size: 15px;
          color: #4a5568;
        }

        .progress-value {
          font-size: 24px;
          font-weight: 700;
          color: #1a202c;
        }

        .progress-bar-thin {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: #2d3748;
          border-radius: 4px;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .day-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          transition: all 0.3s;
        }

        .day-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }

        .day-card.today {
          border: 2px solid #2d3748;
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #edf2f7;
        }

        .day-title h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
        }

        .day-date {
          display: block;
          font-size: 13px;
          color: #718096;
          margin-top: 4px;
        }

        .today-tag {
          font-size: 11px;
          background: #2d3748;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 600;
        }

        .task-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .task-item {
          padding: 12px 0;
          border-bottom: 1px solid #f7fafc;
          display: flex;
          align-items: flex-start;
        }

        .task-item:last-child {
          border-bottom: none;
        }

        .task-item.completed .task-text {
          color: #a0aec0;
          text-decoration: line-through;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          width: 100%;
        }

        .checkbox-label input[type="checkbox"] {
          width: 20px;
          height: 20px;
          min-width: 20px;
          margin-top: 2px;
          cursor: pointer;
          accent-color: #2d3748;
        }

        .task-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .task-project-tag {
          font-size: 13px;
          font-weight: 700;
          color: #2d3748;
          background: #edf2f7;
          padding: 4px 10px;
          border-radius: 4px;
          display: inline-block;
          width: fit-content;
          margin-bottom: 6px;
        }

        .task-text {
          font-size: 16px;
          color: #2d3748;
          line-height: 1.6;
        }

        /* 右侧侧边栏 */
        .sidebar {
          position: fixed;
          right: 0;
          top: 72px;
          width: 340px;
          height: calc(100vh - 72px);
          background: white;
          border-left: 1px solid #e2e8f0;
          padding: 28px;
          overflow-y: auto;
          box-shadow: -4px 0 24px rgba(0,0,0,0.06);
        }

        .sidebar-section {
          margin-bottom: 36px;
        }

        .sidebar-section h3 {
          font-size: 13px;
          font-weight: 700;
          color: #718096;
          margin: 0 0 20px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .overall-progress {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .circular-chart {
          width: 90px;
          height: 90px;
        }

        .circle-bg {
          fill: none;
          stroke: #edf2f7;
          stroke-width: 3.5;
        }

        .circle {
          fill: none;
          stroke: #2d3748;
          stroke-width: 3.5;
          stroke-linecap: round;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }

        .percentage {
          fill: #1a202c;
          font-size: 0.5em;
          text-anchor: middle;
          font-weight: 700;
        }

        .overall-stats {
          text-align: center;
        }

        .completed-count {
          margin: 0;
          font-size: 42px;
          font-weight: 700;
          color: #1a202c;
        }

        .total-count {
          margin: 6px 0 0;
          font-size: 18px;
          color: #a0aec0;
        }

        .task-progress-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .task-progress-item {
          padding-bottom: 18px;
          border-bottom: 1px solid #f7fafc;
        }

        .task-progress-item:last-child {
          border-bottom: none;
        }

        .task-progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .task-name {
          font-size: 16px;
          color: #2d3748;
          font-weight: 600;
        }

        .task-percent {
          font-size: 15px;
          font-weight: 700;
          color: #2d3748;
        }

        .task-progress-bar {
          height: 6px;
          background: #edf2f7;
          border-radius: 3px;
          overflow: hidden;
        }

        .task-progress-fill {
          height: 100%;
          background: #2d3748;
          border-radius: 3px;
        }

        .no-tasks {
          color: #a0aec0;
          font-size: 14px;
          text-align: center;
          padding: 20px;
        }

        @media (max-width: 1500px) {
          .main-content {
            padding-right: 24px;
            padding-left: 24px;
          }

          .sidebar {
            display: none;
          }

          .progress-section-mobile {
            display: block;
          }

          .loading-overlay {
            right: 0;
          }

          .progress-track {
            width: 200px;
          }
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 24px 16px;
          }

          .section-title {
            font-size: 22px;
          }

          .calendar-grid {
            grid-template-columns: 1fr;
          }

          .left-sidebar {
            display: none;
          }

          .bookmark {
            padding: 12px 16px;
          }

          .bookmark-text {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
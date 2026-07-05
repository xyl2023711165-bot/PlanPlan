'use client';

import { useState } from 'react';
import { saveTasks, getTasks } from '@/services/storage';

export function TaskInput({ onTaskAdded }: { onTaskAdded?: () => void }) {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [ddlDate, setDdlDate] = useState('');
  const [loading, setLoading] = useState(false);

  const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !ddlDate) return;

    setLoading(true);
    try {
      const tasks = getTasks();
      const newTask = {
        id: Date.now().toString(),
        title: title.trim(),
        goal: goal.trim(),
        ddlDate: ddlDate,
        createdAt: new Date().toISOString(),
      };
      tasks.push(newTask);
      saveTasks(tasks);

      setTitle('');
      setGoal('');
      setDdlDate(getDefaultDate());
      onTaskAdded?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-input-form" id="task-input-section">
      <div className="input-group">
        <label>学习目标</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：Python课程学习"
          className="task-title-input"
        />
      </div>

      <div className="input-group">
        <label>目标程度</label>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="例如：能够独立完成项目开发"
          className="task-goal-input"
        />
      </div>

      <div className="input-group">
        <label>目标完成日期</label>
        <input
          type="date"
          value={ddlDate || getDefaultDate()}
          onChange={(e) => setDdlDate(e.target.value)}
          className="date-input"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <button type="submit" disabled={loading || !title.trim() || !ddlDate} className="add-btn">
        {loading ? '添加中...' : '+ 添加学习目标'}
      </button>

      <style>{`
        .task-input-form {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }

        .input-group {
          margin-bottom: 24px;
        }

        .input-group label {
          display: block;
          font-size: 13px;
          color: #4a5568;
          margin-bottom: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .task-title-input, .task-goal-input {
          width: 100%;
          padding: 18px 20px;
          border: none;
          border-bottom: 2px solid #e2e8f0;
          font-size: 20px;
          transition: border-color 0.3s;
          box-sizing: border-box;
          background: transparent;
          color: #1a202c;
        }

        .task-title-input:focus, .task-goal-input:focus {
          outline: none;
          border-color: #2d3748;
        }

        .task-title-input::placeholder, .task-goal-input::placeholder {
          color: #a0aec0;
        }

        .date-input {
          width: 100%;
          padding: 18px 20px;
          border: none;
          border-bottom: 2px solid #e2e8f0;
          font-size: 20px;
          transition: border-color 0.3s;
          box-sizing: border-box;
          background: transparent;
          font-family: inherit;
          color: #1a202c;
        }

        .date-input:focus {
          outline: none;
          border-color: #2d3748;
        }

        .add-btn {
          width: 100%;
          padding: 18px 32px;
          background: #2d3748;
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 1px;
        }

        .add-btn:hover:not(:disabled) {
          background: #1a202c;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(45, 55, 72, 0.25);
        }

        .add-btn:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  dragEnabled?: boolean;
}

export function TaskCard({ task, onDelete, dragEnabled = true }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !dragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getDaysRemaining = (): number => {
    if (!task.ddlDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(task.ddlDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  const daysRemaining = getDaysRemaining();
  const displayText = daysRemaining > 0 ? `${daysRemaining}天后` : daysRemaining === 0 ? '今天' : '已过期';

  return (
    <div ref={setNodeRef} style={style} className="task-card">
      <div className="drag-handle" {...attributes} {...listeners}>
        ⋮⋮
      </div>
      <div className="task-content">
        <div className="task-title">{task.title}</div>
        {task.goal && <div className="task-goal">{task.goal}</div>}
        <div className="task-meta">
          <span className="task-ddl">{task.ddlDate ? formatDate(task.ddlDate) : ''}</span>
          <span className="days-remaining">{displayText}</span>
        </div>
      </div>
      <button
        className="delete-btn"
        onClick={() => onDelete(task.id)}
        title="删除任务"
      >
        ×
      </button>

      <style>{`
        .task-card {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          gap: 16px;
          transition: all 0.3s;
        }

        .task-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .drag-handle {
          cursor: grab;
          padding: 8px;
          color: #cbd5e0;
          font-size: 16px;
          font-weight: bold;
          user-select: none;
          transition: color 0.2s;
        }

        .drag-handle:hover {
          color: #2d3748;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .task-content {
          flex: 1;
        }

        .task-title {
          font-size: 20px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 6px;
        }

        .task-goal {
          font-size: 16px;
          color: #718096;
          margin-bottom: 8px;
        }

        .task-meta {
          display: flex;
          gap: 12px;
          align-items: center;
          font-size: 15px;
        }

        .task-ddl {
          color: #718096;
        }

        .days-remaining {
          color: #4a5568;
          font-weight: 600;
        }

        .delete-btn {
          background: none;
          border: none;
          color: #e2e8f0;
          font-size: 28px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s;
          line-height: 1;
        }

        .delete-btn:hover {
          background: #f7fafc;
          color: #2d3748;
        }
      `}</style>
    </div>
  );
}
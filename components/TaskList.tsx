'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { Task } from '@/types';
import { saveTasks, getTasks } from '@/services/storage';

export function TaskList({ refreshKey }: { refreshKey?: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setTasks(getTasks());
    setLoading(false);
  }, [refreshKey]);

  const handleDelete = (id: string) => {
    const newTasks = tasks.filter((t) => t.id !== id);
    saveTasks(newTasks);
    setTasks(newTasks);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      saveTasks(newTasks);
      setTasks(newTasks);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="task-list-container">
        <div className="empty-state">
          <p>暂无任务，请添加学习任务</p>
        </div>
        <style>{`
          .task-list-container {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #888;
          }
          .empty-state p {
            margin: 0;
            font-size: 15px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      <div className="list-header">
        <h3>任务列表（拖拽调整优先级）</h3>
        <span className="task-count">{tasks.length}个任务</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>

      <style>{`
        .task-list-container {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .list-header h3 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }

        .task-count {
          font-size: 13px;
          color: #888;
          background: #f5f5f5;
          padding: 4px 10px;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
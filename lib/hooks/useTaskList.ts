"use client";

import { useState } from "react";

interface TaskItem {
  id: string;
  createdAt: number;
  prompt?: string;
  meta?: Record<string, string>;
}

type TaskResults = Record<string, string[]>;

interface UseTaskList {
  tasks: TaskItem[];
  results: TaskResults;
  addTask: (task: TaskItem) => void;
  removeTask: (taskId: string) => void;
  clear: () => void;
  updateResults: (taskId: string, urls: string[]) => void;
  totalResultCount: number;
}

/**
 * Minimal reusable task list manager for UI pages.
 */
export function useTaskList(): UseTaskList {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [results, setResults] = useState<TaskResults>({});

  const addTask = (task: TaskItem) => {
    setTasks((prev) => [task, ...prev]);
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setResults((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const clear = () => {
    setTasks([]);
    setResults({});
  };

  const updateResults = (taskId: string, urls: string[]) => {
    setResults((prev) => ({ ...prev, [taskId]: urls }));
  };

  const totalResultCount = Object.values(results).reduce(
    (total, urls) => total + urls.length,
    0
  );

  return {
    tasks,
    results,
    addTask,
    removeTask,
    clear,
    updateResults,
    totalResultCount,
  };
}

import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

/* Task Type */
type Task = {
  id: string;
  title: string;
  completed: boolean;
};

/* Context Type */
type TaskContextType = {
  tasks: Task[];
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
};

/* Create Context */
export const TaskContext =
  createContext<TaskContextType | null>(null);

/* Storage Key */
const STORAGE_KEY = "SKILL_TASKS";

/* Provider */
export function TaskProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);

  /* Load Tasks on App Start */
  useEffect(() => {
    loadTasks();
  }, []);

  /* Save Tasks when Changed */
  useEffect(() => {
    saveTasks();
  }, [tasks]);

  /* Load */
  const loadTasks = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);

      if (data) {
        setTasks(JSON.parse(data));
      }
    } catch (error) {
      console.log("Load Error:", error);
    }
  };

  /* Save */
  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
      );
    } catch (error) {
      console.log("Save Error:", error);
    }
  };

  /* Add Task */
  const addTask = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
    };

    setTasks((prev) => [...prev, newTask]);
  };

  /* Toggle Complete */
  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  return (
    <TaskContext.Provider
      value={{ tasks, addTask, toggleTask }}
    >
      {children}
    </TaskContext.Provider>
  );
}

import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

/* Types */

export type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export type Goal = {
  id: string;
  name: string;
  tasks: Task[];
};

type TaskContextType = {
  goals: Goal[];

  addGoal: (name: string) => void;

  addTask: (
    goalId: string,
    title: string
  ) => void;

  toggleTask: (
    goalId: string,
    taskId: string
  ) => void;
};

/* Context */

export const TaskContext =
  createContext<TaskContextType | null>(
    null
  );

/* Storage */

const STORAGE_KEY = "SKILL_GOALS";

/* Provider */

export function TaskProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [goals, setGoals] = useState<
    Goal[]
  >([]);

  /* Load */

  useEffect(() => {
    loadData();
  }, []);

  /* Save */

  useEffect(() => {
    saveData();
  }, [goals]);

  /* Load from storage */

  const loadData = async () => {
    try {
      const data =
        await AsyncStorage.getItem(
          STORAGE_KEY
        );

      if (data) {
        setGoals(JSON.parse(data));
      }
    } catch (e) {
      console.log(e);
    }
  };

  /* Save to storage */

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(goals)
      );
    } catch (e) {
      console.log(e);
    }
  };

  /* Add Goal */

  const addGoal = (name: string) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      name,
      tasks: [],
    };

    setGoals((prev) => [
      ...prev,
      newGoal,
    ]);
  };

  /* Add Task */

  const addTask = (
    goalId: string,
    title: string
  ) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              tasks: [
                ...g.tasks,
                {
                  id: Date.now().toString(),
                  title,
                  completed: false,
                },
              ],
            }
          : g
      )
    );
  };

  /* Toggle */

  const toggleTask = (
    goalId: string,
    taskId: string
  ) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              tasks: g.tasks.map(
                (t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        completed:
                          !t.completed,
                      }
                    : t
              ),
            }
          : g
      )
    );
  };

  return (
    <TaskContext.Provider
      value={{
        goals,
        addGoal,
        addTask,
        toggleTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

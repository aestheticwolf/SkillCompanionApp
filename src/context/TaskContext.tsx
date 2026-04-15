import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { AuthContext } from "./AuthContext";

import {
  addUserGoal,
  deleteGoalFirestore,
  getUserGoals,
  updateGoal as updateGoalFirestore,
} from "../services/firestoreTasks";


/* Types */

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: number | null;
  createdAt?: number;
};

export type Goal = {
  id: string;
  name: string;
  icon?: string;
  tasks: Task[];
};

type TaskContextType = {
  goals: Goal[];

  addGoal: (name: string, icon?: string) => Promise<void>;
 addTask: (goalId: string, title: string, dueDate?: number | null) => Promise<void>;
  toggleTask: (goalId: string, taskId: string) => Promise<void>;

  deleteGoal: (goalId: string) => Promise<void>;
  deleteTask: (goalId: string, taskId: string) => Promise<void>;

  getOverallProgress: () => number;
  getGoalProgress: (goalId: string) => number;
  getRecommendation: () => string;

  getStats: () => {
    totalGoals: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  };

  hasPendingTasks: () => boolean;

  updateGoal: (goalId: string, data: Partial<Goal>) => Promise<void>;

 updateTask: (goalId: string, taskId: string, title: string) => Promise<void>;
  reloadGoals: () => Promise<void>;
};

/* Context */

export const TaskContext = createContext<TaskContextType | null>(null);

/* Provider */

export function TaskProvider({ children }: { children: ReactNode }) {
  const authCtx = useContext(AuthContext);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  /* Update Goal (for inline editing) */
  const updateGoal = async (goalId: string, data: Partial<Goal>) => {
    if (!authCtx?.user) return;

    // Update local state immediately for snappy UI
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, ...data } : g)),
    );

    // Sync to Firestore using the renamed import
    await updateGoalFirestore(authCtx.user.uid, goalId, data);
  };

  const updateTask = async (
  goalId: string,
  taskId: string,
  newTitle: string,
) => {
  if (!authCtx?.user) return;

  // Find the goal and update its tasks
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return;

  const updatedTasks = goal.tasks.map((t) =>
    t.id === taskId ? { ...t, title: newTitle } : t,
  );

  // Update local state
  setGoals((prev) =>
    prev.map((g) => (g.id === goalId ? { ...g, tasks: updatedTasks } : g)),
  );

  // Sync to Firestore
await updateGoalFirestore(authCtx.user.uid, goalId, {
  tasks: updatedTasks.map((t: any) => ({
    ...t,
    dueDate: t.dueDate || null,
    createdAt: t.createdAt || Date.now(),
  })),
});
};

  /* Add Task */

const addTask = async (
  goalId: string,
  title: string,
  dueDate: number | null = null
) => {
    if (!authCtx?.user) return;

    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

const updatedTasks = [
  ...goal.tasks,
  {
    id: Date.now().toString(),
    title,
    completed: false,
    dueDate: dueDate,
    createdAt: Date.now(),
  },
];

    //UPDATE UI
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, tasks: updatedTasks } : g)),
    );

    // FIRESTORE
 await updateGoalFirestore(authCtx.user.uid, goalId, {
  tasks: updatedTasks.map((t: any) => ({
    ...t,
    dueDate: t.dueDate || null,
    createdAt: t.createdAt || Date.now(),
  })),
});
};

  const toggleTask = async (goalId: string, taskId: string) => {
    if (!authCtx?.user) return;

    let updatedTasks: Task[] = [];

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          updatedTasks = g.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t,
          );
          return { ...g, tasks: updatedTasks };
        }
        return g;
      }),
    );

 await updateGoalFirestore(authCtx.user.uid, goalId, {
  tasks: updatedTasks.map((t: any) => ({
    ...t,
    dueDate: t.dueDate || null,
    createdAt: t.createdAt || Date.now(),
  })),
});
};

  const getRecommendation = () => {
    const overall = getOverallProgress();
    if (goals.length === 0)
      return "🌱 Start by creating your first learning goal to begin your journey.";
    if (overall === 0)
      return "🚀 Begin with one small task today — every journey starts with a single step.";
    if (overall < 25)
      return "💪 Good start! Consistency is your superpower — keep going.";
    if (overall < 50)
      return "🔥 Nice momentum. Try completing 2 tasks daily for faster growth.";
    if (overall < 75)
      return "⚡ You're halfway there! Keep pushing forward — the finish line is in sight.";
    if (overall < 100)
      return "🏆 Excellent progress! You're almost there — finish strong!";
    return "✨ Perfect score! You've completed everything. Start a new advanced skill.";
  };

  /* Load from Firestore */

  useEffect(() => {
    if (!authCtx?.user) {
      setGoals([]);
      return;
    }

    loadGoals();
  }, [authCtx?.user]);

  const loadGoals = async () => {
    if (!authCtx?.user) return;

    try {
      setLoading(true);

      const data = await getUserGoals(authCtx.user.uid);

      if (data) {
       setGoals(
  (data as Goal[]).map((g) => ({
    ...g,
    tasks: g.tasks || [],
  }))
);
      }
    } catch (err) {
      console.log("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* Add Goal — UPDATED to accept and store icon */

  const addGoal = async (name: string, icon: string = "🎯") => {
    if (!authCtx?.user) return;

    await addUserGoal(authCtx.user.uid, name, icon);

    await loadGoals();
  };

  const getOverallProgress = () => {
    let total = 0;
    let completed = 0;

    goals.forEach((g) => {
      total += g.tasks.length;
      completed += g.tasks.filter((t) => t.completed).length;
    });

    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getGoalProgress = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || goal.tasks.length === 0) return 0;

    const completed = goal.tasks.filter((t) => t.completed).length;
    return Math.round((completed / goal.tasks.length) * 100);
  };

  const getStats = () => {
    let totalTasks = 0;
    let completedTasks = 0;

    goals.forEach((g) => {
      totalTasks += g.tasks.length;
      completedTasks += g.tasks.filter((t) => t.completed).length;
    });

    return {
      totalGoals: goals.length,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
    };
  };

  const hasPendingTasks = () => {
    return goals.some((g) => g.tasks.some((t) => !t.completed));
  };

  const deleteGoal = async (goalId: string) => {
    if (!authCtx?.user) return;

    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    // Sync to Firestore
    await deleteGoalFirestore(authCtx.user.uid, goalId);
  };


const deleteTask = async (goalId: string, taskId: string): Promise<void> => {
  if (!authCtx?.user) return;

  let updatedTasks: Task[] = [];

  setGoals((prev) =>
    prev.map((g) => {
      if (g.id === goalId) {
        updatedTasks = g.tasks.filter((t) => t.id !== taskId);
        return { ...g, tasks: updatedTasks };
      }
      return g;
    })
  );

  await updateGoalFirestore(authCtx.user.uid, goalId, {
    tasks: updatedTasks.map((t: any) => ({
      ...t,
      dueDate: t.dueDate || null,
      createdAt: t.createdAt || Date.now(),
    })),
  });
};

// await updateGoalFirestore(authCtx.user.uid, goalId, {
//   tasks: updatedTasks.map((t: any) => ({
//     ...t,
//     dueDate: t.dueDate || null,
//     createdAt: t.createdAt || Date.now(),
//   })),
// });

  return (
    <TaskContext.Provider
      value={{
        goals,
        addGoal,
        addTask,
        toggleTask,
        deleteGoal,
        deleteTask,
        getOverallProgress,
        getGoalProgress,
        getRecommendation,
        getStats,
        hasPendingTasks,
           updateGoal,
        updateTask,
        reloadGoals: loadGoals,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

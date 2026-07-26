import { createContext, type PropsWithChildren, useContext, useMemo, useState } from "react";

export type ExerciseCell = "EXCON" | "BLUEFOR" | "REDFOR" | "WHITE CELL" | "OBSERVER";
export type SimulationState = "RUNNING" | "PAUSED" | "STOPPED";

export interface ExerciseContextValue {
  exerciseName: string;
  phase: string;
  day: number;
  simulationSeconds: number;
  turn: number;
  speed: number;
  state: SimulationState;
  cell: ExerciseCell;
  classification: "UNCLASSIFIED" | "RESTRICTED" | "SECRET";
  setCell: (cell: ExerciseCell) => void;
  toggleSimulation: () => void;
  advanceTurn: () => void;
  setSpeed: (speed: number) => void;
}

const ExerciseContext = createContext<ExerciseContextValue | undefined>(undefined);

export function ExerciseProvider({ children }: PropsWithChildren) {
  const [cell, setCell] = useState<ExerciseCell>("EXCON");
  const [state, setState] = useState<SimulationState>("RUNNING");
  const [speed, setSpeed] = useState(4);
  const [turn, setTurn] = useState(17);

  const value = useMemo<ExerciseContextValue>(() => ({
    exerciseName: "JOINT SHIELD 2027",
    phase: "PHASE II / EXECUTION",
    day: 2,
    simulationSeconds: 13 * 3600 + 48 * 60 + 22,
    turn,
    speed,
    state,
    cell,
    classification: "UNCLASSIFIED",
    setCell,
    toggleSimulation: () => setState((current) => current === "RUNNING" ? "PAUSED" : "RUNNING"),
    advanceTurn: () => setTurn((current) => current + 1),
    setSpeed,
  }), [cell, speed, state, turn]);

  return <ExerciseContext.Provider value={value}>{children}</ExerciseContext.Provider>;
}

export function useExercise() {
  const value = useContext(ExerciseContext);
  if (!value) throw new Error("useExercise must be used within ExerciseProvider");
  return value;
}

export function formatSimulationTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

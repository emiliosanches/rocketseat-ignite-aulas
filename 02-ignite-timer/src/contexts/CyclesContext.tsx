import { createContext, ReactNode, useEffect, useReducer, useState } from "react";
import { addNewCycleAction, interruptCycleAction, markCycleAsFinishedAction } from "../reducer/cycles/actions";
import { Cycle, cyclesReducer } from "../reducer/cycles/reducer";

interface CreateCycleData {
  task: string;
  minutesAmount: number;
}

interface ICyclesContext {
  cycles: Cycle[];
  activeCycle: Cycle | undefined;
  activeCycleId: string | null;
  secondsPassedAmount: number;
  markActiveCycleAsFinished: () => void;
  updateSecondsPassedAmount: (amount: number) => void;
  createNewCycle: (cycle: CreateCycleData) => void;
  interruptCurrentCycle: () => void;
}

export const CyclesContext = createContext({} as ICyclesContext);

interface CyclesContextProviderProps {
  children: ReactNode;
}

export function CyclesContextProvider({
  children,
}: CyclesContextProviderProps) {
  const [cyclesState, dispatch] = useReducer(
    cyclesReducer,
    { cycles: [], activeCycleId: null },
    () => {
      const storedState = localStorage.getItem(
        "@ignite-timer:cycles-state-1.0.0"
      );

      if (storedState) {
        const parsedState = JSON.parse(storedState);
        parsedState.cycles.forEach((cycle: Cycle) => {
          cycle.startTime = new Date(cycle.startTime);
          if (cycle.interruptedAt) cycle.interruptedAt = new Date(cycle.interruptedAt);
          if (cycle.finishedAt) cycle.finishedAt = new Date(cycle.finishedAt);
        })

        return parsedState;
      }
    }
  );
  const { cycles, activeCycleId } = cyclesState;

  const activeCycle = cycles.find((cycle) => cycle.id === activeCycleId);

  const [secondsPassedAmount, setSecondsPassedAmount] = useState(() => {
    if (activeCycle) {
      return Math.floor(
        (new Date().getTime() - activeCycle.startTime.getTime()) / 1000
      );
    }

    return 0;
  });

  function updateSecondsPassedAmount(amount: number) {
    setSecondsPassedAmount(amount);
  }

  function markActiveCycleAsFinished() {
    dispatch(markCycleAsFinishedAction(activeCycleId));
  }

  function createNewCycle(data: CreateCycleData) {
    const newCycle: Cycle = {
      id: String(new Date().getTime()),
      task: data.task,
      minutesAmount: data.minutesAmount,
      startTime: new Date()
    };

    dispatch(addNewCycleAction(newCycle));

    setSecondsPassedAmount(0);
  }

  function interruptCurrentCycle() {
    dispatch(interruptCycleAction(activeCycleId));
  }

  useEffect(() => {
    const stateJSON = JSON.stringify(cyclesState);

    localStorage.setItem('@ignite-timer:cycles-state-1.0.0', stateJSON)
  }, [cyclesState])

  return (
    <CyclesContext.Provider
      value={{
        cycles: cycles,
        activeCycle,
        activeCycleId,
        markActiveCycleAsFinished,
        secondsPassedAmount,
        updateSecondsPassedAmount,
        createNewCycle,
        interruptCurrentCycle,
      }}
    >
      {children}
    </CyclesContext.Provider>
  );
}

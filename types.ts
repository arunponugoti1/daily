export interface SimulationDataPoint {
  day: number;
  value: number; // The compounded value
  baseline: number; // The linear/stagnant baseline (usually 1)
}

export interface SimulationConfig {
  days: number;
  dailyImprovement: number; // e.g., 0.01 for 1%
  startValue: number;
}

export enum SimulationStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

export interface AIInsight {
  title: string;
  message: string;
  analogy: string;
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  TrendingUp, 
  Brain,
  ArrowRight,
  Settings
} from 'lucide-react';
import { ChartDisplay } from './components/ChartDisplay';
import { VisualGrid } from './components/VisualGrid';
import { generateGrowthInsight } from './services/geminiService';
import { SimulationDataPoint, SimulationStatus, AIInsight } from './types';

const DEFAULT_DAYS = 365;
const DEFAULT_IMPROVEMENT = 0.01; // 1%
const ANIMATION_SPEED_MS = 20;

const App: React.FC = () => {
  // -- State --
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);
  const [currentDay, setCurrentDay] = useState(0);
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [improvementRate, setImprovementRate] = useState(DEFAULT_IMPROVEMENT);
  
  const [data, setData] = useState<SimulationDataPoint[]>([]);
  const [currentValue, setCurrentValue] = useState(1);
  
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // -- Logic --

  const resetSimulation = useCallback(() => {
    setStatus(SimulationStatus.IDLE);
    setCurrentDay(0);
    setCurrentValue(1);
    setData([{ day: 0, value: 1, baseline: 1 }]);
    setInsight(null);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const calculateData = useCallback(() => {
    const newData: SimulationDataPoint[] = [];
    let val = 1;
    for (let i = 0; i <= days; i++) {
      newData.push({
        day: i,
        value: val,
        baseline: 1
      });
      val = val * (1 + improvementRate);
    }
    return newData;
  }, [days, improvementRate]);

  // Generate the full dataset upfront for the chart scaling, 
  // but we will only reveal it progressively in the animation if we wanted.
  // However, for Recharts to animate smoothly, passing the *growing* array is often better visually.
  
  const step = (timestamp: number) => {
    if (!lastUpdateTimeRef.current) lastUpdateTimeRef.current = timestamp;
    
    const elapsed = timestamp - lastUpdateTimeRef.current;

    if (elapsed > ANIMATION_SPEED_MS) {
      setCurrentDay(prev => {
        const nextDay = prev + 1;
        if (nextDay > days) {
          setStatus(SimulationStatus.COMPLETED);
          return prev;
        }
        
        // Update Value
        setCurrentValue(prevVal => prevVal * (1 + improvementRate));
        
        // Update Chart Data
        setData(prevData => [
            ...prevData, 
            { 
                day: nextDay, 
                value: prevData[prevData.length - 1].value * (1 + improvementRate),
                baseline: 1 
            }
        ]);

        return nextDay;
      });
      lastUpdateTimeRef.current = timestamp;
    }

    if (status === SimulationStatus.RUNNING && currentDay < days) {
      animationFrameRef.current = requestAnimationFrame(step);
    }
  };

  const togglePlay = () => {
    if (status === SimulationStatus.RUNNING) {
      setStatus(SimulationStatus.PAUSED);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
      if (status === SimulationStatus.COMPLETED || status === SimulationStatus.IDLE && currentDay === 0) {
         // Starting fresh
         resetSimulation();
         // Seed initial data
         setData([{ day: 0, value: 1, baseline: 1 }]);
         setStatus(SimulationStatus.RUNNING);
      } else {
         // Resuming
         setStatus(SimulationStatus.RUNNING);
      }
    }
  };

  // Effect to handle animation loop start/stop
  useEffect(() => {
    if (status === SimulationStatus.RUNNING) {
      animationFrameRef.current = requestAnimationFrame(step);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [status]); // Removing dependencies that change every tick to avoid recreation

  // Trigger AI Insight on completion
  useEffect(() => {
    if (status === SimulationStatus.COMPLETED && !insight && !loadingInsight) {
      const fetchInsight = async () => {
        setLoadingInsight(true);
        const result = await generateGrowthInsight(days, improvementRate, currentValue);
        setInsight(result);
        setLoadingInsight(false);
      };
      fetchInsight();
    }
  }, [status, currentValue, days, improvementRate, insight, loadingInsight]);

  // -- Handlers --
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setImprovementRate(val / 100);
    resetSimulation();
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDays(parseInt(e.target.value));
    resetSimulation();
  };

  // Format percentage for display
  const displayRate = (improvementRate * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 flex flex-col text-zinc-100">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="text-emerald-500" />
            <span>Compound Growth</span>
          </h1>
          <p className="text-zinc-400 mt-1">Visualize how small daily wins lead to massive success.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
          <button 
            onClick={togglePlay}
            className={`p-3 rounded-md flex items-center gap-2 font-semibold transition-all ${
              status === SimulationStatus.RUNNING 
                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
            }`}
          >
            {status === SimulationStatus.RUNNING ? <Pause size={18} /> : <Play size={18} />}
            {status === SimulationStatus.RUNNING ? 'Pause' : status === SimulationStatus.IDLE && currentDay > 0 ? 'Restart' : 'Start'}
          </button>
          <button 
            onClick={resetSimulation}
            className="p-3 rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1">
        
        {/* LEFT COLUMN: Controls & Stats */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Settings Card */}
          <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-6">
              <Settings size={18} className="text-zinc-400" />
              <span>Simulation Config</span>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-zinc-400">Daily Improvement</label>
                  <span className="text-sm font-mono text-emerald-400 bg-emerald-400/10 px-2 rounded">
                    {displayRate}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="5.0" 
                  step="0.1" 
                  value={displayRate}
                  onChange={handleRateChange}
                  disabled={status === SimulationStatus.RUNNING}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  {displayRate === "1.0" ? "The classic '1% better every day'." : "Small changes compound over time."}
                </p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-zinc-400">Duration (Days)</label>
                  <span className="text-sm font-mono text-blue-400 bg-blue-400/10 px-2 rounded">
                    {days}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="730" 
                  step="10" 
                  value={days}
                  onChange={handleDaysChange}
                  disabled={status === SimulationStatus.RUNNING}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Live Stats Card */}
          <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-4">
              <Zap size={18} className="text-amber-400" />
              <span>Live Metrics</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                  <div className="text-xs text-zinc-500 mb-1">Current Day</div>
                  <div className="text-xl font-mono font-bold">{currentDay}</div>
               </div>
               <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                  <div className="text-xs text-zinc-500 mb-1">Improvement</div>
                  <div className="text-xl font-mono font-bold text-emerald-400">
                    {currentValue.toFixed(2)}x
                  </div>
               </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-zinc-500">Linear Growth (Baseline)</span>
                  <span className="text-sm font-mono">1.00x</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Compound Growth</span>
                  <span className="text-sm font-mono text-emerald-400">
                    {(currentValue).toFixed(2)}x
                  </span>
               </div>
               <div className="mt-3 text-xs text-zinc-600 text-center">
                 Difference: <span className="text-emerald-600">+{((currentValue - 1) * 100).toFixed(0)}%</span>
               </div>
            </div>
          </div>
        </div>

        {/* CENTER/RIGHT: Visualization */}
        <div className="xl:col-span-9 flex flex-col gap-6">
          
          {/* Visual Grid & Orb */}
          <div className="min-h-[400px]">
            <VisualGrid 
              totalDays={days} 
              currentDay={currentDay} 
              currentValue={currentValue}
              improvementRate={improvementRate}
            />
          </div>

          {/* Chart & AI Insight */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <ChartDisplay data={data} currentDay={currentDay} />
            </div>

            <div className="lg:col-span-1 flex flex-col">
               {/* AI Coach Panel */}
               <div className="h-full bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl border border-zinc-800 p-6 relative overflow-hidden">
                  <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-4 z-10 relative">
                    <Brain size={18} className="text-purple-400" />
                    <span>Gemini Coach</span>
                  </div>

                  {status !== SimulationStatus.COMPLETED && (
                    <div className="flex flex-col items-center justify-center h-48 text-center z-10 relative">
                       <div className="p-3 bg-zinc-800/50 rounded-full mb-3">
                         <Play size={24} className="text-zinc-600 ml-1" />
                       </div>
                       <p className="text-zinc-500 text-sm">
                         {status === SimulationStatus.RUNNING 
                           ? "Analyzing your growth pattern..." 
                           : "Complete the simulation to unlock AI insights."}
                       </p>
                    </div>
                  )}

                  {status === SimulationStatus.COMPLETED && loadingInsight && (
                    <div className="flex flex-col items-center justify-center h-48 z-10 relative animate-pulse">
                       <Brain size={32} className="text-purple-500/50 mb-3" />
                       <p className="text-zinc-400 text-sm">Synthesizing wisdom...</p>
                    </div>
                  )}

                  {status === SimulationStatus.COMPLETED && insight && !loadingInsight && (
                    <div className="space-y-4 z-10 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                       <h3 className="text-lg font-bold text-white leading-tight">
                         {insight.title}
                       </h3>
                       <p className="text-sm text-zinc-300 leading-relaxed">
                         {insight.message}
                       </p>
                       <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg mt-2">
                         <p className="text-xs text-purple-300 font-medium mb-1 uppercase tracking-wider">Analogy</p>
                         <p className="text-xs text-zinc-400 italic">"{insight.analogy}"</p>
                       </div>
                    </div>
                  )}
                  
                  {/* Background Decor */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
               </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
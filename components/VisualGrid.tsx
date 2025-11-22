import React, { useMemo } from 'react';

interface VisualGridProps {
  totalDays: number;
  currentDay: number;
  currentValue: number;
  improvementRate: number;
}

export const VisualGrid: React.FC<VisualGridProps> = ({ 
  totalDays, 
  currentDay, 
  currentValue,
  improvementRate
}) => {
  
  // Generate grid cells
  const cells = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [totalDays]);

  // Calculate Orb Size - visual representation of "Experience Mass"
  // Base size 64px, growing logarithmically with value to prevent screen takeover
  const orbSize = Math.min(400, 64 + (Math.log2(currentValue) * 40));
  
  // Color shifts from blue (beginner) to emerald (proficient) to gold (expert)
  const getOrbColor = (val: number) => {
    if (val < 2) return 'bg-blue-500 shadow-blue-500/50';
    if (val < 5) return 'bg-emerald-500 shadow-emerald-500/50';
    if (val < 15) return 'bg-purple-500 shadow-purple-500/50';
    return 'bg-amber-500 shadow-amber-500/50';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Panel 1: The Calendar Heatmap (The Daily Grind) */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 backdrop-blur-sm flex flex-col">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-zinc-400 text-sm font-medium">The Daily Grind</h3>
          <div className="text-xs text-zinc-500">
            {currentDay} / {totalDays} Days
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
            <div className="flex flex-wrap content-start gap-[2px] h-full overflow-y-auto pr-2 custom-scrollbar">
            {cells.map((day) => {
                const isActive = day <= currentDay;
                const isCurrent = day === currentDay;
                
                // Opacity increases as "skill" compounds, making later days visually "stronger"
                // Start opacity 0.4, saturate up to 1.0
                const opacity = isActive ? 0.4 + Math.min(0.6, (day / totalDays) * 0.6) : 0.1;
                
                return (
                <div
                    key={day}
                    className={`
                    w-2 h-2 rounded-[1px] transition-all duration-300
                    ${isActive ? 'bg-emerald-500' : 'bg-zinc-700'}
                    ${isCurrent ? 'scale-150 z-10 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : ''}
                    `}
                    style={{ opacity: isActive ? opacity : 0.2 }}
                />
                );
            })}
            </div>
        </div>
        <div className="mt-4 text-xs text-zinc-500 flex justify-between">
            <span>Day 1</span>
            <span>Consistency is key</span>
            <span>Day {totalDays}</span>
        </div>
      </div>

      {/* Panel 2: The Resulting Mass (The Compound Effect) */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950/50 to-zinc-950 pointer-events-none"></div>
        
        <h3 className="absolute top-6 left-6 text-zinc-400 text-sm font-medium z-10">Your Skill Level</h3>

        {/* The Orb */}
        <div className="relative z-0 flex items-center justify-center h-64 w-full">
             <div 
                className={`rounded-full transition-all duration-300 shadow-[0_0_50px] flex items-center justify-center ${getOrbColor(currentValue)}`}
                style={{ 
                    width: `${orbSize}px`, 
                    height: `${orbSize}px`,
                }}
             >
                <div className="text-white font-bold text-lg drop-shadow-md">
                    {currentValue.toFixed(2)}x
                </div>
             </div>
             
             {/* Ripples for activity */}
             {currentDay < totalDays && currentDay > 0 && (
                 <div 
                    className="absolute rounded-full border-2 border-white/20 animate-ping"
                    style={{ width: `${orbSize}px`, height: `${orbSize}px` }}
                 ></div>
             )}
        </div>

        <div className="mt-8 text-center z-10 space-y-2">
             <p className="text-zinc-400 text-sm">
                Improving by <span className="text-emerald-400 font-bold">{(improvementRate * 100).toFixed(1)}%</span> daily
             </p>
             <p className="text-2xl font-bold text-white">
                {currentValue.toFixed(2)}x Better
             </p>
             <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Baseline (1.0) vs. Compounded Effort
             </p>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { SimulationDataPoint } from '../types';

interface ChartDisplayProps {
  data: SimulationDataPoint[];
  currentDay: number;
}

export const ChartDisplay: React.FC<ChartDisplayProps> = ({ data, currentDay }) => {
  // Calculate domain to keep chart stable but accommodating growth
  const maxValue = data.length > 0 ? data[data.length - 1].value : 1;
  
  return (
    <div className="w-full h-[300px] bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 backdrop-blur-sm">
      <h3 className="text-zinc-400 text-sm font-medium mb-4 flex items-center justify-between">
        <span>Growth Trajectory</span>
        <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-500">Linear vs. Exponential</span>
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="day" 
            stroke="#71717a" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `Day ${value}`}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
            itemStyle={{ color: '#e4e4e7' }}
            labelStyle={{ color: '#a1a1aa' }}
            formatter={(value: number) => [value.toFixed(2), 'Value']}
          />
          <Area 
            type="monotone" 
            dataKey="baseline" 
            stroke="#6366f1" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorBaseline)" 
            name="Doing Nothing"
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            name="Daily Improvement"
            animationDuration={0} // Managed by parent state updates
          />
          {currentDay > 0 && (
             <ReferenceLine x={currentDay} stroke="#fbbf24" strokeDasharray="3 3" />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
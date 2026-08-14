import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Reading, Threshold } from '../../types/marea';

interface ReadingsChartProps {
  data: Reading[];
  threshold?: Threshold;
  color: string;
}

export function ReadingsChart({ data, threshold, color }: ReadingsChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl">
        <p className="text-slate-400 text-sm">Aucune donnée pour cette période.</p>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = data.map(r => ({
    ...r,
    displayTime: format(new Date(r.timestamp), 'HH:mm', { locale: fr }),
    fullTime: format(new Date(r.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })
  }));

  // Recharts needs numbers for domains if we want to add padding.
  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));

  const domainMin = threshold ? Math.min(minValue, threshold.min_value - (threshold.min_value * 0.1)) : 'auto';
  const domainMax = threshold ? Math.max(maxValue, threshold.max_value + (threshold.max_value * 0.1)) : 'auto';

  return (
    <div className="h-80 w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="displayTime" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748B', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            domain={[domainMin, domainMax]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748B', fontSize: 12 }}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelFormatter={(_, payload) => {
              if (payload && payload.length > 0) {
                 return payload[0].payload.fullTime;
              }
              return '';
            }}
          />
          
          {threshold && (
            <>
              <ReferenceLine y={threshold.max_value} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Max', fill: '#EF4444', fontSize: 10 }} />
              <ReferenceLine y={threshold.min_value} stroke="#3B82F6" strokeDasharray="3 3" label={{ position: 'bottom', value: 'Min', fill: '#3B82F6', fontSize: 10 }} />
            </>
          )}

          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

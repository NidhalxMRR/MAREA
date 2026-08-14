import React, { useState, useEffect } from 'react';
import { getReadings, getThresholds, getSensorLabel, getSensorUnit } from '../lib/db';
import { Reading, SensorType, Threshold } from '../types/marea';
import { ReadingsChart } from '../components/charts/ReadingsChart';

export function Dashboard() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<SensorType>('temperature');

  useEffect(() => {
    const loadData = () => {
      setReadings(getReadings());
      setThresholds(getThresholds());
    };
    loadData();
    window.addEventListener('marea-data-updated', loadData);
    return () => window.removeEventListener('marea-data-updated', loadData);
  }, []);

  const sensors: { id: SensorType; color: string }[] = [
    { id: 'temperature', color: '#F97316' }, // Orange
    { id: 'ph', color: '#10B981' }, // Emerald
    { id: 'salinity', color: '#3B82F6' }, // Blue
    { id: 'turbidity', color: '#8B5CF6' }, // Violet
  ];

  const filteredReadings = readings
    .filter(r => r.sensor_type === selectedSensor)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const currentThreshold = thresholds.find(t => t.sensor_type === selectedSensor);
  const activeColor = sensors.find(s => s.id === selectedSensor)?.color || '#000';

  // Stats
  const lastReading = filteredReadings[filteredReadings.length - 1];
  const values = filteredReadings.map(r => r.value);
  const avgValue = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '--';
  const minValue = values.length > 0 ? Math.min(...values).toFixed(2) : '--';
  const maxValue = values.length > 0 ? Math.max(...values).toFixed(2) : '--';
  const unit = getSensorUnit(selectedSensor);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Surveillance en temps réel et historique de la qualité de l'eau.</p>
      </header>

      {/* Sensor Selector */}
      <div className="flex gap-2">
        {sensors.map(sensor => {
          const isSelected = selectedSensor === sensor.id;
          return (
            <button
              key={sensor.id}
              onClick={() => setSelectedSensor(sensor.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isSelected 
                  ? 'bg-white shadow-sm ring-1 ring-slate-200 text-slate-900' 
                  : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              {getSensorLabel(sensor.id)}
            </button>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Dernière mesure" value={lastReading ? `${lastReading.value.toFixed(2)} ${unit}` : '--'} subtitle={lastReading ? new Date(lastReading.timestamp).toLocaleTimeString() : ''} />
        <StatCard title="Moyenne" value={`${avgValue} ${unit}`} />
        <StatCard title="Minimum" value={`${minValue} ${unit}`} />
        <StatCard title="Maximum" value={`${maxValue} ${unit}`} />
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Évolution : {getSensorLabel(selectedSensor)}</h2>
            <p className="text-sm text-slate-500">
              Seuils actuels : Min {currentThreshold?.min_value} — Max {currentThreshold?.max_value}
            </p>
          </div>
          {lastReading && (
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
              lastReading.source === 'sonde' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {lastReading.source === 'sonde' ? 'Temps réel' : 'Historique'}
            </span>
          )}
        </div>
        
        <ReadingsChart 
          data={filteredReadings} 
          threshold={currentThreshold} 
          color={activeColor} 
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string, value: string, subtitle?: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

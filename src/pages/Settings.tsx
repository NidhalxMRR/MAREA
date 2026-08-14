import React, { useState, useEffect } from 'react';
import { getThresholds, updateThreshold, getSensorLabel, clearReadings, insertReadings, getSensorUnit } from '../lib/db';
import { SensorType, Threshold } from '../types/marea';
import { Settings2, Trash2, Zap } from 'lucide-react';

export function Settings() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);

  useEffect(() => {
    const loadThresholds = () => setThresholds(getThresholds());
    loadThresholds();
    window.addEventListener('marea-data-updated', loadThresholds);
    return () => window.removeEventListener('marea-data-updated', loadThresholds);
  }, []);

  const handleUpdate = (sensor_type: SensorType, min: number, max: number) => {
    updateThreshold(sensor_type, min, max);
  };

  const simulateRealtimeData = () => {
    // Generate random data
    const sensors: SensorType[] = ['temperature', 'ph', 'salinity', 'turbidity'];
    const randomSensor = sensors[Math.floor(Math.random() * sensors.length)];
    
    // Sometimes generate normal data, sometimes anomalous
    const isAnomalous = Math.random() > 0.7;
    const currentThreshold = thresholds.find(t => t.sensor_type === randomSensor);
    
    let value = 0;
    if (currentThreshold) {
      if (isAnomalous) {
        value = Math.random() > 0.5 
          ? currentThreshold.max_value + (Math.random() * 5)
          : currentThreshold.min_value - (Math.random() * 5);
      } else {
        value = currentThreshold.min_value + Math.random() * (currentThreshold.max_value - currentThreshold.min_value);
      }
    } else {
      value = Math.random() * 100;
    }

    insertReadings([{
      timestamp: new Date().toISOString(),
      sensor_type: randomSensor,
      value: value,
      unit: getSensorUnit(randomSensor),
      source: 'sonde',
    }]);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Réglages</h1>
        <p className="text-slate-500 mt-1">Configuration des seuils et outils de test.</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">Seuils d'alerte</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6">Définissez les plages normales pour chaque type de capteur. Toute valeur en dehors de ces seuils générera une alerte.</p>
          
          <div className="space-y-6">
            {thresholds.map(threshold => (
              <ThresholdForm 
                key={threshold.id} 
                threshold={threshold} 
                onSave={(min, max) => handleUpdate(threshold.sensor_type, min, max)} 
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-slate-900">Simulateur (Temps Réel)</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-500 mb-4">
              En attendant la connexion de la vraie sonde, utilisez ce bouton pour injecter une fausse mesure (parfois hors seuil) et tester les alertes.
            </p>
            <button 
              onClick={simulateRealtimeData}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Injecter une mesure de test
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-red-100 flex items-center gap-3 bg-red-50/50">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-red-900">Zone de danger</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-500 mb-4">
              Supprimez toutes les données (historique, temps réel et alertes) pour repartir de zéro. Les seuils seront conservés.
            </p>
            <button 
              onClick={() => {
                if(window.confirm('Êtes-vous sûr de vouloir supprimer toutes les mesures ? Cette action est irréversible.')) {
                  clearReadings();
                }
              }}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
            >
              Effacer toutes les données
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ThresholdForm: React.FC<{ threshold: Threshold, onSave: (min: number, max: number) => void }> = ({ threshold, onSave }) => {
  const [min, setMin] = useState(threshold.min_value);
  const [max, setMax] = useState(threshold.max_value);
  const [isDirty, setIsDirty] = useState(false);

  // Sync state if external changes happen
  useEffect(() => {
    setMin(threshold.min_value);
    setMax(threshold.max_value);
    setIsDirty(false);
  }, [threshold.min_value, threshold.max_value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(min, max);
    setIsDirty(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-end gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex-1">
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          {getSensorLabel(threshold.sensor_type)} <span className="text-slate-400 font-normal">({getSensorUnit(threshold.sensor_type)})</span>
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">Seuil minimum</label>
            <input 
              type="number" 
              step="any"
              value={min} 
              onChange={e => { setMin(parseFloat(e.target.value)); setIsDirty(true); }}
              className="w-full border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">Seuil maximum</label>
            <input 
              type="number" 
              step="any"
              value={max} 
              onChange={e => { setMax(parseFloat(e.target.value)); setIsDirty(true); }}
              className="w-full border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
        </div>
      </div>
      <button 
        type="submit" 
        disabled={!isDirty}
        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 transition-colors"
      >
        Enregistrer
      </button>
    </form>
  );
}

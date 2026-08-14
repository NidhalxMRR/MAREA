import React, { useState, useEffect } from 'react';
import { getAlerts, acknowledgeAlert, getSensorLabel } from '../lib/db';
import { Alert } from '../types/marea';
import { Bell, Check, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const loadAlerts = () => {
      setAlerts(getAlerts().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    };
    loadAlerts();
    window.addEventListener('marea-data-updated', loadAlerts);
    return () => window.removeEventListener('marea-data-updated', loadAlerts);
  }, []);

  const displayedAlerts = alerts.filter(a => filter === 'all' || !a.acknowledged);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Alertes</h1>
          <p className="text-slate-500 mt-1">Anomalies détectées par rapport aux seuils configurés.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Toutes
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${filter === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Non lues
            {alerts.filter(a => !a.acknowledged).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
            )}
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {displayedAlerts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Aucune alerte</h3>
            <p className="text-sm text-slate-500 mt-1">Tout semble normal pour le moment.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {displayedAlerts.map(alert => (
              <li key={alert.id} className={`p-4 sm:px-6 hover:bg-slate-50 transition-colors flex items-start gap-4 ${!alert.acknowledged ? 'bg-red-50/30' : ''}`}>
                <div className={`mt-1 rounded-full p-2 ${!alert.acknowledged ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{getSensorLabel(alert.sensor_type)}</span>
                    <span className="text-xs text-slate-500">• {format(new Date(alert.created_at), 'dd MMM yyyy, HH:mm', { locale: fr })}</span>
                  </div>
                  <p className={`text-sm mt-1 ${!alert.acknowledged ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                    {alert.message}
                  </p>
                </div>
                {!alert.acknowledged && (
                  <button 
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="flex-shrink-0 ml-4 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    Marquer vue
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

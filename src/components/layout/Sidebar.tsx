import React from 'react';
import { Activity, UploadCloud, Bell, Settings, Droplets } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAlerts } from '../../lib/db';

export type Page = 'dashboard' | 'import' | 'alerts' | 'settings';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [unreadAlerts, setUnreadAlerts] = React.useState(0);

  React.useEffect(() => {
    const updateUnread = () => {
      setUnreadAlerts(getAlerts().filter(a => !a.acknowledged).length);
    };
    updateUnread();
    window.addEventListener('marea-data-updated', updateUnread);
    return () => window.removeEventListener('marea-data-updated', updateUnread);
  }, []);

  const navItems: Array<{ id: Page, label: string, icon: any, badge?: number }> = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Activity },
    { id: 'import', label: 'Import de données', icon: UploadCloud },
    { id: 'alerts', label: 'Alertes', icon: Bell, badge: unreadAlerts },
    { id: 'settings', label: 'Réglages', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed top-0 left-0">
      <div className="p-6 flex items-center gap-3">
        <Droplets className="w-8 h-8 text-blue-400" />
        <h1 className="text-2xl font-bold tracking-tight text-white">MAREA</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-600/10 text-blue-400" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-5 h-5", isActive ? "text-blue-400" : "text-slate-500")} />
                {item.label}
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500">
          Statut de la sonde
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-slate-600"></div>
          <span className="text-sm font-medium text-slate-400">Hors ligne (Simulé)</span>
        </div>
      </div>
    </div>
  );
}

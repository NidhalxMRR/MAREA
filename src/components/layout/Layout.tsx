import React from 'react';
import { Sidebar, type Page } from './Sidebar';

export function Layout({ children, currentPage, onNavigate }: { children: React.ReactNode, currentPage: Page, onNavigate: (page: Page) => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

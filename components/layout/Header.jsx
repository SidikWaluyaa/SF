'use client';

import { Search, Bell } from 'lucide-react';

export default function Header({ title, subtitle, children }) {
  return (
    <header className="flex items-center justify-between h-16 px-6 shrink-0 border-b border-[rgba(55,65,81,0.3)] bg-[rgba(10,14,23,0.8)] backdrop-blur-xl print:hidden no-print">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
      </div>
    </header>
  );
}

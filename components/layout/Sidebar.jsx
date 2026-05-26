'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Beef,
  Rabbit,
  BarChart3,
  Users,
  UserCog,
  Moon,
  ChevronLeft,
  ChevronRight,
  Printer,
  Grid3X3,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sapi', label: 'Data Sapi', icon: Beef },
  { href: '/domba', label: 'Data Domba', icon: Rabbit },
  { href: '/perolehan', label: 'Perolehan', icon: BarChart3 },
  { href: '/mustahiq', label: 'Mustahiq', icon: Users },
  { href: '/panitia', label: 'Panitia', icon: UserCog },
  { href: '/cetak', label: 'Cetak Dokumen', icon: Printer },
  { href: '/cetak/puzzle', label: 'Papan Puzzle', icon: Grid3X3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col h-screen transition-all duration-300 ease-in-out border-r border-[rgba(55,65,81,0.4)] relative print:hidden ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
      style={{
        background: 'linear-gradient(180deg, #0D1220 0%, #0A0E17 100%)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-[rgba(55,65,81,0.3)]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0">
          <Moon className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">
              Muqorrib
            </h1>
            <p className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">
              Qurban System
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-3">
            Menu Utama
          </p>
        )}
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && item.href !== '/cetak' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''} ${
                collapsed ? 'justify-center px-0' : ''
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#1C2540] border border-[rgba(55,65,81,0.5)] flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all z-20"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[rgba(55,65,81,0.3)]">
        {!collapsed && (
          <p className="text-[10px] text-gray-600 text-center">
            © 2026 Muqorrib Qurban
          </p>
        )}
      </div>
    </aside>
  );
}

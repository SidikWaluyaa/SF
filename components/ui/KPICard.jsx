'use client';

export default function KPICard({ title, value, subtitle, icon: Icon, color = 'emerald', delay = 0 }) {
  const colorMap = {
    emerald: {
      bar: 'from-emerald-400 via-cyan-400 to-blue-500',
      glow: 'from-emerald-500/8 via-transparent to-cyan-500/5',
      icon: 'bg-emerald-500/10 text-emerald-400',
      value: 'text-emerald-400',
    },
    gold: {
      bar: 'from-amber-400 via-yellow-400 to-orange-500',
      glow: 'from-amber-500/8 via-transparent to-orange-500/5',
      icon: 'bg-amber-500/10 text-amber-400',
      value: 'text-amber-400',
    },
    rose: {
      bar: 'from-rose-400 via-pink-400 to-red-500',
      glow: 'from-rose-500/8 via-transparent to-red-500/5',
      icon: 'bg-rose-500/10 text-rose-400',
      value: 'text-rose-400',
    },
    blue: {
      bar: 'from-blue-400 via-indigo-400 to-violet-500',
      glow: 'from-blue-500/8 via-transparent to-violet-500/5',
      icon: 'bg-blue-500/10 text-blue-400',
      value: 'text-blue-400',
    },
    purple: {
      bar: 'from-purple-400 via-violet-400 to-fuchsia-500',
      glow: 'from-purple-500/8 via-transparent to-fuchsia-500/5',
      icon: 'bg-purple-500/10 text-purple-400',
      value: 'text-purple-400',
    },
    cyan: {
      bar: 'from-cyan-400 via-teal-400 to-emerald-500',
      glow: 'from-cyan-500/8 via-transparent to-emerald-500/5',
      icon: 'bg-cyan-500/10 text-cyan-400',
      value: 'text-cyan-400',
    },
  };

  const c = colorMap[color] || colorMap.emerald;

  return (
    <div
      className="kpi-card p-5 animate-slide-up"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Neon bar */}
      <div className={`neon-bar bg-gradient-to-b ${c.bar}`} />
      {/* Glow overlay */}
      <div className={`glow-overlay bg-gradient-to-r ${c.glow}`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">
            {title}
          </p>
          {Icon && (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
              <Icon className="w-[18px] h-[18px]" />
            </div>
          )}
        </div>
        <div className={`text-2xl font-extrabold tracking-tight ${c.value}`} style={{ fontFamily: 'var(--font-jetbrains)' }}>
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-gray-500 mt-1.5 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

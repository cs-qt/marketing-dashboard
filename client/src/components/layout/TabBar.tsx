import React from 'react';

export type TabId = 'analytics' | 'calendar' | 'production' | 'media';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'analytics',  label: 'Analytics',       icon: '📊' },
  { id: 'calendar',   label: 'Social Calendar', icon: '📅' },
  { id: 'production', label: 'Print & Video',   icon: '🎬' },
  { id: 'media',      label: 'Media Library',   icon: '🖼️' },
];

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="border-b border-slate-800 bg-slate-900/50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2
              ${active === tab.id
                ? 'text-emerald-400'
                : 'text-slate-400 hover:text-gray-200'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {active === tab.id && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

import { BookOpen, Calculator, Clock, Flame, Map, Search, Sparkles } from 'lucide-react';
import type { NavTab } from '../../types/game';
import { cn } from '../../utils/cn';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSearch: () => void;
  activeEventCount: number;
}

const NAV_ITEMS: Array<{ id: NavTab; label: string; desc: string; icon: typeof Calculator }> = [
  { id: 'calculator', label: 'DPS Calculator', desc: 'Weapon & mod math', icon: Calculator },
  { id: 'meta', label: 'Meta Builds', desc: 'S+ & S loadouts', icon: Flame },
  { id: 'map', label: 'Interactive Map', desc: 'Manibus, Winter, Abyss', icon: Map },
  { id: 'encyclopedia', label: 'Encyclopedia', desc: 'Gear, Deviants, Chef', icon: BookOpen },
  { id: 'timers', label: 'Event Timers', desc: 'Cargo, Prime War, Resets', icon: Clock },
];

export function Sidebar({ activeTab, onSelectTab, onOpenSearch, activeEventCount }: SidebarProps) {
  return (
    <aside className="flex w-full flex-col border-b border-obsidian-700/80 bg-obsidian-900/95 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 border-b border-obsidian-700/80 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-stardust-400/40 bg-stardust-500/15 text-stardust-glow shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide text-white">METABIBLE</div>
            <div className="text-[11px] font-medium text-stardust-400">Once Human Companion</div>
          </div>
        </div>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center justify-between rounded-lg border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-xs text-slate-400 transition hover:border-stardust-400/50 hover:text-slate-200"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-stardust-400" />
            Quick search...
          </span>
          <kbd className="rounded border border-obsidian-700 bg-obsidian-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition lg:w-full',
                active
                  ? 'border-stardust-400/40 bg-stardust-500/10 text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.15)]'
                  : 'border-transparent text-slate-400 hover:bg-obsidian-800/70 hover:text-slate-200',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-stardust-glow' : 'text-slate-500')} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-sm font-medium">
                  <span className="truncate">{item.label}</span>
                  {item.id === 'timers' && activeEventCount > 0 && (
                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                      {activeEventCount} live
                    </span>
                  )}
                </div>
                <div className="hidden truncate text-[11px] text-slate-500 lg:block">{item.desc}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-obsidian-700/80 p-4 text-[11px] text-slate-500 lg:block">
        <div className="font-medium text-slate-300">Scenarios Supported</div>
        <div className="mt-1 flex flex-wrap gap-1">
          <span className="rounded bg-obsidian-800 px-1.5 py-0.5 text-slate-400">Manibus</span>
          <span className="rounded bg-obsidian-800 px-1.5 py-0.5 text-slate-400">Way of Winter</span>
          <span className="rounded bg-obsidian-800 px-1.5 py-0.5 text-slate-400">Isles of Abyss</span>
        </div>
      </div>
    </aside>
  );
}

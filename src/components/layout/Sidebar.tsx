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
  { id: 'encyclopedia', label: 'Encyclopedia', desc: 'Weapons, gear, recipes', icon: BookOpen },
  { id: 'timers', label: 'Event Timers', desc: 'Cargo, Prime War, resets', icon: Clock },
];

export function Sidebar({ activeTab, onSelectTab, onOpenSearch, activeEventCount }: SidebarProps) {
  return (
    <aside className="flex w-full flex-col border-b border-obsidian-800 bg-obsidian-900/70 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2.5 border-b border-obsidian-800 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-obsidian-700 bg-obsidian-800 text-stardust-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide text-white">MetaBible</div>
          <div className="text-[11px] text-slate-500">Once Human Companion</div>
        </div>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center justify-between rounded-lg border border-obsidian-800 bg-obsidian-950/70 px-3 py-2 text-xs text-slate-400 transition hover:border-obsidian-700 hover:text-slate-200"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            Search...
          </span>
          <kbd className="rounded border border-obsidian-800 bg-obsidian-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
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
                'flex shrink-0 items-center gap-3 rounded-lg border px-3 py-2 text-left transition lg:w-full',
                active
                  ? 'border-obsidian-700 bg-obsidian-800/85 text-white'
                  : 'border-transparent text-slate-400 hover:bg-obsidian-800/40 hover:text-slate-200',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-stardust-400' : 'text-slate-500')} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-[13px] font-medium">
                  <span className="truncate">{item.label}</span>
                  {item.id === 'timers' && activeEventCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400" title={`${activeEventCount} live`} />
                  )}
                </div>
                <div className="hidden truncate text-[11px] text-slate-500 lg:block">{item.desc}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-obsidian-800 px-4 py-3 text-[11px] text-slate-500 lg:block">
        Manibus · Way of Winter · Isles of Abyss
      </div>
    </aside>
  );
}

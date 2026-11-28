import { Search } from 'lucide-react';
import type { NavTab } from '../../types/game';
import { GameIcon } from '../../data/gameIcons';
import { cn } from '../../utils/cn';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSearch: () => void;
  activeEventCount: number;
}

/** Each feature is a transit line: a route letter and colour shared by nav and Transfers. */
export const NAV_LINES: Record<NavTab, { label: string; letter: string; bg: string }> = {
  calculator: { label: 'DPS', letter: 'D', bg: 'bg-line-dps' },
  meta: { label: 'Builds', letter: 'B', bg: 'bg-line-builds' },
  workbench: { label: 'Workbench', letter: 'W', bg: 'bg-line-workbench' },
  map: { label: 'Map', letter: 'M', bg: 'bg-line-map' },
  encyclopedia: { label: 'Encyclopedia', letter: 'E', bg: 'bg-line-enc' },
  timers: { label: 'Timers', letter: 'T', bg: 'bg-line-timers' },
};

const ORDER: NavTab[] = ['calculator', 'meta', 'workbench', 'map', 'encyclopedia', 'timers'];

/** Route mark: the feature's in-game icon inside its line-coloured ring. */
export function RouteBullet({ tab, size = 'md' }: { tab: NavTab; size?: 'sm' | 'md' }) {
  const line = NAV_LINES[tab];
  const md = size === 'md';
  return (
    <span
      aria-hidden
      className={cn('route-bullet bg-black p-[2px]', line.bg, md ? 'h-[32px] w-[32px] md:h-[36px] md:w-[36px]' : 'h-7 w-7')}
    >
      <span className="grid h-full w-full place-items-center rounded-full bg-black">
        <GameIcon id={`nav-${tab}`} size={md ? 26 : 20} />
      </span>
    </span>
  );
}

/** Top sign band: wordmark, one route bullet per feature line, and global search. */
export function Sidebar({ activeTab, onSelectTab, onOpenSearch, activeEventCount }: SidebarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-[var(--band-h)] shrink-0 items-center gap-2 border-b-[3px] border-sign-white bg-sign-black px-3 md:gap-6 md:px-6">
      <div className="shrink-0 leading-none">
        <div className="text-[19px] font-extrabold tracking-[-0.01em] text-sign-white md:text-[22px]">
          <span className="hidden sm:inline">MetaBible</span>
          <span className="sm:hidden">MB</span>
        </div>
        <div className="mt-1 hidden text-[11px] font-medium text-sign-dim lg:block">Once Human Companion</div>
      </div>

      <nav aria-label="Features" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 py-1 [scrollbar-width:none] md:gap-2 lg:gap-5">
        {ORDER.map((tab) => {
          const active = activeTab === tab;
          const line = NAV_LINES[tab];
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              aria-current={active ? 'page' : undefined}
              aria-label={line.label}
              className={cn(
                'relative flex shrink-0 items-center gap-2 rounded-full py-1 pl-0.5 text-[15px] font-semibold transition-colors md:pl-1',
                active ? 'pr-0.5 text-sign-white md:pr-3' : 'pr-0.5 text-sign-mute hover:text-sign-white md:pr-1 lg:pr-2',
              )}
            >
              <span className={cn('rounded-full', active && 'ring-2 ring-sign-white ring-offset-2 ring-offset-black')}>
                <RouteBullet tab={tab} />
              </span>
              <span className={cn(active ? 'hidden md:inline' : 'hidden lg:inline')}>{line.label}</span>
              {tab === 'timers' && activeEventCount > 0 && (
                <span
                  className="absolute left-7 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-black bg-sign-white"
                  title={`${activeEventCount} live now`}
                />
              )}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Search everything (Ctrl K)"
        className="flex h-10 shrink-0 items-center gap-3 rounded-md border-2 border-sign-seam px-3 text-[14px] text-sign-mute transition-colors hover:border-sign-white hover:text-sign-white md:w-[260px] md:justify-between"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search everything</span>
        </span>
        <kbd className="hidden text-[12px] font-semibold text-sign-dim md:inline">Ctrl K</kbd>
      </button>
    </header>
  );
}

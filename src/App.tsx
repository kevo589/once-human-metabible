import { useEffect, useMemo, useState } from 'react';
import { DpsCalculatorView } from './components/calculator/DpsCalculatorView';
import { EncyclopediaView } from './components/encyclopedia/EncyclopediaView';
import { Sidebar } from './components/layout/Sidebar';
import { InteractiveMapView } from './components/map/InteractiveMapView';
import { MetaBuildsView } from './components/meta/MetaBuildsView';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { TimersView } from './components/timers/TimersView';
import { META_BUILDS, TIMER_EVENTS } from './data/buildsAndTimers';
import type { CalculatorPreset, EncyclopediaSubTab, MetaBuild, NavTab } from './types/game';
import type { SearchEntry } from './utils/searchIndex';
import { readMapUrlParams } from './utils/mapUrlState';
import { getTimerStatus } from './utils/timers';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const p = readMapUrlParams();
    return p.pin || (typeof p.x === 'number' && typeof p.y === 'number') ? 'map' : 'calculator';
  });
  const [encSubTab, setEncSubTab] = useState<EncyclopediaSubTab>('weapons');
  const [highlightedEncId, setHighlightedEncId] = useState<string | null>(null);
  const [focusedMapId, setFocusedMapId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const [preset, setPreset] = useState<CalculatorPreset>(META_BUILDS[0].preset);
  const [activeBuildName, setActiveBuildName] = useState<string | null>(META_BUILDS[0].name);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const activeEventCount = useMemo(
    () => TIMER_EVENTS.filter((evt) => getTimerStatus(evt, now).isActive).length,
    [now],
  );

  const handleLoadMetaBuild = (build: MetaBuild) => {
    setPreset(build.preset);
    setActiveBuildName(build.name);
    setActiveTab('calculator');
  };

  const handleSearchNavigate = (entry: SearchEntry) => {
    setActiveTab(entry.targetTab);
    if (entry.targetTab === 'encyclopedia' && entry.targetSubTab) {
      setEncSubTab(entry.targetSubTab);
      setHighlightedEncId(entry.targetId);
    } else if (entry.targetTab === 'map') {
      setFocusedMapId(entry.targetId);
    } else if (entry.targetTab === 'meta') {
      const build = META_BUILDS.find((b) => b.id === entry.targetId);
      if (build) handleLoadMetaBuild(build);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-obsidian-950 text-slate-100 lg:flex-row">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSearch={() => setSearchOpen(true)}
        activeEventCount={activeEventCount}
      />

      <main
        className={
          activeTab === 'map'
            ? 'relative min-w-0 flex-1 overflow-hidden p-0'
            : 'min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8'
        }
      >
        <div className={activeTab === 'map' ? 'h-full w-full' : 'mx-auto max-w-6xl'}>
          {activeTab === 'calculator' && (
            <DpsCalculatorView
              preset={preset}
              onChangePreset={(next) => {
                setPreset(next);
                setActiveBuildName(null);
              }}
              activeBuildName={activeBuildName}
            />
          )}

          {activeTab === 'meta' && <MetaBuildsView onLoadInCalculator={handleLoadMetaBuild} />}

          {activeTab === 'map' && <InteractiveMapView focusedMarkerId={focusedMapId} />}

          {activeTab === 'encyclopedia' && (
            <EncyclopediaView
              subTab={encSubTab}
              onChangeSubTab={(t) => {
                setEncSubTab(t);
                setHighlightedEncId(null);
              }}
              highlightedId={highlightedEncId}
              onLocateOnMap={(poiId) => {
                setFocusedMapId(poiId);
                setActiveTab('map');
              }}
              onSimulateWeapon={(weapon) => {
                const matchingMeta = META_BUILDS.find((b) => b.weaponId === weapon.id);
                setPreset(matchingMeta ? matchingMeta.preset : { ...preset, weaponId: weapon.id });
                setActiveBuildName(matchingMeta ? matchingMeta.name : weapon.name);
                setActiveTab('calculator');
              }}
            />
          )}

          {activeTab === 'timers' && <TimersView />}
        </div>
      </main>

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleSearchNavigate}
      />
    </div>
  );
}

export default App;

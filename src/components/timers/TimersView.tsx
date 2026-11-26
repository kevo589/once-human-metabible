import { useEffect, useState } from 'react';
import { Bell, BellOff, Clock, Plus, Trash2 } from 'lucide-react';
import { TIMER_EVENTS } from '../../data/buildsAndTimers';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatCountdown, getTimerStatus } from '../../utils/timers';
import { Pill } from '../common/Badge';

interface PersonalTimer {
  id: string;
  label: string;
  targetEpochMs: number;
}

export function TimersView() {
  const [now, setNow] = useState(() => new Date());
  const [alertsEnabled, setAlertsEnabled] = useLocalStorage<boolean>('oh-alerts-enabled', false);
  const [personalTimers, setPersonalTimers] = useLocalStorage<PersonalTimer[]>('oh-personal-timers', []);
  const [customLabel, setCustomLabel] = useState('');
  const [customMinutes, setCustomMinutes] = useState(30);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const toggleAlerts = async () => {
    if (!alertsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    setAlertsEnabled((v) => !v);
  };

  const handleAddPersonalTimer = () => {
    const mins = Math.max(1, Math.min(1440, customMinutes));
    const label = customLabel.trim() || `Territory Timer (${mins}m)`;
    setPersonalTimers((prev) => [
      { id: `pt-${Date.now()}`, label, targetEpochMs: Date.now() + mins * 60_000 },
      ...prev,
    ]);
    setCustomLabel('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-obsidian-700/80 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Event & Reset Timers</h1>
          <p className="mt-1 text-sm text-slate-400">
            Live countdowns for Cargo Scramble, Public Crisis waves, Prime Wars, and daily/weekly resets.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleAlerts}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
            alertsEnabled
              ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
              : 'border-obsidian-700 bg-obsidian-900 text-slate-300 hover:text-white'
          }`}
        >
          {alertsEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
          {alertsEnabled ? 'Browser Alerts Armed' : 'Enable Browser Alerts'}
        </button>
      </div>

      {/* World Event Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {TIMER_EVENTS.map((evt) => {
          const status = getTimerStatus(evt, now);
          return (
            <div
              key={evt.id}
              className={`rounded-xl border p-4 transition ${
                status.isActive
                  ? 'border-emerald-400/50 bg-emerald-500/5'
                  : 'border-obsidian-700 bg-obsidian-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Pill>{evt.category}</Pill>
                    {status.isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        LIVE NOW
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 text-base font-bold text-white">{evt.name}</h2>
                </div>

                <div className="text-right">
                  <div className="text-[11px] uppercase text-slate-500">
                    {status.isActive ? 'Ends in' : 'Starts in'}
                  </div>
                  <div
                    className={`font-mono text-xl font-bold ${
                      status.isActive ? 'text-emerald-300' : 'text-stardust-glow'
                    }`}
                  >
                    {formatCountdown(
                      status.isActive ? status.secondsRemainingActive : status.secondsUntilNext,
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-300">{evt.description}</p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-obsidian-800 pt-2.5">
                <div className="flex flex-wrap gap-1">
                  {evt.rewards.map((r) => (
                    <span key={r} className="rounded bg-obsidian-950 px-2 py-0.5 text-[11px] text-slate-300">
                      {r}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">
                  Next: {status.nextStartDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Personal Territory / Food / Refinery Timers */}
      <div className="rounded-xl border border-obsidian-700 bg-obsidian-900 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
          <Clock className="h-4 w-4 text-stardust-400" />
          Personal Territory & Buff Timers
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="e.g. Brewing Barrel Corn Ale, Purification, Stardust Pump"
            className="min-w-[220px] flex-1 rounded-lg border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-stardust-400"
          />
          <input
            type="number"
            min={1}
            max={1440}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Number(e.target.value))}
            className="w-24 rounded-lg border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-xs text-white outline-none"
          />
          <button
            type="button"
            onClick={handleAddPersonalTimer}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stardust-500 px-3 py-2 text-xs font-semibold text-obsidian-950 hover:bg-stardust-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Start Timer (min)
          </button>
        </div>

        {personalTimers.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {personalTimers.map((pt) => {
              const remSec = Math.max(0, Math.ceil((pt.targetEpochMs - now.getTime()) / 1000));
              const done = remSec === 0;
              return (
                <div
                  key={pt.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs ${
                    done
                      ? 'border-amber-400/50 bg-amber-500/10'
                      : 'border-obsidian-800 bg-obsidian-950'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{pt.label}</div>
                    <div className={`font-mono text-sm ${done ? 'text-amber-300' : 'text-stardust-400'}`}>
                      {done ? 'READY' : formatCountdown(remSec)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPersonalTimers((prev) => prev.filter((x) => x.id !== pt.id))}
                    className="text-slate-500 hover:text-rose-400"
                    aria-label={`Remove ${pt.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

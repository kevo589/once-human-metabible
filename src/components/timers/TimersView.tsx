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
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 border-b border-obsidian-800 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-white">Event & Reset Timers</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Countdowns for Cargo Scramble, Public Crisis waves, Prime Wars, and daily/weekly resets.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleAlerts}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            alertsEnabled
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-obsidian-800 bg-obsidian-900 text-slate-300 hover:text-white'
          }`}
        >
          {alertsEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
          {alertsEnabled ? 'Alerts Armed' : 'Enable Alerts'}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {TIMER_EVENTS.map((evt) => {
          const status = getTimerStatus(evt, now);
          return (
            <div
              key={evt.id}
              className={`rounded-xl border p-4 transition ${
                status.isActive
                  ? 'border-emerald-500/35 bg-obsidian-900/90'
                  : 'border-obsidian-800 bg-obsidian-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Pill>{evt.category}</Pill>
                    {status.isActive && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Live
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 text-sm font-semibold text-white">{evt.name}</h2>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    {status.isActive ? 'Ends in' : 'Starts in'}
                  </div>
                  <div
                    className={`font-mono text-lg font-semibold ${
                      status.isActive ? 'text-emerald-300' : 'text-slate-100'
                    }`}
                  >
                    {formatCountdown(
                      status.isActive ? status.secondsRemainingActive : status.secondsUntilNext,
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-400">{evt.description}</p>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-obsidian-800 pt-2.5 text-[11px] text-slate-500">
                <span>{evt.rewards.join(' · ')}</span>
                <span className="shrink-0">
                  Next: {status.nextStartDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-obsidian-800 bg-obsidian-900/60 p-4">
        <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          Personal Timers
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="e.g. Brewing Barrel, Purification, Stardust Pump"
            className="min-w-[220px] flex-1 rounded-lg border border-obsidian-800 bg-obsidian-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-obsidian-600"
          />
          <input
            type="number"
            min={1}
            max={1440}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Number(e.target.value))}
            className="w-20 rounded-lg border border-obsidian-800 bg-obsidian-950 px-2.5 py-1.5 text-xs text-white outline-none"
          />
          <button
            type="button"
            onClick={handleAddPersonalTimer}
            className="inline-flex items-center gap-1.5 rounded-lg border border-obsidian-700 bg-obsidian-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-obsidian-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Start (min)
          </button>
        </div>

        {personalTimers.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {personalTimers.map((pt) => {
              const remSec = Math.max(0, Math.ceil((pt.targetEpochMs - now.getTime()) / 1000));
              const done = remSec === 0;
              return (
                <div
                  key={pt.id}
                  className="flex items-center justify-between rounded-lg border border-obsidian-800 bg-obsidian-950/60 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-200">{pt.label}</div>
                    <div className={`font-mono text-xs ${done ? 'text-amber-300' : 'text-slate-400'}`}>
                      {done ? 'READY' : formatCountdown(remSec)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPersonalTimers((prev) => prev.filter((x) => x.id !== pt.id))}
                    className="text-slate-500 hover:text-rose-400"
                    aria-label={`Remove ${pt.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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

import type { TimerEvent } from '../types/game';

export interface TimerStatus {
  isActive: boolean;
  secondsUntilNext: number;
  secondsRemainingActive: number;
  nextStartDate: Date;
}

/**
 * Computes active state and countdown seconds for interval, daily UTC, and weekly UTC events.
 */
export function getTimerStatus(event: TimerEvent, now: Date = new Date()): TimerStatus {
  const nowMs = now.getTime();
  const durationMs = event.durationMinutes * 60_000;

  if (event.scheduleType === 'interval') {
    const intervalMs = (event.intervalMinutes ?? 60) * 60_000;
    const offsetMs = (event.offsetMinutes ?? 0) * 60_000;
    const adjusted = nowMs - offsetMs;
    const elapsedInCycle = ((adjusted % intervalMs) + intervalMs) % intervalMs;

    if (elapsedInCycle < durationMs) {
      return {
        isActive: true,
        secondsUntilNext: 0,
        secondsRemainingActive: Math.ceil((durationMs - elapsedInCycle) / 1000),
        nextStartDate: new Date(nowMs - elapsedInCycle),
      };
    }

    const msUntilNext = intervalMs - elapsedInCycle;
    return {
      isActive: false,
      secondsUntilNext: Math.ceil(msUntilNext / 1000),
      secondsRemainingActive: 0,
      nextStartDate: new Date(nowMs + msUntilNext),
    };
  }

  if (event.scheduleType === 'daily') {
    const hour = event.utcHour ?? 0;
    const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, 0, 0, 0);
    let candidate = todayStart;
    if (nowMs >= todayStart + durationMs) {
      candidate = todayStart + 86_400_000;
    }

    if (nowMs >= candidate && nowMs < candidate + durationMs) {
      return {
        isActive: true,
        secondsUntilNext: 0,
        secondsRemainingActive: Math.ceil((candidate + durationMs - nowMs) / 1000),
        nextStartDate: new Date(candidate),
      };
    }

    return {
      isActive: false,
      secondsUntilNext: Math.ceil((candidate - nowMs) / 1000),
      secondsRemainingActive: 0,
      nextStartDate: new Date(candidate),
    };
  }

  // Weekly UTC schedule
  const targetDay = event.utcWeekday ?? 1;
  const targetHour = event.utcHour ?? 12;
  const currentDay = now.getUTCDay();
  const daysDiff = (targetDay - currentDay + 7) % 7;

  let candidate = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysDiff,
    targetHour,
    0,
    0,
    0,
  );
  if (nowMs >= candidate + durationMs) {
    candidate += 7 * 86_400_000;
  }

  if (nowMs >= candidate && nowMs < candidate + durationMs) {
    return {
      isActive: true,
      secondsUntilNext: 0,
      secondsRemainingActive: Math.ceil((candidate + durationMs - nowMs) / 1000),
      nextStartDate: new Date(candidate),
    };
  }

  return {
    isActive: false,
    secondsUntilNext: Math.ceil((candidate - nowMs) / 1000),
    secondsRemainingActive: 0,
    nextStartDate: new Date(candidate),
  };
}

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(clamped / 86400);
  const hours = Math.floor((clamped % 86400) / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

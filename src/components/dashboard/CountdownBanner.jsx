import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { isSameDay } from 'date-fns';

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

function getTimeRemaining(targetDate, now) {
  const diff = targetDate - now;
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, diff };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// Group deadlines that share the exact same date+time (within 1 minute)
function groupByTime(deadlines) {
  const groups = [];
  deadlines.forEach(d => {
    const t = new Date(d.date).getTime();
    const existing = groups.find(g => Math.abs(g.time - t) < 60000);
    if (existing) {
      existing.items.push(d);
    } else {
      groups.push({ time: t, items: [d] });
    }
  });
  return groups.sort((a, b) => a.time - b.time);
}

export default function CountdownBanner({ deadlines }) {
  const now = useNow();
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

  const upcoming = deadlines.filter(d => {
    if (!d.date) return false;
    const diff = new Date(d.date) - now;
    return diff > 0 && diff <= TWO_DAYS_MS;
  });

  const todayItems = deadlines.filter(d => {
    if (!d.date) return false;
    return isSameDay(new Date(d.date), now) && new Date(d.date) > now;
  });

  // Merge: today items that are also in upcoming are already covered
  // Show countdowns for upcoming (<=2 days), show today section for same-day items
  const countdownGroups = groupByTime(upcoming);

  if (countdownGroups.length === 0 && todayItems.length === 0) return null;

  const countPerGroup = countdownGroups.length;
  // Scale text based on number of groups
  const timerTextClass = countPerGroup <= 1 ? 'text-4xl' : countPerGroup <= 2 ? 'text-3xl' : countPerGroup <= 3 ? 'text-2xl' : 'text-xl';
  const titleTextClass = countPerGroup <= 1 ? 'text-sm' : countPerGroup <= 2 ? 'text-xs' : 'text-[11px]';

  return (
    <div className="space-y-3">
      {countdownGroups.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-sm font-semibold text-destructive">
              {countdownGroups.length === 1 ? 'Deadline Approaching' : `${countdownGroups.length} Deadlines Approaching`}
            </span>
          </div>
          <div className={`grid gap-4 ${countPerGroup === 1 ? 'grid-cols-1' : countPerGroup === 2 ? 'grid-cols-2' : countPerGroup <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-5'}`}>
            {countdownGroups.map((group) => {
              const remaining = getTimeRemaining(new Date(group.time), now);
              if (!remaining) return null;
              return (
                <div key={group.time} className="text-center">
                  <div className={`font-mono font-bold text-destructive ${timerTextClass} tabular-nums leading-none`}>
                    {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
                  </div>
                  <div className="text-[10px] text-destructive/60 mb-1">hrs : min : sec</div>
                  <div className={`text-muted-foreground font-medium leading-tight ${titleTextClass}`}>
                    {group.items.map((item, i) => (
                      <div key={i} className="truncate">{item.title}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {todayItems.length > 0 && (
        <div className="rounded-xl border border-amber-300/50 bg-amber-50/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-sm font-semibold text-amber-700">Happening Today</span>
          </div>
          <div className="space-y-1">
            {todayItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-amber-900">{item.title}</span>
                <span className="text-xs text-amber-700 font-mono">
                  {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
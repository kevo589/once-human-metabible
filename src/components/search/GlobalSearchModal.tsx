import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { searchCompanion, type SearchEntry } from '../../utils/searchIndex';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (entry: SearchEntry) => void;
}

export function GlobalSearchModal({ isOpen, onClose, onNavigate }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 20);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const results = useMemo(() => searchCompanion(query, 14), [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 pt-16 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-obsidian-700 bg-obsidian-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-obsidian-700 px-4 py-3">
          <Search className="h-4 w-4 text-stardust-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Fuzzy search weapons, armor, mods, deviants, recipes, POIs, bosses..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-obsidian-800 hover:text-white"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="px-3 py-8 text-center text-xs text-slate-500">
              Try searching <span className="text-slate-300">Last Valor</span>,{' '}
              <span className="text-slate-300">Polar Jelly</span>,{' '}
              <span className="text-slate-300">Blackfell</span>, or{' '}
              <span className="text-slate-300">Whimsical Drink</span>.
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-slate-500">
              No matching entries found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    onNavigate(entry);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-obsidian-800"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {entry.imageUrl && (
                      <img
                        src={entry.imageUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded border border-obsidian-700 bg-obsidian-950 object-contain p-0.5"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-obsidian-700 bg-obsidian-950 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stardust-400">
                          {entry.kind}
                        </span>
                        <span className="truncate text-sm font-medium text-white">{entry.title}</span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-400">{entry.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

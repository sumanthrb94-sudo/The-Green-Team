import { useCallback, useEffect, useState } from 'react';

/**
 * The shortlist — the heart on listing cards and the detail page. Stored in
 * localStorage only (per device, never sent anywhere), which is enough for a
 * buyer comparing three or four places over a weekend. Shared here so the
 * card and the detail page can never disagree about whether something is saved.
 */
const KEY = 'gt_shortlist';

function read(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useShortlist(id: string): [boolean, () => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(read().includes(id));
  }, [id]);
  const toggle = useCallback(() => {
    try {
      const cur = read();
      const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      setOn(next.includes(id));
    } catch {}
  }, [id]);
  return [on, toggle];
}

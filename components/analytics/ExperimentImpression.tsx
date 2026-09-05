'use client';

/**
 * Reports which A/B variant was rendered, once per page load.
 *
 * Renders nothing. Kept separate from the experiment's UI so a server
 * component can decide the variant and still get the impression logged.
 */
import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics';

export function ExperimentImpression({ id, variant }: { id: string; variant: string }) {
  const sent = useRef(false);

  useEffect(() => {
    // React 18+ mounts effects twice in dev StrictMode; without this the
    // experiment would double-count every impression locally.
    if (sent.current) return;
    sent.current = true;
    track.experiment(id, variant);
  }, [id, variant]);

  return null;
}

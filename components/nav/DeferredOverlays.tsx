'use client';

/**
 * The overlays every page carries but nobody needs during first paint: the
 * Groot chat, the welcome prompt, the cookie banner, and the sign-in and
 * profile modals.
 *
 * Imported directly into the site layout they were part of the JavaScript every
 * route downloads and hydrates before it becomes interactive. Here each one is
 * fetched only when it is about to matter:
 *
 * - Groot, the welcome prompt and the cookie banner load once the browser is
 *   idle after the page has loaded. None of them shows anything sooner than
 *   that anyway (the welcome prompt waits six seconds by design).
 * - The sign-in and profile modals load the first time they are opened, and
 *   stay mounted afterwards so their close animations still run.
 * - A "talk to Groot" click that lands before Groot has loaded is not lost:
 *   it triggers the load and is replayed once Groot is listening.
 */
import { useEffect, useRef, useState, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/auth/AuthProvider';

const AuthModal = dynamic(() => import('@/components/auth/AuthModal').then(m => m.AuthModal), { ssr: false });
const ProfileModal = dynamic(() => import('@/components/auth/ProfileModal').then(m => m.ProfileModal), {
  ssr: false,
});
const WelcomeGate = dynamic(() => import('@/components/home/WelcomeGate').then(m => m.WelcomeGate), { ssr: false });
const ConsentBanner = dynamic(() => import('@/components/legal/ConsentBanner').then(m => m.ConsentBanner), {
  ssr: false,
});

const OPEN_GROOT = 'tgt:open-groot';
const loadGroot = () => import('@/components/chat/Groot').then(m => m.Groot);

/** Runs `fn` once the page has loaded and the main thread is free, with a ceiling so it always happens. */
function whenIdle(fn: () => void): () => void {
  let idleId: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if ('requestIdleCallback' in window) idleId = window.requestIdleCallback(fn, { timeout: 2500 });
    else timer = setTimeout(fn, 1200);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  return () => {
    window.removeEventListener('load', schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timer !== undefined) clearTimeout(timer);
  };
}

export function DeferredOverlays() {
  const { authModalOpen, profileModalOpen } = useAuth();
  const [idle, setIdle] = useState(false);
  const [Groot, setGroot] = useState<ComponentType | null>(null);
  const [authUsed, setAuthUsed] = useState(false);
  const [profileUsed, setProfileUsed] = useState(false);
  const replayOpen = useRef(false);

  useEffect(() => whenIdle(() => setIdle(true)), []);

  // Fetch the sign-in modal's code ahead of time so opening it is instant.
  useEffect(() => {
    if (idle) void import('@/components/auth/AuthModal').catch(() => {});
  }, [idle]);

  useEffect(() => {
    if (authModalOpen) setAuthUsed(true);
  }, [authModalOpen]);

  useEffect(() => {
    if (profileModalOpen) setProfileUsed(true);
  }, [profileModalOpen]);

  // Load Groot at idle, or straight away if someone asks for it first.
  useEffect(() => {
    if (Groot) return;
    let cancelled = false;
    const load = () =>
      loadGroot()
        .then(C => !cancelled && setGroot(() => C))
        .catch(() => {});
    const onEarlyOpen = () => {
      replayOpen.current = true;
      void load();
    };
    window.addEventListener(OPEN_GROOT, onEarlyOpen);
    if (idle) void load();
    return () => {
      cancelled = true;
      window.removeEventListener(OPEN_GROOT, onEarlyOpen);
    };
  }, [Groot, idle]);

  // Child effects run before this one, so Groot is already listening here.
  useEffect(() => {
    if (Groot && replayOpen.current) {
      replayOpen.current = false;
      window.dispatchEvent(new CustomEvent(OPEN_GROOT));
    }
  }, [Groot]);

  return (
    <>
      {Groot && <Groot />}
      {idle && <WelcomeGate />}
      {idle && <ConsentBanner />}
      {(authModalOpen || authUsed) && <AuthModal />}
      {(profileModalOpen || profileUsed) && <ProfileModal />}
    </>
  );
}

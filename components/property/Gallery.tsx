'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!images.length) return null;

  const prev = () => setLightbox(i => (i === null ? null : (i + images.length - 1) % images.length));
  const next = () => setLightbox(i => (i === null ? null : (i + 1) % images.length));

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-on-surface/60 mb-5">
        Gallery — {images.length} photos
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => setLightbox(i)}
            className={`relative rounded-2xl overflow-hidden group ${i === 0 ? 'col-span-2 md:col-span-2 row-span-2 aspect-[4/3]' : 'aspect-[4/3]'}`}
            aria-label={`${title} — photo ${i + 1}`}
          >
            <Image
              src={src}
              alt={`${title} — photo ${i + 1}`}
              fill
              sizes={i === 0 ? '(max-width:768px) 100vw, 66vw' : '(max-width:768px) 50vw, 33vw'}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              loading={i < 4 ? 'eager' : 'lazy'}
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/95 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button
              aria-label="Close"
              className="absolute top-5 right-5 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
              onClick={() => setLightbox(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <button
              aria-label="Previous"
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-3 md:left-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightbox]}
              alt={`${title} — photo ${lightbox + 1}`}
              className="max-h-[88vh] max-w-[92vw] object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              aria-label="Next"
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-3 md:right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <p className="absolute bottom-6 text-white/50 text-xs tracking-widest">
              {lightbox + 1} / {images.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

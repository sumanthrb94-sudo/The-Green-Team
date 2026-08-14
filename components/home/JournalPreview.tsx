import Link from 'next/link';
import { Clock, ArrowUpRight } from 'lucide-react';
import { JOURNAL_POSTS } from '@/lib/data/journal';

/** Journal section — featured + secondary cards, each linking to a real /blog/[slug] page. */
export function JournalPreview({ limit = 7 }: { limit?: number }) {
  const [featured, ...rest] = JOURNAL_POSTS.slice(0, limit);

  return (
    <section id="journal" className="py-20 px-6 md:px-24 bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">
              The Journal
            </span>
            <h2 className="text-4xl md:text-6xl font-light text-on-surface">
              Sanctuary <span className="font-serif italic text-primary">intelligence.</span>
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] font-bold text-secondary/60 hover:text-primary transition-colors"
          >
            All articles <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1.35fr_0.85fr] gap-5">
          <JournalCard post={featured} featured />
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-5">
            {rest.slice(0, 4).map(p => (
              <JournalCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function JournalCard({
  post,
  featured = false,
}: {
  post: (typeof JOURNAL_POSTS)[number];
  featured?: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.id}`}
      className={`group relative rounded-3xl overflow-hidden flex flex-col justify-end p-7 transition-transform duration-500 hover:-translate-y-1 ${
        featured ? 'min-h-[26rem] lg:min-h-[34rem]' : 'min-h-[15rem]'
      }`}
      style={{
        background:
          'radial-gradient(circle at 20% 15%, rgba(163,177,138,0.16), transparent 45%), radial-gradient(circle at 85% 80%, rgba(200,169,81,0.10), transparent 40%), linear-gradient(150deg, #1a2410 0%, #2d3a1d 55%, #0f150c 100%)',
      }}
    >
      <span className="absolute top-6 left-7 text-[8px] uppercase tracking-[0.4em] font-bold text-white/40">
        {post.category}
      </span>
      <h3
        className={`font-headline font-bold text-[#e0dace] leading-snug mb-3 group-hover:text-white transition-colors ${
          featured ? 'text-2xl md:text-4xl max-w-xl' : 'text-lg'
        }`}
      >
        {post.title}
      </h3>
      {featured && <p className="text-white/45 text-sm md:text-base max-w-lg mb-4">{post.excerpt}</p>}
      <div className="flex items-center gap-4 text-white/35 text-[9px] uppercase tracking-[0.25em] font-bold">
        <span>{post.date}</span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> {post.readTime}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[#a3b18a] group-hover:translate-x-0.5 transition-transform">
          Read post <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

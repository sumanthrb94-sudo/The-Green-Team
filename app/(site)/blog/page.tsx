import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, ArrowUpRight } from 'lucide-react';
import { JOURNAL_POSTS } from '@/lib/data/journal';
import { NewsletterHighlight } from '@/components/home/NewsletterHighlight';
import { Footer } from '@/components/Footer';
import { SITE_URL } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'The Journal — Sanctuary Intelligence',
  description:
    'Market notes, decision frameworks, and location intelligence for forest-adjacent property in Hyderabad: AQI as an investment signal, corridor thinking, pre-investor pricing, and more.',
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default function BlogIndexPage() {
  return (
    <>
      <section className="px-6 md:px-24 pt-16 pb-20 max-w-7xl mx-auto">
        <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">The Journal</span>
        <h1 className="text-5xl md:text-7xl font-light text-on-surface mb-14">
          Sanctuary <span className="font-serif italic text-primary">intelligence.</span>
        </h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {JOURNAL_POSTS.map(post => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="group flex flex-col justify-between rounded-3xl border border-outline/15 bg-surface-container-low p-7 min-h-[15rem] hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
            >
              <div>
                <p className="text-[8px] uppercase tracking-[0.4em] font-bold text-primary/60 mb-4">{post.category}</p>
                <h2 className="text-xl font-headline font-bold text-on-surface leading-snug group-hover:text-primary transition-colors mb-3">
                  {post.title}
                </h2>
                <p className="text-sm text-secondary/80 leading-relaxed line-clamp-3">{post.excerpt}</p>
              </div>
              <div className="flex items-center gap-4 mt-6 text-secondary/50 text-[9px] uppercase tracking-[0.25em] font-bold">
                <span>{post.date}</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {post.readTime}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <NewsletterHighlight />
      <Footer />
    </>
  );
}

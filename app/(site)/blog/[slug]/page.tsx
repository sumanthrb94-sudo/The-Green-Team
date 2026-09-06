import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { JOURNAL_POSTS, getPost } from '@/lib/data/journal';
import { Footer } from '@/components/Footer';
import { SITE_URL } from '@/lib/data/contact';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return JOURNAL_POSTS.map(p => ({ slug: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `${SITE_URL}/blog/${post.id}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${post.id}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'The Green Team', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'The Green Team' },
    mainEntityOfPage: `${SITE_URL}/blog/${post.id}`,
  };

  const related = JOURNAL_POSTS.filter(p => p.id !== post.id).slice(0, 3);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-3xl mx-auto px-6 pt-14 pb-20">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] font-bold text-secondary/60 hover:text-primary transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> The Journal
        </Link>

        <p className="text-[9px] uppercase tracking-[0.5em] font-bold text-primary/70 mb-4">{post.category}</p>
        <h1 className="text-4xl md:text-5xl font-light text-on-surface leading-tight mb-6">{post.title}</h1>
        <div className="flex items-center gap-5 text-secondary/50 text-[10px] uppercase tracking-[0.25em] font-bold mb-10 pb-10 border-b border-outline/15">
          <span>{post.date}</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {post.readTime}
          </span>
        </div>

        <p className="font-serif italic text-2xl text-on-surface/85 leading-relaxed mb-10">{post.excerpt}</p>

        <div className="space-y-7 text-lg font-light text-on-surface/80 leading-[1.85]">
          {post.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <aside className="mt-14 p-8 rounded-3xl bg-primary/5 border border-primary/15">
          <p className="text-[9px] uppercase tracking-[0.5em] font-bold text-primary mb-5">Key takeaways</p>
          <ul className="space-y-3">
            {post.takeaways.map(t => (
              <li key={t} className="flex gap-3 text-on-surface/80">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </aside>

        <div className="mt-16">
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-secondary/50 mb-5">Keep reading</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map(p => (
              <Link
                key={p.id}
                href={`/blog/${p.id}`}
                className="group p-5 rounded-2xl border border-outline/15 hover:border-primary/40 transition-all"
              >
                <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-primary/60 mb-2">{p.category}</p>
                <p className="text-sm font-bold text-on-surface leading-snug group-hover:text-primary transition-colors">
                  {p.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
}

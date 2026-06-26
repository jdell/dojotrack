import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { getPostBySlug, getPostsByCategory } from "@/lib/blog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    const t = await getTranslations({ locale, namespace: "Blog" });
    return { title: `${t("blogTitle")} - EntrenaDojo` };
  }
  return {
    title: `${post.title} - EntrenaDojo`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Blog");
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getPostsByCategory(post.category)
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: post.author },
    datePublished: post.date,
    publisher: {
      "@type": "Organization",
      name: "EntrenaDojo",
      url: "https://entrenadojo.es",
    },
  };

  const formattedDate = new Date(post.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
          >
            <ArrowLeft size={15} />
            {t("backToBlog")}
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="mx-auto max-w-3xl px-6 py-16">
        {/* Article header */}
        <div className="mb-10">
          <span className="inline-block rounded-full bg-brand-teal/10 px-3 py-0.5 text-xs font-semibold text-brand-teal">
            {post.category}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <time dateTime={post.date}>{formattedDate}</time>
            <span aria-hidden="true">&middot;</span>
            <span>{post.author}</span>
            <span aria-hidden="true">&middot;</span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {t("readTime", { minutes: post.readTimeMinutes })}
            </span>
          </div>
        </div>

        {/* Article body */}
        <div
          className={[
            "max-w-none",
            "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-brand-navy [&_h2]:mt-8 [&_h2]:mb-3",
            "dark:[&_h2]:text-brand-teal",
            "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-brand-navy [&_h3]:mt-6 [&_h3]:mb-2",
            "dark:[&_h3]:text-brand-teal",
            "[&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1",
            "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1",
            "[&_li]:text-muted-foreground [&_li]:leading-relaxed",
            "[&_strong]:text-foreground [&_strong]:font-semibold",
            "[&_a]:text-brand-teal [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-brand-navy",
            "[&_blockquote]:border-l-4 [&_blockquote]:border-brand-teal [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-6",
          ].join(" ")}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* CTA banner */}
      <section className="bg-brand-navy py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {t("blogCta")}
          </h2>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("blogCtaButton")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-8 text-2xl font-bold text-brand-navy">
            {t("relatedPosts")}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/blog/${related.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-lg"
              >
                <div className="flex flex-1 flex-col p-6">
                  <span className="mb-3 inline-block w-fit rounded-full bg-brand-teal/10 px-3 py-0.5 text-xs font-semibold text-brand-teal">
                    {related.category}
                  </span>
                  <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-teal transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {related.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <time dateTime={related.date}>
                      {new Date(related.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {t("readTime", { minutes: related.readTimeMinutes })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <Logo />
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-brand-navy"
          >
            {t("backToHome")}
          </Link>
        </div>
      </footer>
    </div>
  );
}

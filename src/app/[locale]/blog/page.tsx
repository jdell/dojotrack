import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { ArrowLeft } from "lucide-react";
import { getAllPosts, getAllCategories } from "@/lib/blog";
import { BlogFilter } from "./blog-filter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  return {
    title: `${t("blogTitle")} - EntrenaDojo`,
    description: t("blogSubtitle"),
  };
}

export default async function BlogIndexPage() {
  const t = await getTranslations("Blog");
  const posts = getAllPosts();
  const categories = getAllCategories();

  const serializedPosts = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    date: p.date,
    category: p.category,
    readTimeMinutes: p.readTimeMinutes,
    author: p.author,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-6">
            <span className="text-sm font-semibold text-brand-navy">
              {t("blogTitle")}
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-navy"
            >
              <ArrowLeft size={15} />
              {t("backToHome")}
            </Link>
          </nav>
        </div>
      </header>

      {/* Title */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-brand-navy sm:text-5xl">
          {t("blogTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t("blogSubtitle")}
        </p>
      </section>

      {/* Filter + Grid (client component) */}
      <main className="mx-auto max-w-6xl px-6 pb-24">
        <BlogFilter categories={categories} posts={serializedPosts} />
      </main>

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

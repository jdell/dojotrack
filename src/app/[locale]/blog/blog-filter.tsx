"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Clock } from "lucide-react";

interface BlogFilterProps {
  categories: string[];
  posts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    category: string;
    readTimeMinutes: number;
    author: string;
  }>;
}

export function BlogFilter({ categories, posts }: BlogFilterProps) {
  const t = useTranslations("Blog");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = selected
    ? posts.filter((p) => p.category === selected)
    : posts;

  return (
    <>
      {/* Category pills */}
      <div className="mb-10 flex flex-wrap gap-2">
        <button
          onClick={() => setSelected(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selected === null
              ? "bg-brand-teal text-white"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
          }`}
        >
          {t("allCategories")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selected === cat
                ? "bg-brand-teal text-white"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Post grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-lg"
          >
            <div className="flex flex-1 flex-col p-6">
              {/* Category badge */}
              <span className="mb-3 inline-block w-fit rounded-full bg-brand-teal/10 px-3 py-0.5 text-xs font-semibold text-brand-teal">
                {post.category}
              </span>

              {/* Title */}
              <h2 className="text-lg font-bold text-brand-navy group-hover:text-brand-teal transition-colors line-clamp-2">
                {post.title}
              </h2>

              {/* Excerpt */}
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {post.excerpt}
              </p>

              {/* Date + read time */}
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {t("readTime", { minutes: post.readTimeMinutes })}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">
          {t("noPosts")}
        </p>
      )}
    </>
  );
}

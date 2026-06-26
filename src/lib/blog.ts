export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML string
  author: string;
  date: string; // ISO date
  category: string;
  tags: string[];
  coverImage?: string;
  /** Reading time in minutes — computed from content length. */
  readTimeMinutes: number;
}

import { blogPosts } from "@/data/blog-posts";

/** Estimate reading time from HTML content (~200 words per minute for Spanish). */
function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** All posts, sorted by date descending. */
export function getAllPosts(): BlogPost[] {
  return [...blogPosts]
    .map((p) => ({ ...p, readTimeMinutes: estimateReadTime(p.content) }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Single post by slug, or null if not found. */
export function getPostBySlug(slug: string): BlogPost | null {
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return null;
  return { ...post, readTimeMinutes: estimateReadTime(post.content) };
}

/** All posts in a given category, sorted by date descending. */
export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category);
}

/** All unique categories across posts. */
export function getAllCategories(): string[] {
  return [...new Set(blogPosts.map((p) => p.category))];
}

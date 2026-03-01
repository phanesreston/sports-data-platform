"use client";

import { Newspaper } from "lucide-react";
import { getNewsForTags, type NewsCategory } from "@/data/sampleNews";

const CATEGORY_STYLES: Record<NewsCategory, { label: string; color: string; bg: string }> = {
  transfer: { label: "Transfer", color: "text-purple-700", bg: "bg-purple-50" },
  injury:   { label: "Injury",   color: "text-red-700",    bg: "bg-red-50" },
  match:    { label: "Match",    color: "text-blue-700",   bg: "bg-blue-50" },
  preview:  { label: "Preview",  color: "text-indigo-700", bg: "bg-indigo-50" },
  analysis: { label: "Analysis", color: "text-cyan-700",   bg: "bg-cyan-50" },
  general:  { label: "News",     color: "text-gray-600",   bg: "bg-gray-100" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function NewsFeed({ tags }: { tags: string[] }) {
  const items = getNewsForTags(tags);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-bg-border bg-bg-card py-16 text-center shadow-sm">
        <Newspaper className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm font-semibold text-gray-400">No news yet</p>
        <p className="mt-1 text-xs text-gray-300">Check back soon for the latest updates</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const cat = CATEGORY_STYLES[item.category];
        return (
          <article
            key={item.id}
            className="rounded-xl border border-bg-border bg-bg-card p-4 shadow-sm transition-colors hover:border-gray-300"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cat.bg} ${cat.color}`}>
                {cat.label}
              </span>
              <span className="text-xs text-gray-400">{item.source}</span>
              <span className="ml-auto shrink-0 text-xs text-gray-400">{timeAgo(item.publishedAt)}</span>
            </div>
            <h3 className="text-sm font-semibold leading-snug text-gray-800">{item.headline}</h3>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-400">{item.summary}</p>
          </article>
        );
      })}
    </div>
  );
}

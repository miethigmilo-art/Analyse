'use client';

interface NewsItem {
  id: string; headline: string; summary: string;
  source: string; url: string; datetime: number; sentiment: string;
}

function timeSince(ts: number) {
  const diff = Date.now() - ts * 1000;
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  return h < 24 ? `${h}h ago` : `${d}d ago`;
}

export default function NewsPanel({ news }: { news: unknown[] }) {
  const items = news as NewsItem[];
  if (items.length === 0) return (
    <div className="text-center py-12 text-[#475569]">No recent news found</div>
  );

  return (
    <div className="space-y-3">
      {items.map(n => (
        <a
          key={n.id}
          href={n.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 rounded-xl bg-[#141c2e] border border-[#1e2d4a] hover:border-blue-500/30 hover:bg-[#1a2340] transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white leading-snug mb-1 line-clamp-2">{n.headline}</h4>
              {n.summary && (
                <p className="text-xs text-[#94a3b8] line-clamp-2">{n.summary}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[#475569]">{n.source}</span>
            <span className="text-xs text-[#1e2d4a]">·</span>
            <span className="text-xs text-[#475569]">{timeSince(n.datetime)}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

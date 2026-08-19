import { Check, Copy, Search, Share2 } from "lucide-react";
import { useState } from "react";

type ArticleShareActionsProps = { title: string; onSearch: () => void };

export function ArticleShareActions({ title, onSearch }: ArticleShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, text: `阅读：${title}`, url: window.location.href }); return; } catch { return; }
    }
    await copyLink();
  };

  return <div className="flex flex-wrap items-center gap-2" aria-label="搜索与分享"><button type="button" onClick={onSearch} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.2] px-3 py-1.5 text-xs text-[#d0cfca] transition-colors hover:border-[#d0f4ee] hover:text-[#d0f4ee]"><Search size={13} />搜索文章</button><button type="button" onClick={() => void share()} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.2] px-3 py-1.5 text-xs text-[#d0cfca] transition-colors hover:border-[#d0f4ee] hover:text-[#d0f4ee]"><Share2 size={13} />分享</button><button type="button" onClick={() => void copyLink()} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.2] px-3 py-1.5 text-xs text-[#d0cfca] transition-colors hover:border-[#d0f4ee] hover:text-[#d0f4ee]">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "已复制" : "复制链接"}</button></div>;
}

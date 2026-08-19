import { ArrowUpRight, Github, Mail, Radio } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { resolveSiteSettings } from "@/lib/siteSettings";

type AuthorIdentityCardProps = {
  compact?: boolean;
  showStatus?: boolean;
  className?: string;
};

/**
 * 站点作者的单一可维护展示组件。资料和状态来自公开站点设置，读取失败时才回退到稳定品牌配置。
 */
export function AuthorIdentityCard({ compact = false, showStatus = true, className = "" }: AuthorIdentityCardProps) {
  const { data: persistedSettings } = trpc.site.settings.useQuery(undefined, { staleTime: 1000 * 60 * 5 });
  const { author, avatarAlt, avatarSrc } = resolveSiteSettings(persistedSettings);

  return (
    <section className={`author-identity-card border border-white/[0.22] bg-[#40515c]/48 p-5 backdrop-blur-md sm:p-6 ${className}`} aria-label={`${author.name} 的作者资料`}>
      <div className="flex items-start gap-4">
        <img src={avatarSrc} alt={avatarAlt} className={`${compact ? "h-12 w-12" : "h-16 w-16"} shrink-0 rounded-[1rem] border border-[#d0f4ee]/60 object-cover`} />
        <div className="min-w-0">
          <p className="editorial-kicker">作者</p>
          <p className="mt-1 text-lg font-medium text-[#fff8ed]">{author.name}</p>
          <p className="mt-1 text-xs text-[#d0cfca]">{author.label}</p>
        </div>
      </div>

      {!compact && <p className="mt-5 text-sm leading-7 text-[#e5e2db]">{author.introduction}</p>}

      {!compact && <div className="mt-4 flex flex-wrap gap-2" aria-label="作者关注方向">{author.interests.map((interest) => <span key={interest} className="rounded-full border border-white/[0.18] px-2.5 py-1 font-mono text-[9px] tracking-[0.08em] text-[#d6fbfc]">{interest}</span>)}</div>}

      {showStatus && <div className="mt-5 border-t border-white/[0.18] pt-4"><div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.08em] text-[#d0f4ee]"><Radio size={12} />{author.now.label}</p><span className="shrink-0 text-[10px] text-[#bfc4c3]">{author.now.updatedLabel}</span></div><p className="mt-2 text-sm leading-6 text-[#f0ede7]">{author.now.text}</p></div>}

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-3 border-t border-white/[0.18] pt-4">
        <a href={author.contact.github.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 border-b border-transparent pb-1 text-xs text-[#d0cfca] transition-colors hover:border-[#d0f4ee] hover:text-[#d0f4ee]" aria-label={`在 GitHub 打开 ${author.contact.github.handle}`}><Github size={13} />{author.contact.github.label}<ArrowUpRight size={12} /></a>
        <a href={author.contact.email.href} className="inline-flex items-center gap-1.5 border-b border-transparent pb-1 text-xs text-[#d0cfca] transition-colors hover:border-[#d0f4ee] hover:text-[#d0f4ee]" aria-label={`通过 Email 联系 ${author.name}`}><Mail size={13} />{author.contact.email.label}</a>
      </div>
    </section>
  );
}

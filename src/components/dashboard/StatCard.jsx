import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "burgundy",
}) {
  const tones = {
    burgundy: {
      accent: "text-[#6B2D3C]",
      border: "border-l-[#6B2D3C]",
      bg: "bg-[#6B2D3C]/5",
    },
    gold: {
      accent: "text-[#C9A227]",
      border: "border-l-[#C9A227]",
      bg: "bg-[#C9A227]/10",
    },
    green: {
      accent: "text-[#3D6B4F]",
      border: "border-l-[#3D6B4F]",
      bg: "bg-[#3D6B4F]/10",
    },
    charcoal: {
      accent: "text-[#2B2B2B]",
      border: "border-l-[#2B2B2B]/40",
      bg: "bg-[#2B2B2B]/5",
    },
  };

  const currentTone = tones[tone] || tones.burgundy;

  return (
    <Card
      className={`rounded-xl border border-[#2B2B2B]/10 border-l-[3px] ${currentTone.border} bg-white p-5 shadow-none transition-colors hover:bg-[#FAF7F2]/40`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-[#2B2B2B]/60">
            {title}
          </span>
          <p className="mt-2 font-serif text-2xl font-normal tracking-tight text-[#2B2B2B] sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2B2B2B]/10 ${currentTone.bg} ${currentTone.accent}`}
        >
          <Icon size={19} aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t border-[#2B2B2B]/10 pt-3 text-xs text-[#2B2B2B]/55">
        <ArrowUpRight size={13} className={currentTone.accent} aria-hidden="true" />
        <span>{description}</span>
      </div>
    </Card>
  );
}
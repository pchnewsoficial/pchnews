import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function Brand({
  tone = "dark",
  withSlogan = true,
  className,
}: {
  tone?: "dark" | "light";
  withSlogan?: boolean;
  className?: string;
}) {
  return (
    <Link
      to="/"
      aria-label="PCH News — página inicial"
      className={cn("flex items-center gap-2.5", className)}
    >
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-sm bg-primary font-display text-lg font-black text-primary-foreground"
      >
        P
      </span>
      <span className="min-w-0 leading-none">
        <span
          className={cn(
            "block font-display text-xl font-black tracking-tight",
            tone === "dark" ? "text-ink-foreground" : "text-foreground",
          )}
        >
          PCH<span className="text-primary">.</span>News
        </span>
        {withSlogan ? (
          <span
            className={cn(
              "mt-1 block truncate text-[11px] italic",
              tone === "dark" ? "text-ink-foreground/60" : "text-muted-foreground",
            )}
          >
            Notícias para libertar a mente
          </span>
        ) : null}
      </span>
    </Link>
  );
}

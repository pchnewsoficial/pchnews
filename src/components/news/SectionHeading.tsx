import type { ReactNode } from "react";

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rule-strong mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 pb-2">
      <div className="min-w-0">
        <h2 className="font-display text-2xl font-black sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

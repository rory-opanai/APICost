import { cx } from "@/components/ui/cx";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-ink-200/70 bg-white/70 shadow-card backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  right
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-200/60 px-5 py-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-ink-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink-600">{description}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("px-5 py-4", className)}>{children}</div>;
}


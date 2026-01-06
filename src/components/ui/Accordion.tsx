import { cx } from "@/components/ui/cx";

export function Accordion({
  items
}: {
  items: Array<{ title: string; content: React.ReactNode }>;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <details key={item.title} className="rounded-2xl border border-ink-200/70 bg-white/70 px-4 py-3">
          <summary className={cx("cursor-pointer select-none text-sm font-medium text-ink-900")}>
            {item.title}
          </summary>
          <div className="mt-2 text-sm text-ink-700">{item.content}</div>
        </details>
      ))}
    </div>
  );
}


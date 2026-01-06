import { cx } from "@/components/ui/cx";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      {...props}
      className={cx(
        "h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm",
        "placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-sky-300",
        className
      )}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { className?: string }) {
  return <label {...props} className={cx("text-sm font-medium text-ink-800", className)} />;
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-ink-500">{children}</p>;
}


import type { ButtonHTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type BtnVariant = "primary" | "secondary" | "ghost";

export function Btn({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium",
        "transition-[background-color,box-shadow,color,transform,opacity] duration-150 ease-out",
        "active:not-disabled:scale-[0.96] disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        variant === "primary" && "bg-accent text-accent-fg hover:bg-accent/90",
        variant === "secondary" &&
          "border border-border bg-bg-elevated text-fg shadow-border hover:border-border-strong hover:bg-bg-subtle",
        variant === "ghost" && "text-fg-muted hover:bg-bg-subtle hover:text-fg",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-bg p-1 shadow-border">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-10 rounded-sm px-2 text-sm font-medium transition-colors duration-150",
              active ? "bg-accent text-accent-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function SwitchRow({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: ReactNode;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm text-fg">
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors duration-150",
          checked ? "bg-accent" : "bg-bg shadow-border",
        )}
      >
        <i
          className={cn(
            "absolute top-0.5 size-5 rounded-full transition-transform duration-150 ease-out",
            checked ? "translate-x-4 bg-accent-fg" : "translate-x-0.5 bg-fg-muted",
          )}
        />
      </button>
    </label>
  );
}

export function Modal({
  title,
  kicker,
  children,
  onClose,
  wide,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
  onClose?: () => void;
  wide?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-bg/70 px-4 backdrop-blur-[2px]">
      {onClose && (
        <button type="button" aria-label="Cerrar" className="absolute inset-0" onClick={onClose} />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "modal-panel relative w-full overflow-y-auto rounded-xl border border-border bg-bg-elevated p-5 shadow-elevated",
          "max-h-[min(40rem,calc(100dvh-2rem))]",
          wide ? "max-w-md" : "max-w-sm",
        )}
      >
        {(kicker || title) && (
          <div className={cn("mb-4", onClose && "pr-10")}>
            {kicker && (
              <p className="text-micro font-medium tracking-[0.22em] text-fg-subtle uppercase">
                {kicker}
              </p>
            )}
            <h2 id="modal-title" className="font-display text-2xl leading-tight font-semibold tracking-tight text-fg">
              {title}
            </h2>
          </div>
        )}
        {onClose && (
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-fg-muted hover:text-fg"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="block text-xs font-medium tracking-wide text-fg-muted">
      <p>{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

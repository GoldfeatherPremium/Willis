import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "accent" | "warm" | "success" | "error" | "muted";

const tones: Record<Tone, string> = {
  default: "bg-surface border text-primary",
  accent: "bg-accent-soft text-accent border-accent/20",
  warm: "bg-warm/10 text-warm border-warm/25",
  success: "bg-success/10 text-success border-success/25",
  error: "bg-error/10 text-error border-error/25",
  muted: "bg-bg-secondary text-secondary border"
};

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

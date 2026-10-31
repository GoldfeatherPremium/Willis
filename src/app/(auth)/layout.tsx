import Link from "next/link";
import { Icon } from "@/components/brand/icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Icon className="h-7 w-7" />
          <span className="font-display text-lg font-bold tracking-tight text-primary">HomeAtlas</span>
        </Link>
        <Link href="/" className="text-sm text-secondary transition-colors hover:text-primary">
          ← Back to site
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-card border bg-surface/60 p-8 shadow-card">
          {children}
        </div>
      </main>
    </div>
  );
}

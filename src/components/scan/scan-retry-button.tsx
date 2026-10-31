"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScanRetryButton({ scanId }: { scanId: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function retry() {
    setLoading(true);
    try {
      await fetch(`/api/v1/scans/${scanId}/process`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="secondary" onClick={retry} loading={loading}>
      <RotateCw className="h-3.5 w-3.5" /> Retry
    </Button>
  );
}

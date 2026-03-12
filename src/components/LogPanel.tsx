"use client";

import { useEffect, useRef } from "react";
import { LogEntry } from "@/lib/types";

interface LogPanelProps {
  logs: LogEntry[];
}

export default function LogPanel({ logs }: LogPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-400">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand" />
        Analysis Log
      </h3>
      <div className="log-panel max-h-48 space-y-1.5 overflow-y-auto font-mono text-xs">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span className="shrink-0 text-gray-600">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span
              className={
                log.type === "success"
                  ? "text-brand"
                  : log.type === "error"
                  ? "text-red-400"
                  : "text-gray-300"
              }
            >
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

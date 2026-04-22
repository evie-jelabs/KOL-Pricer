"use client";

import { useState, useCallback, FormEvent } from "react";
import { AnalysisResult, LogEntry, HistoryItem } from "@/lib/types";
import LogPanel from "@/components/LogPanel";
import DataSummary from "@/components/DataSummary";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import PriceCard from "@/components/PriceCard";
import PriceRange from "@/components/PriceRange";
import FormulaCard from "@/components/FormulaCard";
import ClaudeInsightCard from "@/components/ClaudeInsightCard";
import HistoryPanel from "@/components/HistoryPanel";

export default function ToolPage() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const analyze = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!handle.trim() || loading) return;

      setLoading(true);
      setLogs([]);
      setResult(null);
      setError(null);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: handle.trim() }),
        });

        if (res.status === 429) {
          setError("Rate limit exceeded. Please wait a minute and try again.");
          setLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setError("Failed to connect to analysis stream");
          setLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const dataMatch = line.match(/^data: (.+)$/m);
            if (!dataMatch) continue;

            try {
              const parsed = JSON.parse(dataMatch[1]);
              if (parsed.type === "log") {
                setLogs((prev) => [...prev, parsed.log]);
              } else if (parsed.type === "result") {
                const analysisResult = parsed.data as AnalysisResult;
                setResult(analysisResult);
                setHistory((prev) => {
                  const newItem: HistoryItem = {
                    handle: handle.trim().replace(/^@/, ""),
                    result: analysisResult,
                    timestamp: new Date().toISOString(),
                  };
                  return [newItem, ...prev].slice(0, 10);
                });
              } else if (parsed.type === "error") {
                setError(parsed.error);
              }
            } catch {
              // skip malformed SSE data
            }
          }
        }
      } catch {
        setError("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [handle, loading]
  );

  const loadFromHistory = (item: HistoryItem) => {
    setHandle(item.handle);
    setResult(item.result);
    setError(null);
    setLogs([]);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-outfit text-3xl font-bold text-white">
          KOL Tweet <span className="text-brand">Pricing Tool</span>
        </h1>
        <p className="mt-2 text-gray-400">
          Enter an X handle to calculate the estimated sponsored tweet price
        </p>
      </div>

      {/* Search */}
      <form onSubmit={analyze} className="mx-auto mb-8 max-w-xl">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              @
            </span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="username or x.com/username"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 py-3 pl-9 pr-4 font-mono text-white placeholder-gray-600 outline-none transition-colors focus:border-brand"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !handle.trim()}
            className="rounded-xl bg-brand px-6 py-3 font-medium text-gray-900 transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Analyzing...
              </span>
            ) : (
              "Analyze"
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mx-auto mb-6 max-w-xl rounded-xl border border-red-800/50 bg-red-950/50 px-4 py-3 text-center text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Log Panel */}
      {(loading || logs.length > 0) && (
        <div className="mx-auto mb-8 max-w-xl">
          <LogPanel logs={logs} />
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <DataSummary result={result} />
          <div className="grid gap-6 lg:grid-cols-2">
            <PriceCard pricing={result.pricing} domain={result.domain} />
            <ScoreBreakdown scores={result.scores} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <PriceRange pricing={result.pricing} />
            <FormulaCard
              pricing={result.pricing}
              domain={result.domain}
              claudeAnalysis={result.claudeAnalysis}
            />
          </div>
          {result.claudeAnalysis && (
            <ClaudeInsightCard analysis={result.claudeAnalysis} />
          )}
        </div>
      )}

      {/* History */}
      <div className="mt-8">
        <HistoryPanel history={history} onSelect={loadFromHistory} />
      </div>
    </div>
  );
}

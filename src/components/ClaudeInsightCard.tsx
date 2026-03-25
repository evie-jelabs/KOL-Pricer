import { ClaudeAnalysis } from "@/lib/types";
import Card from "./Card";

interface Props {
  analysis: ClaudeAnalysis;
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const color =
    score >= 85
      ? "text-green-400 border-green-400/30 bg-green-400/10"
      : score >= 70
        ? "text-blue-400 border-blue-400/30 bg-blue-400/10"
        : score >= 55
          ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
          : score >= 40
            ? "text-orange-400 border-orange-400/30 bg-orange-400/10"
            : "text-red-400 border-red-400/30 bg-red-400/10";

  return (
    <div className={`rounded-lg border p-3 ${color}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold">{score}</p>
    </div>
  );
}

function Tag({ label, variant }: { label: string; variant: "identity" | "capability" }) {
  const style =
    variant === "identity"
      ? "border-purple-400/30 bg-purple-400/10 text-purple-400"
      : "border-cyan-400/30 bg-cyan-400/10 text-cyan-400";

  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

export default function ClaudeInsightCard({ analysis }: Props) {
  return (
    <Card>
      <h3 className="mb-4 font-outfit text-lg font-semibold text-white">
        AI Analysis
      </h3>

      {/* Scores */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <ScoreBadge label="Credibility" score={analysis.credibilityScore} />
        <ScoreBadge label="Relevance" score={analysis.relevanceScore} />
      </div>

      {/* Reasons */}
      <div className="mb-4 space-y-2 text-sm">
        <div>
          <p className="text-xs text-gray-500">Credibility</p>
          <p className="text-gray-300">{analysis.credibilityReason}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Relevance</p>
          <p className="text-gray-300">{analysis.relevanceReason}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-4">
        <p className="mb-2 text-xs text-gray-500">Tags</p>
        <div className="flex flex-wrap gap-2">
          {analysis.identityTags.map((tag) => (
            <Tag key={tag} label={tag} variant="identity" />
          ))}
          {analysis.capabilityTags.map((tag) => (
            <Tag key={tag} label={tag} variant="capability" />
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
        <p className="text-xs text-gray-500">Recommendation</p>
        <p className="mt-1 text-sm text-gray-300">{analysis.recommendation}</p>
      </div>
    </Card>
  );
}

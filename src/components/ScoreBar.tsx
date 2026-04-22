interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  note?: string;
}

export default function ScoreBar({ label, score, maxScore = 100, note }: ScoreBarProps) {
  const pct = Math.min((score / maxScore) * 100, 100);
  const color =
    pct >= 70 ? "bg-brand" : pct >= 40 ? "bg-yellow-500" : "bg-red-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {label}
          {note && <span className="ml-1.5 text-xs text-gray-600">({note})</span>}
        </span>
        <span className="font-mono font-medium text-white">{score}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

import { ScoreBreakdown as ScoreBreakdownType } from "@/lib/types";
import ScoreBar from "./ScoreBar";
import Card from "./Card";

interface Props {
  scores: ScoreBreakdownType;
}

export default function ScoreBreakdown({ scores }: Props) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-outfit text-lg font-semibold text-white">
          Score Breakdown
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-3xl font-bold text-brand">
            {scores.overall.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Influence Depth — with sub-breakdown */}
        <div>
          <ScoreBar
            label="Influence Depth (20%)"
            score={scores.influenceDepth}
          />
          <div className="mt-1.5 grid grid-cols-2 gap-1 pl-2">
            <SubItem label="Followers (60%)" score={scores.followerScaleScore} />
            <SubItem label="Listed Ratio (40%)" score={scores.listedScore} />
          </div>
        </div>

        {/* Follower Quality */}
        <ScoreBar
          label="Follower Quality (40%)"
          score={scores.followerQuality}
          note={`Weighted ER`}
        />

        {/* Content Stability */}
        <ScoreBar
          label="Content Stability (25%)"
          score={scores.contentStability}
          note={`CV ${scores.combinedCV.toFixed(2)}`}
        />

        {/* Engagement Quality */}
        <ScoreBar
          label="Engagement Quality (15%)"
          score={scores.engagementQuality}
          note={`HQ ${scores.highQualityRatio.toFixed(1)}%`}
        />
      </div>
    </Card>
  );
}

function SubItem({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-md bg-gray-800/40 px-2 py-1 text-center">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="font-mono text-xs font-semibold text-gray-300">{score}</p>
    </div>
  );
}

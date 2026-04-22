/* eslint-disable @next/next/no-img-element */
import { AnalysisResult } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/constants";
import Card from "./Card";

interface Props {
  result: AnalysisResult;
}

export default function DataSummary({ result }: Props) {
  const { user, tweets, pricing, domain, subDomain } = result;
  const metrics = user.public_metrics;

  return (
    <Card>
      {/* Profile row */}
      <div className="flex items-center gap-4">
        {user.profile_image_url && (
          <img
            src={user.profile_image_url}
            alt={user.name}
            className="h-14 w-14 rounded-full border-2 border-gray-700"
          />
        )}
        <div>
          <h3 className="font-outfit text-lg font-semibold text-white">
            {user.name}
          </h3>
          <p className="text-sm text-gray-400">@{user.username}</p>
        </div>
      </div>
      {user.description && (
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          {user.description}
        </p>
      )}

      {/* Profile stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricItem
          label="Followers"
          value={metrics.followers_count.toLocaleString()}
        />
        <MetricItem
          label="Following"
          value={metrics.following_count.toLocaleString()}
        />
        <MetricItem
          label="Listed"
          value={metrics.listed_count.toLocaleString()}
        />
        <MetricItem
          label="Analyzed"
          value={`${tweets.length} tweets`}
        />
      </div>

      {/* V2 analytics */}
      <div className="mt-4 border-t border-gray-800 pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-600">
          V2 Analytics
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricItem
            label="Domain"
            value={`${DOMAIN_LABELS[domain]}`}
            sub={subDomain}
          />
          <MetricItem
            label="Weighted Imp"
            value={pricing.weightedImpressions.toLocaleString()}
            sub="time-decay avg"
          />
          <MetricItem
            label="HQ Interaction"
            value={`${pricing.highQualityRatio.toFixed(1)}%`}
            sub="replies+RT+Q+BM"
          />
          <MetricItem
            label="Weighted Eng"
            value={pricing.weightedEngagement.toLocaleString()}
            sub="per tweet avg"
          />
          <MetricItem
            label="Ad Ratio"
            value={`${pricing.adRatio}%`}
            sub="sponsored"
          />
          <MetricItem
            label="Scarcity"
            value={`${pricing.scarcityFactor}x`}
            sub={
              pricing.adRatio < 5
                ? "very scarce"
                : pricing.adRatio < 15
                  ? "scarce"
                  : pricing.adRatio < 30
                    ? "baseline"
                    : pricing.adRatio < 50
                      ? "dense"
                      : "over-commercialized"
            }
          />
        </div>
      </div>
    </Card>
  );
}

function MetricItem({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-800/50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-mono text-sm font-semibold text-white leading-tight">
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

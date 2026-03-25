import { PricingResult, Domain } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/constants";
import Card from "./Card";

interface Props {
  pricing: PricingResult;
  domain: Domain;
}

export default function PriceCard({ pricing, domain }: Props) {
  return (
    <Card className="border-brand/30 bg-gradient-to-br from-brand/5 to-transparent">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-400">Estimated Tweet Price</p>
        <p className="mt-2 font-mono text-5xl font-bold text-brand">
          ${pricing.price.toLocaleString()}
        </p>
        <p className="mt-1 font-mono text-sm text-gray-500">
          Range: ${pricing.priceMin.toLocaleString()} &mdash; $
          {pricing.priceMax.toLocaleString()}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Stat label="CPM" value={`$${pricing.cpm}`} />
        <Stat label="Domain" value={DOMAIN_LABELS[domain]} />
        <Stat
          label="Avg Impressions"
          value={pricing.avgImpressions.toLocaleString()}
        />
        <Stat
          label="Engagement Rate"
          value={`${pricing.engagementRate}%`}
        />
        <Stat
          label="Domain Multiplier"
          value={`${pricing.domainMultiplier}x`}
        />
        <Stat
          label="Credibility Multiplier"
          value={`${pricing.credibilityMultiplier}x`}
        />
        <Stat
          label="Relevance Multiplier"
          value={`${pricing.relevanceMultiplier}x`}
        />
        <Stat
          label="Identity Multiplier"
          value={`${pricing.identityMultiplier}x`}
        />
        <Stat
          label="Avg Engagement"
          value={pricing.avgEngagement.toLocaleString()}
        />
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-mono text-sm font-medium text-white">{value}</p>
    </div>
  );
}

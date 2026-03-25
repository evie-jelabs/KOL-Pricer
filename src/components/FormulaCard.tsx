import { ScoreBreakdown as ScoreBreakdownType, PricingResult, Domain } from "@/lib/types";
import Card from "./Card";

interface Props {
  scores: ScoreBreakdownType;
  pricing: PricingResult;
  domain: Domain;
}

export default function FormulaCard({ scores, pricing, domain }: Props) {
  return (
    <Card>
      <h3 className="mb-4 font-outfit text-lg font-semibold text-white">
        Pricing Formula
      </h3>
      <div className="space-y-2 font-mono text-sm">
        <div className="flex justify-between text-gray-400">
          <span>Overall Score</span>
          <span className="text-white">{scores.overall.toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>CPM = $5 + ({scores.overall.toFixed(1)}/100) x $75</span>
          <span className="text-white">${pricing.cpm}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Avg Impressions</span>
          <span className="text-white">
            {pricing.avgImpressions.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Domain ({domain})</span>
          <span className="text-white">{pricing.domainMultiplier}x</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Credibility</span>
          <span className="text-white">{pricing.credibilityMultiplier}x</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Relevance</span>
          <span className="text-white">{pricing.relevanceMultiplier}x</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Identity{pricing.identityMultiplier > 1 ? " (Builder)" : ""}</span>
          <span className="text-white">{pricing.identityMultiplier}x</span>
        </div>
        <div className="border-t border-gray-700 pt-2">
          <div className="flex justify-between font-semibold">
            <span className="text-gray-300">
              Price = CPM x Imp/1000 x Dom x Cred x Rel x Id
            </span>
            <span className="text-brand">${pricing.price.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

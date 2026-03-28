import { PricingResult, Domain, ClaudeAnalysis } from "@/lib/types";
import Card from "./Card";

interface Props {
  pricing: PricingResult;
  domain: Domain;
  claudeAnalysis: ClaudeAnalysis;
}

export default function FormulaCard({ pricing, domain, claudeAnalysis }: Props) {
  const identityLabel = claudeAnalysis.identityTags.join("+");
  const capabilityLabel = claudeAnalysis.capabilityTags.join("+");

  return (
    <Card>
      <h3 className="mb-4 font-outfit text-lg font-semibold text-white">
        Pricing Formula
      </h3>
      <div className="space-y-2 font-mono text-sm">
        {/* CPM */}
        <div className="flex justify-between text-gray-400">
          <span>CPM = $5 + ({pricing.overallScore}/100) x $75</span>
          <span className="text-white">${pricing.cpm}</span>
        </div>

        {/* Avg Impressions */}
        <div className="flex justify-between text-gray-400">
          <span>Avg Imp → Effective (^0.85)</span>
          <span className="text-white">
            {pricing.avgImpressions.toLocaleString()} → {pricing.effectiveImpressions}
          </span>
        </div>

        {/* Modifiers group */}
        <div className="mt-1 rounded-lg border border-gray-700/50 bg-gray-800/30 px-3 py-2">
          <div className="mb-2 flex justify-between text-gray-300">
            <span className="font-semibold">Modifiers</span>
            <span className="font-semibold text-white">
              {pricing.combinedModifiers}x
            </span>
          </div>
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Domain ({domain})</span>
              <span>{pricing.domainMultiplier}x</span>
            </div>
            <div className="flex justify-between">
              <span>Credibility</span>
              <span>{pricing.credibilityMultiplier}x</span>
            </div>
            <div className="flex justify-between">
              <span>Relevance</span>
              <span>{pricing.relevanceMultiplier}x</span>
            </div>
            <div className="flex justify-between">
              <span>Identity ({identityLabel} x {capabilityLabel})</span>
              <span>{pricing.identityMultiplier}x</span>
            </div>
          </div>
        </div>

        {/* Floor */}
        {pricing.floorApplied && (
          <div className="flex justify-between text-xs text-yellow-500">
            <span>Price Floor applied</span>
            <span>${pricing.floor} (calc: ${pricing.calculatedPrice})</span>
          </div>
        )}

        {/* Final price */}
        <div className="border-t border-gray-700 pt-2">
          <div className="flex justify-between font-semibold">
            <span className="text-gray-300">
              Price = CPM x Eff.Imp x {pricing.combinedModifiers}x
            </span>
            <span className="text-brand">${pricing.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Range</span>
            <span>${pricing.priceMin.toLocaleString()} ~ ${pricing.priceMax.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

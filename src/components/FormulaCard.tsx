import { PricingResult, Domain, ClaudeAnalysis } from "@/lib/types";
import { DOMAIN_LABELS } from "@/lib/constants";
import Card from "./Card";

interface Props {
  pricing: PricingResult;
  domain: Domain;
  claudeAnalysis: ClaudeAnalysis;
}

export default function FormulaCard({ pricing, domain, claudeAnalysis }: Props) {
  const isBuilder = claudeAnalysis.identityTags.includes("Builder");
  const isKOL = claudeAnalysis.identityTags.includes("KOL");
  const identityLabel = isBuilder ? "Builder" : isKOL ? "KOL" : "Creator";

  return (
    <Card>
      <h3 className="mb-4 font-outfit text-lg font-semibold text-white">
        Pricing Formula
      </h3>
      <div className="space-y-2 font-mono text-sm">
        {/* CPM */}
        <div className="flex justify-between text-gray-400">
          <span>CPM = $10 + ({pricing.overallScore}/100) × $90</span>
          <span className="text-white">${pricing.cpm}</span>
        </div>

        {/* Weighted Impressions */}
        <div className="flex justify-between text-gray-400">
          <span>Weighted Imp / 1000</span>
          <span className="text-white">
            {pricing.weightedImpressions.toLocaleString()} →{" "}
            {pricing.effectiveImpressions}
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
              <span>
                Domain ({DOMAIN_LABELS[domain]} / {pricing.subDomain})
              </span>
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
              <span>Identity ({identityLabel})</span>
              <span>{pricing.identityMultiplier}x</span>
            </div>
            <div className="flex justify-between">
              <span>
                Scarcity (ad ratio: {pricing.adRatio}%)
              </span>
              <span
                className={
                  pricing.scarcityFactor >= 1.15
                    ? "text-green-400"
                    : pricing.scarcityFactor <= 0.85
                      ? "text-red-400"
                      : "text-gray-400"
                }
              >
                {pricing.scarcityFactor}x
              </span>
            </div>
          </div>
        </div>

        {/* Final price */}
        <div className="border-t border-gray-700 pt-2">
          <div className="flex justify-between font-semibold">
            <span className="text-gray-300">
              Price = CPM × Eff.Imp × {pricing.combinedModifiers}x
            </span>
            <span className="text-brand">
              ${pricing.price.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Range (±20%)</span>
            <span>
              ${pricing.priceMin.toLocaleString()} ~{" "}
              ${pricing.priceMax.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

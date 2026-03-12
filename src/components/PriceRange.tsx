import { PricingResult } from "@/lib/types";
import Card from "./Card";

interface Props {
  pricing: PricingResult;
}

export default function PriceRange({ pricing }: Props) {
  const { priceMin, price, priceMax } = pricing;
  const range = priceMax - priceMin;
  const position = range > 0 ? ((price - priceMin) / range) * 100 : 50;

  return (
    <Card>
      <h3 className="mb-4 font-outfit text-lg font-semibold text-white">
        Price Range
      </h3>
      <div className="relative pt-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span className="font-mono">${priceMin.toLocaleString()}</span>
          <span className="font-mono">${priceMax.toLocaleString()}</span>
        </div>
        <div className="relative mt-2 h-3 rounded-full bg-gray-800">
          <div
            className="absolute inset-y-0 rounded-full bg-gradient-to-r from-brand/40 to-brand"
            style={{ left: "0%", width: "100%" }}
          />
          <div
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-gray-900 shadow-lg shadow-brand/20"
            style={{ left: `${position}%` }}
          />
        </div>
        <p className="mt-3 text-center font-mono text-sm text-gray-400">
          Recommended: <span className="font-semibold text-brand">${price.toLocaleString()}</span>
        </p>
      </div>
    </Card>
  );
}

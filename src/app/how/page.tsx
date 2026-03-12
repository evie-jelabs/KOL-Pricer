import Card from "@/components/Card";

export default function HowPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-outfit text-4xl font-bold text-white">
        How It <span className="text-brand">Works</span>
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        Our pricing algorithm combines real X data with AI analysis to produce
        fair, transparent KOL tweet pricing.
      </p>

      {/* Pipeline */}
      <section className="mt-12 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          Analysis Pipeline
        </h2>
        <div className="space-y-4">
          <StepCard
            step={1}
            title="Fetch User Profile"
            desc="We call the X API v2 to get the KOL's profile: followers, following, bio, profile image, and account age."
          />
          <StepCard
            step={2}
            title="Fetch Recent Tweets"
            desc="We pull the last 10 original tweets (excluding retweets and replies) with full engagement metrics: impressions, likes, replies, retweets, and quotes."
          />
          <StepCard
            step={3}
            title="AI Domain Detection"
            desc="Claude AI analyzes the user's bio and tweet content to classify their domain: crypto, tech, finance, business, entertainment, or other."
          />
          <StepCard
            step={4}
            title="Multi-Dimension Scoring"
            desc="We calculate a composite score from 5 weighted dimensions (see below)."
          />
          <StepCard
            step={5}
            title="Price Calculation"
            desc="The final price is derived from CPM, average impressions, and a domain-specific multiplier."
          />
        </div>
      </section>

      {/* Scoring */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          Scoring Dimensions
        </h2>
        <div className="space-y-4">
          <DimensionCard
            title="Follower Scale (20%)"
            rows={[
              ["> 100K", "100"],
              ["50K – 100K", "80"],
              ["20K – 50K", "60"],
              ["10K – 20K", "40"],
              ["< 10K", "20"],
            ]}
          />
          <DimensionCard
            title="Follower Quality — ER% (25%)"
            rows={[
              ["> 2%", "100"],
              ["1% – 2%", "75"],
              ["0.5% – 1%", "50"],
              ["0.1% – 0.5%", "25"],
              ["< 0.1%", "10"],
            ]}
          />
          <DimensionCard
            title="Update Stability — CV (15%)"
            rows={[
              ["< 0.3", "100"],
              ["0.3 – 0.6", "70"],
              ["0.6 – 1.0", "40"],
              ["> 1.0", "20"],
            ]}
          />
          <DimensionCard
            title="Impression Stability — CV (20%)"
            rows={[
              ["< 0.3", "100"],
              ["0.3 – 0.5", "70"],
              ["0.5 – 0.8", "40"],
              ["> 0.8", "20"],
            ]}
          />
          <DimensionCard
            title="Engagement Rate — ER% (20%)"
            rows={[
              ["> 3%", "100"],
              ["2% – 3%", "80"],
              ["1% – 2%", "60"],
              ["0.5% – 1%", "40"],
              ["< 0.5%", "20"],
            ]}
          />
        </div>
      </section>

      {/* Formula */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          Pricing Formula
        </h2>
        <Card>
          <div className="space-y-4 font-mono text-sm">
            <FormulaLine
              label="Overall Score"
              formula="followerScale × 0.2 + followerQuality × 0.25 + updateStability × 0.15 + impressionStability × 0.2 + engagementRate × 0.2"
            />
            <FormulaLine
              label="CPM"
              formula="$10 + (overallScore / 100) × $90"
            />
            <FormulaLine
              label="Price"
              formula="CPM × avgImpressions / 1000 × domainMultiplier"
            />
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-outfit text-lg font-semibold text-white">
            Domain Multipliers
          </h3>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-3">
            {[
              ["Crypto / Web3", "1.4x"],
              ["Finance", "1.4x"],
              ["Tech", "1.3x"],
              ["Business", "1.2x"],
              ["Entertainment", "1.0x"],
              ["Other", "1.0x"],
            ].map(([domain, mult]) => (
              <div
                key={domain}
                className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
              >
                <span className="text-gray-400">{domain}</span>
                <span className="text-brand">{mult}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function StepCard({
  step,
  title,
  desc,
}: {
  step: number;
  title: string;
  desc: string;
}) {
  return (
    <Card className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 font-mono text-sm font-bold text-brand">
        {step}
      </div>
      <div>
        <h3 className="font-outfit font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-gray-400">{desc}</p>
      </div>
    </Card>
  );
}

function DimensionCard({
  title,
  rows,
}: {
  title: string;
  rows: string[][];
}) {
  return (
    <Card>
      <h3 className="mb-3 font-outfit font-semibold text-white">{title}</h3>
      <div className="space-y-1">
        {rows.map(([range, score]) => (
          <div
            key={range}
            className="flex items-center justify-between rounded-lg px-3 py-1.5 font-mono text-sm odd:bg-gray-800/30"
          >
            <span className="text-gray-400">{range}</span>
            <span className="text-white">{score}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FormulaLine({
  label,
  formula,
}: {
  label: string;
  formula: string;
}) {
  return (
    <div className="rounded-lg bg-gray-800/30 px-4 py-3">
      <span className="text-brand">{label}</span>
      <span className="text-gray-500"> = </span>
      <span className="text-gray-300">{formula}</span>
    </div>
  );
}

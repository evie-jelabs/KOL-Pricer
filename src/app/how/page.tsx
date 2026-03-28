import Card from "@/components/Card";

export default function HowPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-outfit text-4xl font-bold text-white">
        How It <span className="text-brand">Works</span>
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        Our pricing model combines real X data with AI analysis to produce
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
            title="Fetch 30 Recent Tweets"
            desc="We pull the last 30 original tweets (excluding retweets and replies) with full engagement metrics: impressions, likes, replies, retweets, and quotes."
          />
          <StepCard
            step={3}
            title="Trim Top/Bottom 3"
            desc="We remove the 3 tweets with the highest impressions and the 3 with the lowest. This eliminates extreme outliers, leaving 24 tweets."
          />
          <StepCard
            step={4}
            title="IQR Anomaly Detection"
            desc="We apply IQR 1.5x filtering on the remaining 24 tweets to detect and remove statistically anomalous impressions (e.g., bought engagement). Typically removes 0-2 additional tweets."
          />
          <StepCard
            step={5}
            title="Claude AI Analysis"
            desc="Claude AI analyzes the bio and tweets to determine: Domain (crypto, tech, finance, etc.), Credibility score (0-100), Relevance score (0-100), and Identity (Builder or Content Creator)."
          />
          <StepCard
            step={6}
            title="5-Dimension Scoring"
            desc="We calculate a composite Overall Score from 5 weighted dimensions: Follower Scale (20%), Follower Quality (25%), Update Stability (15%), Impression Stability (20%), and Engagement Rate (20%)."
          />
          <StepCard
            step={7}
            title="Final Pricing"
            desc="CPM = $5 + (Score/100) x $75. Price = CPM x (AvgImp/1000) x Modifiers (Domain x Credibility x Relevance x Identity). The final range is ±20%."
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
              formula="FS x 0.2 + FQ x 0.25 + US x 0.15 + IS x 0.2 + ER x 0.2"
            />
            <FormulaLine
              label="CPM"
              formula="$5 + (Overall Score / 100) x $75"
            />
            <FormulaLine
              label="Modifiers"
              formula="Domain x Credibility x Relevance x Identity"
            />
            <FormulaLine
              label="Price"
              formula="CPM x (Avg Impressions / 1000) x Modifiers"
            />
            <FormulaLine
              label="Range"
              formula="Price x 0.8 ~ Price x 1.2"
            />
          </div>
        </Card>
      </section>

      {/* Scoring Dimensions */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          Scoring Dimensions
        </h2>

        <DimensionCard
          title="Follower Scale (20%)"
          description="Measures the KOL's audience size. Scored across 8 tiers with >60K as the maximum."
          rows={[
            ["> 60K", "100"],
            ["40K - 60K", "85"],
            ["20K - 40K", "70"],
            ["10K - 20K", "55"],
            ["5K - 10K", "40"],
            ["3K - 5K", "30"],
            ["1K - 3K", "20"],
            ["< 1K", "10"],
          ]}
        />
        <DimensionCard
          title="Follower Quality — ER% (25%)"
          description="Evaluates how engaged the KOL's audience is. Calculated as: average interactions per tweet divided by follower count. A high ER means followers actively interact — not just passive or bot accounts."
          rows={[
            ["> 1.5%", "100"],
            ["0.8% - 1.5%", "75"],
            ["0.3% - 0.8%", "50"],
            ["0.08% - 0.3%", "25"],
            ["< 0.08%", "10"],
          ]}
        />
        <DimensionCard
          title="Update Stability — CV (15%)"
          description="Measures how consistently the KOL posts. We calculate the Coefficient of Variation of posting intervals. Low CV means regular posting — advertisers can rely on consistent output."
          rows={[
            ["< 0.3", "100"],
            ["0.3 - 0.5", "80"],
            ["0.5 - 0.8", "60"],
            ["0.8 - 1.2", "40"],
            ["> 1.2", "20"],
          ]}
        />
        <DimensionCard
          title="Impression Stability — CV (20%)"
          description="Evaluates how predictable the KOL's reach is. Low CV means each tweet reaches a similar audience — advertisers get reliable exposure."
          rows={[
            ["< 0.2", "100"],
            ["0.2 - 0.4", "80"],
            ["0.4 - 0.6", "60"],
            ["0.6 - 0.8", "40"],
            ["> 0.8", "20"],
          ]}
        />
        <DimensionCard
          title="Engagement Rate — ER% (20%)"
          description="Absolute measure of interaction per impression. Uses stricter thresholds to differentiate exceptional engagement from average performance."
          rows={[
            ["> 2%", "100"],
            ["1.5% - 2%", "80"],
            ["0.8% - 1.5%", "60"],
            ["0.3% - 0.8%", "40"],
            ["< 0.5%", "20"],
          ]}
        />
      </section>

      {/* Modifiers */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          4 Modifiers
        </h2>
        <p className="text-gray-400">
          Modifiers are multiplied together to form the combined pricing adjustment.
        </p>

        <DimensionCard
          title="1. Domain"
          description="Different industries have different CPM benchmarks."
          rows={[
            ["Crypto / Web3", "1.40x"],
            ["AI / Tech", "1.30x"],
            ["Finance", "1.25x"],
            ["Business / Gaming", "1.10x"],
            ["Entertainment", "1.00x"],
            ["Other", "0.90x"],
          ]}
        />

        <DimensionCard
          title="2. Credibility (AI-evaluated, max 1.25x)"
          description="Claude AI evaluates account authenticity: follower-to-engagement ratio, posting patterns, content originality, and signs of manipulation."
          rows={[
            ["85 - 100", "1.25x"],
            ["70 - 84", "1.00x"],
            ["55 - 69", "0.75x"],
            ["40 - 54", "0.50x"],
            ["< 40", "0.25x"],
          ]}
        />

        <DimensionCard
          title="3. Relevance (AI-evaluated, max 1.25x)"
          description="Claude AI judges each tweet's relevance to the account's domain. Only substantive domain content counts as relevant."
          rows={[
            ["85 - 100", "1.25x"],
            ["70 - 84", "1.00x"],
            ["55 - 69", "0.75x"],
            ["40 - 54", "0.55x"],
            ["< 40", "0.30x"],
          ]}
        />

        <DimensionCard
          title="4. Identity (AI-evaluated)"
          description="Builder accounts (founders, developers, researchers) get a 1.20x premium because their endorsements carry higher trust and conversion value."
          rows={[
            ["Builder", "1.20x"],
            ["Content Creator", "1.00x"],
          ]}
        />
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
  description,
  rows,
}: {
  title: string;
  description?: string;
  rows: string[][];
}) {
  return (
    <Card>
      <h3 className="mb-2 font-outfit font-semibold text-white">{title}</h3>
      {description && (
        <p className="mb-4 text-sm leading-relaxed text-gray-400">
          {description}
        </p>
      )}
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

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
            desc="We pull the last 20 original tweets (excluding retweets and replies) with full engagement metrics: impressions, likes, replies, retweets, and quotes."
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

      {/* Formula */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          Pricing Formula
        </h2>
        <Card>
          <div className="space-y-4 font-mono text-sm">
            <FormulaLine
              label="Overall Score"
              formula="FollowerScale × 0.2 + FollowerQuality × 0.25 + UpdateStability × 0.15 + ImpressionStability × 0.2 + EngagementRate × 0.2"
            />
            <FormulaLine
              label="CPM"
              formula="$10 + (OverallScore / 100) × $90"
            />
            <FormulaLine
              label="Price"
              formula="CPM × AvgImpressions / 1000 × DomainMultiplier"
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

      {/* Scoring */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          Scoring Dimensions
        </h2>
        <div className="space-y-4">
          <DimensionCard
            title="Follower Scale (20%)"
            description="Measures the KOL's audience size. A larger follower base means wider potential reach for sponsored content. This metric directly reflects the upper bound of how many people could see a tweet. Scores increase at key thresholds: micro-influencers (10K+), mid-tier (20K+), established (50K+), and top-tier (100K+)."
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
            description="Evaluates how engaged the KOL's audience truly is. Calculated as: average interactions (likes + replies + retweets + quotes) per tweet divided by follower count. A high ER means followers actively read and interact — not just passive or bot accounts. This is the highest-weighted dimension because engagement directly determines ad effectiveness."
            rows={[
              ["> 1%", "100"],
              ["0.5% – 1%", "80"],
              ["0.2% – 0.5%", "60"],
              ["0.05% – 0.2%", "40"],
              ["< 0.05%", "20"],
            ]}
          />
          <DimensionCard
            title="Update Stability — CV (15%)"
            description="Measures how consistently the KOL posts content. We calculate the time intervals between the last 20 tweets, then compute the Coefficient of Variation (standard deviation / mean). A low CV means the KOL posts on a regular schedule — advertisers can rely on consistent content output. A high CV suggests erratic posting, which makes campaign timing unpredictable."
            rows={[
              ["< 0.3", "100"],
              ["0.3 – 0.6", "80"],
              ["0.6 – 0.9", "60"],
              ["0.9 – 1.3", "40"],
              ["> 1.3", "20"],
            ]}
          />
          <DimensionCard
            title="Impression Stability — CV (20%)"
            description="Evaluates how predictable the KOL's reach is across tweets. We take the impression counts from the last 20 tweets and compute the Coefficient of Variation. Low CV means each tweet reaches a similar-sized audience — advertisers get reliable exposure. High CV means some tweets go viral while others underperform, making campaign ROI harder to predict."
            rows={[
              ["< 0.3", "100"],
              ["0.3 – 0.5", "80"],
              ["0.5 – 0.8", "60"],
              ["0.8 – 1.2", "40"],
              ["> 1.2", "20"],
            ]}
          />
          <DimensionCard
            title="Engagement Rate — ER% (20%)"
            description="An absolute measure of how much interaction each tweet generates relative to the follower base. While Follower Quality also uses ER, this dimension applies stricter thresholds to differentiate truly exceptional engagement (1.5%+) from average performance. Top KOLs consistently achieve high ER because their content resonates deeply with their niche audience."
            rows={[
              ["> 1.5%", "100"],
              ["0.8% – 1.5%", "80"],
              ["0.3% – 0.8%", "60"],
              ["0.1% – 0.3%", "40"],
              ["< 0.1%", "20"],
            ]}
          />
        </div>
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

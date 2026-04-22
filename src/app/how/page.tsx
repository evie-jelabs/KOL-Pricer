import Card from "@/components/Card";

export default function HowPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-outfit text-4xl font-bold text-white">
        How It <span className="text-brand">Works</span>
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        V2 pricing model — combines real X data with AI analysis, time-decay
        weighted impressions, and a scarcity factor for transparent KOL tweet
        pricing.
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
            desc="We call the X API v2 to get the KOL's profile: followers, following, listed_count, bio, and account age."
          />
          <StepCard
            step={2}
            title="Fetch 30 Recent Tweets"
            desc="We pull the last 30 original tweets (excluding retweets and replies) with full engagement metrics: impressions, likes, replies, retweets, quotes, bookmarks, and entities."
          />
          <StepCard
            step={3}
            title="Trim Top/Bottom 3"
            desc="We remove the 3 tweets with the highest impressions and the 3 with the lowest. This eliminates extreme outliers, leaving 24 tweets."
          />
          <StepCard
            step={4}
            title="IQR Anomaly Detection"
            desc="We apply IQR 1.5x filtering on the remaining tweets to detect and remove statistically anomalous impressions (e.g., bought engagement)."
          />
          <StepCard
            step={5}
            title="Claude AI Analysis"
            desc="Claude AI analyzes the bio and tweets to determine: Domain + SubDomain (10 subcategories), Credibility score (0-100), Relevance score (0-100), and Identity tag."
          />
          <StepCard
            step={6}
            title="4-Dimension Scoring"
            desc="We calculate a composite Overall Score from 4 weighted dimensions: Influence Depth (20%), Follower Quality (40%), Content Stability (25%), and Engagement Quality (15%)."
          />
          <StepCard
            step={7}
            title="V2 Pricing"
            desc="CPM = $5 + (Score/100) × $55 (range $5~$60). Price = CPM × (WeightedImp/1000) × Domain × Credibility × Relevance × Identity × Scarcity. Range is ±20%."
          />
        </div>
      </section>

      {/* Formula */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          V2 Pricing Formula
        </h2>
        <Card>
          <div className="space-y-4 font-mono text-sm">
            <FormulaLine
              label="Overall Score"
              formula="ID×20% + FQ×40% + CS×25% + EQ×15%"
            />
            <FormulaLine
              label="CPM"
              formula="$5 + (Overall Score / 100) × $55"
            />
            <FormulaLine
              label="Weighted Impressions"
              formula="Σ(impressions × time_weight) / Σ(time_weight)"
            />
            <FormulaLine
              label="Modifiers"
              formula="Domain × Credibility × Relevance × Identity × Scarcity"
            />
            <FormulaLine
              label="Price"
              formula="CPM × (Weighted Imp / 1000) × Modifiers"
            />
            <FormulaLine
              label="Range"
              formula="Price × 0.8  ~  Price × 1.2"
            />
          </div>
        </Card>
      </section>

      {/* Time Decay */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          Time Decay Weights
        </h2>
        <p className="text-gray-400">
          Recent tweets are weighted more heavily — older viral tweets don&apos;t
          inflate today&apos;s reach estimate.
        </p>
        <DimensionCard
          title="Impression Time Decay"
          rows={[
            ["≤ 7 days ago", "1.0x"],
            ["8 – 14 days ago", "0.8x"],
            ["15 – 30 days ago", "0.6x"],
            ["> 30 days ago", "0.4x"],
          ]}
        />
      </section>

      {/* Weighted Engagement */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          Weighted Engagement
        </h2>
        <p className="text-gray-400">
          Different interaction types carry different transmission value. Used for
          Follower Quality (ER) and Engagement Quality scoring.
        </p>
        <DimensionCard
          title="Engagement Value Weights"
          rows={[
            ["Quote (×4)", "Highest — carries a comment, max spread"],
            ["Reply (×3)", "Real discussion signal"],
            ["Retweet (×2)", "Second-degree reach"],
            ["Bookmark (×2)", "Long-tail value"],
            ["Like (×1)", "Baseline"],
          ]}
        />
      </section>

      {/* Scoring Dimensions */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          4 Scoring Dimensions
        </h2>

        {/* Influence Depth */}
        <Card>
          <h3 className="mb-2 font-outfit font-semibold text-white">
            1. Influence Depth (20%)
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-gray-400">
            Composite of 3 sub-items:{" "}
            <span className="text-gray-300">
              Follower Scale (50%) + Listed Ratio (25%) + Elite Follower % (25%)
            </span>
          </p>
          <div className="space-y-4">
            <SubDimensionTable
              title="Sub-item 1 — Follower Scale (50%)"
              rows={[
                ["> 100K", "100"],
                ["50K – 100K", "80"],
                ["20K – 50K", "60"],
                ["10K – 20K", "40"],
                ["< 10K", "20"],
              ]}
            />
            <SubDimensionTable
              title="Sub-item 2 — Listed Ratio (25%) — listed_count / followers × 1000"
              rows={[
                ["> 5", "100"],
                ["3 – 5", "75"],
                ["1 – 3", "50"],
                ["0.5 – 1", "25"],
                ["< 0.5", "10"],
              ]}
            />
            <SubDimensionTable
              title="Sub-item 3 — Elite Follower % (25%) — verified_followers / followers × 100%"
              rows={[
                ["> 5%", "100"],
                ["3% – 5%", "75"],
                ["1% – 3%", "50"],
                ["0.5% – 1%", "25"],
                ["< 0.5%", "10"],
              ]}
            />
          </div>
        </Card>

        <DimensionCard
          title="2. Follower Quality — Weighted ER% (40%)"
          description="ER = Average Weighted Engagement / Followers × 100%. Weighted engagement = likes×1 + replies×3 + retweets×2 + quotes×4 + bookmarks×2."
          rows={[
            ["> 2%", "100"],
            ["1% – 2%", "75"],
            ["0.5% – 1%", "50"],
            ["0.1% – 0.5%", "25"],
            ["< 0.1%", "10"],
          ]}
        />

        <DimensionCard
          title="3. Content Stability — Combined CV (25%)"
          description="Combined CV = 0.4 × posting interval CV + 0.6 × impression CV. Low CV = consistent output and predictable reach."
          rows={[
            ["< 0.3", "100"],
            ["0.3 – 0.5", "75"],
            ["0.5 – 0.8", "50"],
            ["0.8 – 1.2", "30"],
            ["> 1.2", "10"],
          ]}
        />

        <DimensionCard
          title="4. Engagement Quality — HQ Interaction Ratio (15%)"
          description="HQ ratio = (replies + retweets + quotes + bookmarks) / (all interactions) × 100%. High ratio = real discussion, not just passive likes."
          rows={[
            ["> 30%", "100"],
            ["20% – 30%", "80"],
            ["10% – 20%", "60"],
            ["5% – 10%", "40"],
            ["< 5%", "20"],
          ]}
        />
      </section>

      {/* Domain Subcategories */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          Domain Factor (10 Subcategories)
        </h2>
        <p className="text-gray-400">
          Claude AI identifies both the main category and subcategory to apply
          the appropriate CPM premium.
        </p>
        <DimensionCard
          title="Domain × SubDomain → Multiplier (max 1.30x)"
          rows={[
            ["Crypto — DeFi / Layer1/L2 / Institutional", "1.30x"],
            ["Crypto — NFT / Gaming / Memecoin", "1.20x"],
            ["AI — LLM / Base Model / AI Infra", "1.30x"],
            ["AI — Application / SaaS / Tools", "1.20x"],
            ["Finance — Institutional / TradFi / Macro", "1.30x"],
            ["Finance — Retail / Personal Finance", "1.10x"],
            ["Business — Startup / SaaS / B2B", "1.20x"],
            ["Tech — General / Developer", "1.20x"],
            ["Entertainment — Lifestyle / Culture", "1.00x"],
            ["Other", "1.00x"],
          ]}
        />
      </section>

      {/* Other Modifiers */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          Other Modifiers
        </h2>

        <DimensionCard
          title="Credibility (AI-evaluated, max 1.10x)"
          description="Claude AI evaluates account authenticity: follower-to-engagement ratio, posting patterns, content originality, signs of manipulation."
          rows={[
            ["85 – 100", "1.10x"],
            ["70 – 84", "1.00x"],
            ["55 – 69", "0.75x"],
            ["40 – 54", "0.50x"],
            ["< 40", "0.25x"],
          ]}
        />

        <DimensionCard
          title="Relevance (AI-evaluated, max 1.10x)"
          description="Claude AI judges each tweet's relevance to the account's domain. Measured as relevant tweets / total tweets."
          rows={[
            ["85 – 100", "1.10x"],
            ["70 – 84", "1.00x"],
            ["55 – 69", "0.75x"],
            ["40 – 54", "0.55x"],
            ["< 40", "0.30x"],
          ]}
        />

        <DimensionCard
          title="Identity (AI-evaluated)"
          description="Builder accounts carry higher trust and conversion value."
          rows={[
            ["Builder", "1.20x"],
            ["KOL", "1.10x"],
            ["Content Creator", "1.00x"],
          ]}
        />

        <DimensionCard
          title="Scarcity Factor (Ad Ratio, near 30 days)"
          description="Accounts that rarely accept sponsorships command a premium. Accounts that over-commercialize receive a discount."
          rows={[
            ["< 5% sponsored tweets", "1.20x (very scarce)"],
            ["5% – 15%", "1.10x"],
            ["15% – 30%", "1.00x (baseline)"],
            ["30% – 50%", "0.85x"],
            ["> 50%", "0.70x (over-commercialized)"],
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

function SubDimensionTable({
  title,
  rows,
}: {
  title: string;
  rows: string[][];
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-500">{title}</p>
      <div className="space-y-1">
        {rows.map(([range, score]) => (
          <div
            key={range}
            className="flex items-center justify-between rounded-md px-3 py-1 font-mono text-xs odd:bg-gray-800/20"
          >
            <span className="text-gray-500">{range}</span>
            <span className="text-gray-300">{score}</span>
          </div>
        ))}
      </div>
    </div>
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

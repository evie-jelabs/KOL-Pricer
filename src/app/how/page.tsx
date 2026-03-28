import Card from "@/components/Card";

export default function HowPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-outfit text-4xl font-bold text-white">
        How It <span className="text-brand">Works</span>
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        Our V5.1 pricing model combines real X data with AI analysis and 7
        transparent modifiers to produce fair KOL tweet pricing.
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
            desc="Claude AI analyzes the bio and tweets to determine: Domain (crypto, tech, finance, etc.), Credibility score (0-100), Relevance score (0-100), Identity tags (Builder/KOL/Content Creator), and Capability tags (Branding/Trading/Traffic)."
          />
          <StepCard
            step={6}
            title="Calculate 7 Modifiers"
            desc="We compute 7 pricing modifiers: 4 data-driven (Follower Factor, Domain, ER, RE) and 3 AI-evaluated (Credibility, Relevance, Identity). These are multiplied together to form the Combined Modifier."
          />
          <StepCard
            step={7}
            title="Final Pricing"
            desc="Price = $60 x (AvgImp/1000)^0.85 x Combined Modifiers. A Price Floor protects small accounts (≤80K followers) with good credibility. The final range is ±20%."
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
              label="Effective Impressions"
              formula="(Avg Impressions / 1000) ^ 0.85"
            />
            <FormulaLine
              label="Modifiers"
              formula="FF x Domain x Credibility x Relevance x Identity x ER x RE"
            />
            <FormulaLine
              label="Price"
              formula="$60 x Effective Impressions x Modifiers"
            />
            <FormulaLine
              label="Final"
              formula="max(Price Floor, Price) x 0.8 ~ 1.2"
            />
          </div>
        </Card>
      </section>

      {/* 7 Modifiers */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          7 Modifiers
        </h2>

        {/* FF */}
        <DimensionCard
          title="1. Follower Factor (FF)"
          description="Measures the KOL's audience size. Larger accounts get a higher multiplier, with 8K-15K as the baseline (1.00x)."
          rows={[
            ["> 200K", "1.80x"],
            ["80K - 200K", "1.60x"],
            ["30K - 80K", "1.40x"],
            ["15K - 30K", "1.20x"],
            ["8K - 15K", "1.00x"],
            ["3K - 8K", "0.80x"],
            ["1K - 3K", "0.65x"],
            ["500 - 1K", "0.50x"],
            ["< 500", "0.30x"],
          ]}
        />

        {/* Domain */}
        <DimensionCard
          title="2. Domain"
          description="Different industries have different CPM benchmarks. Crypto and Finance command the highest premiums."
          rows={[
            ["Crypto / Web3", "1.40x"],
            ["Finance", "1.40x"],
            ["AI / Tech", "1.30x"],
            ["Business", "1.20x"],
            ["Entertainment", "1.00x"],
            ["Other", "1.00x"],
          ]}
        />

        {/* Credibility */}
        <DimensionCard
          title="3. Credibility (AI-evaluated, max 1.00x)"
          description="Claude AI evaluates account authenticity: follower-to-engagement ratio, posting patterns, content originality, and signs of manipulation. Data-porter accounts (reposting chain data without original analysis) are scored 50-65. This is a penalty-only modifier — it can only reduce the price, not increase it."
          rows={[
            ["85 - 100", "1.00x"],
            ["70 - 84", "0.90x"],
            ["55 - 69", "0.70x"],
            ["40 - 54", "0.45x"],
            ["< 40", "0.25x"],
          ]}
        />

        {/* Relevance */}
        <DimensionCard
          title="4. Relevance (AI-evaluated, max 1.00x)"
          description="Claude AI judges each tweet's relevance to the account's domain. Only substantive domain content counts — lifestyle posts, entertainment, giveaways, and generic commentary are marked as irrelevant. Scoring is strict: relevanceScore = relevant tweets / total tweets x 100."
          rows={[
            ["85 - 100", "1.00x"],
            ["70 - 84", "0.90x"],
            ["55 - 69", "0.70x"],
            ["40 - 54", "0.45x"],
            ["< 40", "0.25x"],
          ]}
        />

        {/* Identity */}
        <DimensionCard
          title="5. Identity (AI-evaluated)"
          description="Identity = Role x Capability. Role: Builder (founder/dev/researcher) = 1.20x, KOL = 1.10x, Content Creator = 1.00x. Capability: Branding = 1.10x, Trading = 1.10x, Traffic = 0.90x. Takes the highest from each set and multiplies."
          rows={[
            ["Builder x Branding", "1.32x"],
            ["Builder x Trading", "1.32x"],
            ["KOL x Branding", "1.21x"],
            ["KOL x Trading", "1.21x"],
            ["KOL x Traffic", "0.99x"],
            ["CC x Traffic", "0.90x"],
          ]}
        />

        {/* ER */}
        <DimensionCard
          title="6. Engagement Rate (ER) — Data-driven"
          description="ER = (avg likes + replies + retweets) / avg impressions x 100%. Measures how actively the audience interacts with each tweet. Low ER suggests passive or fake followers."
          rows={[
            ["> 2%", "1.10x"],
            ["1% - 2%", "1.00x"],
            ["0.5% - 1%", "0.90x"],
            ["0.2% - 0.5%", "0.80x"],
            ["< 0.2%", "0.60x"],
          ]}
        />

        {/* RE */}
        <DimensionCard
          title="7. Reach Efficiency (RE) — Data-driven"
          description="RE = avg impressions / followers x 100%. Measures what percentage of followers actually see each tweet. Low RE means a large portion of followers are inactive or fake."
          rows={[
            ["> 20%", "1.10x"],
            ["10% - 20%", "1.00x"],
            ["5% - 10%", "0.90x"],
            ["2% - 5%", "0.80x"],
            ["< 2%", "0.60x"],
          ]}
        />
      </section>

      {/* Price Floor */}
      <section className="mt-16 space-y-6">
        <h2 className="font-outfit text-2xl font-semibold text-white">
          Price Floor
        </h2>
        <p className="text-gray-400">
          Small accounts (up to 80K followers) with good credibility get a minimum
          price guarantee. Accounts with low credibility (&lt;55) receive no floor
          protection — this prevents fake accounts from benefiting.
        </p>
        <Card>
          <div className="space-y-1">
            <div className="mb-2 text-xs text-gray-500">
              Credibility &ge; 70: full floor | 55-69: half floor | &lt;55: no floor
            </div>
            {[
              ["30K - 80K", "$500"],
              ["15K - 30K", "$500"],
              ["8K - 15K", "$350"],
              ["3K - 8K", "$200"],
              ["1K - 3K", "$100"],
              ["< 1K", "$50"],
              ["> 80K", "No floor"],
            ].map(([range, floor]) => (
              <div
                key={range}
                className="flex items-center justify-between rounded-lg px-3 py-1.5 font-mono text-sm odd:bg-gray-800/30"
              >
                <span className="text-gray-400">{range}</span>
                <span className="text-white">{floor}</span>
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

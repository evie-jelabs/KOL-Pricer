"use client";

import { useState } from "react";

const faqs = [
  {
    q: "What data do you use to calculate the price?",
    a: "We use the KOL's follower count, recent tweet engagement (likes, replies, retweets, quotes), tweet impressions, posting frequency, and bio content — all fetched in real-time from the X API v2.",
  },
  {
    q: "How is the domain detected?",
    a: "We send the user's bio and recent tweet texts to Claude AI, which classifies them into one of 6 domains: crypto, tech, finance, business, entertainment, or other. Each domain has a pricing multiplier.",
  },
  {
    q: "Why does domain matter for pricing?",
    a: "Different niches have different advertiser demand and CPMs. Crypto and finance KOLs typically command higher rates due to higher-value audiences, while entertainment is more mainstream and competitively priced.",
  },
  {
    q: "What is the engagement rate (ER)?",
    a: "ER = average interactions (likes + replies + retweets + quotes) per tweet ÷ follower count × 100%. A higher ER indicates a more engaged audience.",
  },
  {
    q: "What does the Coefficient of Variation (CV) measure?",
    a: "CV measures how consistent the KOL's metrics are. For update stability, it checks how regular their posting schedule is. For impression stability, it checks how consistent their reach is. Lower CV = more predictable performance.",
  },
  {
    q: "How accurate is the pricing?",
    a: "The price is a data-driven estimate based on publicly available metrics. Actual rates may vary based on content requirements, exclusivity, campaign duration, and direct negotiation. Use the ±20% range as a starting point.",
  },
  {
    q: "Is there a rate limit?",
    a: "Yes, to protect our API usage, each IP is limited to 5 analyses per minute. Please wait between requests if you hit the limit.",
  },
  {
    q: "What happens to my data?",
    a: "We don't store any data server-side. Analysis results are only kept in your browser session. Once you close the tab, the history is gone.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-outfit text-4xl font-bold text-white">
        Frequently Asked <span className="text-brand">Questions</span>
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        Everything you need to know about KOL Pricer.
      </p>

      <div className="mt-10 space-y-3">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-800 bg-gray-900/50 transition-colors hover:border-gray-700"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between px-6 py-4 text-left"
            >
              <span className="pr-4 font-medium text-white">{faq.q}</span>
              <svg
                className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
                  openIndex === i ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openIndex === i && (
              <div className="border-t border-gray-800 px-6 py-4 text-sm leading-relaxed text-gray-400">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

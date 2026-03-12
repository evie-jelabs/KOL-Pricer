/* eslint-disable @next/next/no-img-element */
import { XUser, Tweet } from "@/lib/types";
import Card from "./Card";

interface Props {
  user: XUser;
  tweets: Tweet[];
}

export default function DataSummary({ user, tweets }: Props) {
  const metrics = user.public_metrics;

  return (
    <Card>
      <div className="flex items-center gap-4">
        {user.profile_image_url && (
          <img
            src={user.profile_image_url}
            alt={user.name}
            className="h-14 w-14 rounded-full border-2 border-gray-700"
          />
        )}
        <div>
          <h3 className="font-outfit text-lg font-semibold text-white">
            {user.name}
          </h3>
          <p className="text-sm text-gray-400">@{user.username}</p>
        </div>
      </div>
      {user.description && (
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          {user.description}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricItem
          label="Followers"
          value={metrics.followers_count.toLocaleString()}
        />
        <MetricItem
          label="Following"
          value={metrics.following_count.toLocaleString()}
        />
        <MetricItem
          label="Tweets"
          value={metrics.tweet_count.toLocaleString()}
        />
        <MetricItem
          label="Analyzed"
          value={`${tweets.length} tweets`}
        />
      </div>
    </Card>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-800/50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-mono text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

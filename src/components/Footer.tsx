export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">
            KOL Pricer &mdash; X KOL Tweet Pricing Calculator
          </p>
          <p className="text-sm text-gray-600">
            Powered by X API v2 &amp; Claude AI
          </p>
        </div>
      </div>
    </footer>
  );
}

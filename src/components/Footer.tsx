export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">
            KOL Pricer &mdash; X KOL Tweet Pricing Calculator
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Contributors:{" "}
              <a
                href="https://x.com/0xEvieYang"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-brand"
              >
                Evie
              </a>
              {" / "}
              <a
                href="https://x.com/JELabs2024"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-brand"
              >
                JE Labs
              </a>
            </span>
            <span className="text-gray-700">|</span>
            <a
              href="https://github.com/evie-jelabs/KOL-Pricer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-gray-400 transition-colors hover:text-brand"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

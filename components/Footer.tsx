import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-bg-border bg-bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-green">
              <Zap className="h-3.5 w-3.5 text-black" fill="black" />
            </div>
            <span className="font-bold text-white">
              WeLike<span className="text-accent-green">Sportz</span>
            </span>
          </div>

          {/* Disclaimer */}
          <p className="max-w-lg text-center text-xs text-slate-600 sm:text-left">
            WeLikeSportz is for informational purposes only. Odds data is
            provided for comparison. Please gamble responsibly.{" "}
            <a href="#" className="underline hover:text-slate-400">
              18+ only
            </a>
            .
          </p>

          {/* Links */}
          <div className="flex gap-5 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300">
              Privacy
            </a>
            <a href="#" className="hover:text-slate-300">
              Terms
            </a>
            <a href="#" className="hover:text-slate-300">
              Contact
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-700">
          © {new Date().getFullYear()} WeLikeSportz. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

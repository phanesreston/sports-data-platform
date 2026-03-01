import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-bg-border bg-bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-green">
              <Zap className="h-3.5 w-3.5 text-white" fill="white" />
            </div>
            <span className="font-bold text-gray-900">
              WeLike<span className="text-accent-green">Sportz</span>
            </span>
          </div>

          {/* Disclaimer */}
          <p className="max-w-lg text-center text-xs text-gray-400 sm:text-left">
            WeLikeSportz provides data-driven sports analysis for informational
            and entertainment purposes only. Always enjoy sport responsibly.
          </p>

          {/* Links */}
          <div className="flex gap-5 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-700">
              Privacy
            </a>
            <a href="#" className="hover:text-gray-700">
              Terms
            </a>
            <a href="#" className="hover:text-gray-700">
              Contact
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-300">
          © {new Date().getFullYear()} WeLikeSportz. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

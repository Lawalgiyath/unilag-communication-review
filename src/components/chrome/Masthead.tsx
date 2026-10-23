import Link from "next/link";
import { JOURNAL } from "@/lib/constants";

export function Masthead() {
  return (
    <header className="bg-paper">
      {/* Special Issue Top Bar / Corner Notice */}
      <div className="border-b border-hairline bg-paper-dark text-ink">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-4 py-1.5 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="border border-gold/80 bg-gold/15 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark">
              Special Issue
            </span>
            <span className="font-serif text-xs font-semibold text-ink sm:text-[13px]">
              Platforms, Power, and Polls: Perspectives Ahead of Nigeria’s 2027 General Elections
            </span>
          </div>
          <div className="flex items-center font-display text-xs font-bold uppercase tracking-wider">
            <Link
              href="/current"
              className="text-maroon hover:text-oxblood hover:underline"
            >
              Volume 9 Number 2
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex items-baseline justify-between border-b border-hairline py-2 text-[11px] uppercase tracking-[0.14em] text-secondary">
          <span>{JOURNAL.publisher}</span>
          <span className="hidden sm:inline">
            ISSN {JOURNAL.issn} (Print) · {JOURNAL.eissn} (Online)
          </span>
        </div>
        <div className="flex items-center justify-between py-6 sm:py-8">
          {/* Left Logo - UNILAG */}
          <div className="hidden sm:flex w-[120px] justify-start shrink-0">
            <img 
              src="/unilag-logo.png" 
              alt="University of Lagos Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>

          <div className="text-center flex-1">
            <Link href="/" className="inline-block no-underline">
              <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">
                Communication Review
              </h1>
            </Link>
            <p className="mt-2 font-serif text-sm italic text-secondary sm:text-base">
              A peer reviewed journal of the faculty of communication and media studies
            </p>
          </div>

          {/* Right Logo - Faculty of Communication and Media Studies */}
          <div className="hidden sm:flex w-[120px] justify-end shrink-0">
            <img 
              src="/faculty-logo.png" 
              alt="Faculty of Communication and Media Studies Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>
      </div>
      <div className="double-rule" aria-hidden="true" />
    </header>
  );
}

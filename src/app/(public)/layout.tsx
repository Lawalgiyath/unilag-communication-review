import { Masthead } from "@/components/chrome/Masthead";
import { MainNav } from "@/components/chrome/MainNav";
import { Footer } from "@/components/chrome/Footer";
import { SkipLink } from "@/components/chrome/SkipLink";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SkipLink />
      <div className="no-print">
        <Masthead />
        <MainNav />
      </div>
      <main id="main-content" className="mx-auto min-h-[60vh] w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <Footer />
    </>
  );
}

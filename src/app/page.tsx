import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="relative w-full flex flex-col items-center justify-start">
      <Navbar />
      <main className="px-4 py-6">
        <HeroSection />
      </main>
    </div>
  );
}

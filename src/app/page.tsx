import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        <HeroSection />
      </main>
    </div>
  );
}

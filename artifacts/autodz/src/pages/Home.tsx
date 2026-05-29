import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import ListingsSection from "@/components/ListingsSection";
import Sidebar from "@/components/Sidebar";
import FeaturesStrip from "@/components/FeaturesStrip";
import StatsBar from "@/components/StatsBar";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <CategoryGrid />

      {/* Main content + sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Listings */}
          <div className="flex-1 min-w-0">
            <ListingsSection />
            <FeaturesStrip />
          </div>

          {/* Sidebar */}
          <div className="w-full xl:w-72 shrink-0">
            <Sidebar />
          </div>
        </div>
      </div>

      <StatsBar />
    </main>
  );
}

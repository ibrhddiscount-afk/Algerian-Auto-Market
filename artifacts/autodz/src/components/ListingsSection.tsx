import { useLocation } from "wouter";
import CarCard from "@/components/CarCard";
import { ALL_LISTINGS } from "@/data/listings";

const RECENT = ALL_LISTINGS.slice(0, 5);

export default function ListingsSection() {
  const [, navigate] = useLocation();

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Annonces récentes</h2>
          <div className="w-12 h-1 bg-[#1a7a3c] rounded-full mt-1.5" />
        </div>
        <button
          onClick={() => navigate("/annonces")}
          className="text-sm text-[#1a7a3c] font-semibold hover:underline"
        >
          Voir toutes les annonces →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {RECENT.map(listing => (
          <CarCard key={listing.id} listing={listing} size="sm" />
        ))}
      </div>
    </section>
  );
}

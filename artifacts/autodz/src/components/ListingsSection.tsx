import { useLocation } from "wouter";
import { AlertCircle, Search } from "lucide-react";
import CarCard from "@/components/CarCard";
import { useListListings } from "@workspace/api-client-react";

export default function ListingsSection() {
  const [, navigate] = useLocation();
  const { data, isLoading, isError } = useListListings({
    sort: "recent",
    page: 1,
    pageSize: 5,
  });

  const recentListings = data?.items ?? [];

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
        {isLoading ? (
          Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-36 bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-5 bg-gray-100 rounded w-full mt-4" />
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5 bg-white rounded-2xl border border-red-100 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Impossible de charger les annonces récentes.</p>
            <p className="text-xs text-gray-400 mt-1">Réessayez dans quelques instants.</p>
          </div>
        ) : recentListings.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5 bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Aucune annonce récente pour le moment.</p>
          </div>
        ) : (
          recentListings.map(listing => (
            <CarCard key={listing.id} listing={listing} size="sm" />
          ))
        )}
      </div>
    </section>
  );
}

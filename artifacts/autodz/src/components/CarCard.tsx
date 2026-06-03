import { useLocation } from "wouter";
import { Heart, MessageCircle, MapPin, CheckCircle } from "lucide-react";
import type { Listing } from "@workspace/api-client-react";
import { useFavoriteListing } from "@/hooks/use-favorite-listing";

function CarIllustration({ color, title }: { color: string; title: string }) {
  const initials = title.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div className={`w-full h-full bg-gradient-to-br ${color} flex flex-col items-center justify-center gap-2`}>
      <svg viewBox="0 0 120 60" fill="none" className="w-4/5 h-3/5 opacity-75">
        <rect x="10" y="28" width="100" height="22" rx="5" fill="rgba(255,255,255,0.45)" />
        <path d="M18 28 Q38 10 60 10 Q85 10 104 28" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
        <circle cx="28" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
        <circle cx="92" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
        <circle cx="28" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
        <circle cx="92" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
        <rect x="38" y="13" width="18" height="13" rx="2" fill="rgba(150,220,255,0.5)" />
        <rect x="62" y="13" width="18" height="13" rx="2" fill="rgba(150,220,255,0.5)" />
        <rect x="10" y="37" width="8" height="4" rx="1" fill="rgba(255,230,100,0.85)" />
        <rect x="102" y="37" width="8" height="4" rx="1" fill="rgba(255,80,80,0.85)" />
      </svg>
      <span className="text-white/60 text-xs font-bold tracking-widest">{initials}</span>
    </div>
  );
}

const FUEL_COLORS: Record<string, string> = {
  Essence:    "bg-orange-100 text-orange-700",
  Diesel:     "bg-blue-100 text-blue-700",
  GPL:        "bg-yellow-100 text-yellow-700",
  Hybride:    "bg-teal-100 text-teal-700",
  Électrique: "bg-green-100 text-green-700",
};

const BADGE_COLORS: Record<string, string> = {
  "Nouveau":    "bg-[#1a7a3c] text-white",
  "Récent":     "bg-[#1a7a3c] text-white",
  "Premium":    "bg-amber-500 text-white",
  "SUV":        "bg-blue-600 text-white",
  "Hybride":    "bg-teal-600 text-white",
  "Utilitaire": "bg-gray-600 text-white",
};

interface CarCardProps {
  listing: Listing;
  size?: "sm" | "md";
}

export default function CarCard({ listing, size = "md" }: CarCardProps) {
  const [, navigate] = useLocation();
  const { favorited, isPending, toggleFavorite } = useFavoriteListing(listing.id);

  return (
    <div
      onClick={() => navigate(`/annonces/${listing.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden group cursor-pointer"
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${size === "sm" ? "h-36" : "h-44"}`}>
        <CarIllustration color={listing.color} title={listing.title} />

        {/* Top row overlays */}
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-2.5">
          <div className="flex gap-1.5">
            {listing.badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[listing.badge] ?? "bg-gray-700 text-white"}`}>
                {listing.badge}
              </span>
            )}
            {listing.verified && (
              <span className="flex items-center gap-0.5 bg-white/90 text-[#1a7a3c] text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                <CheckCircle className="w-2.5 h-2.5" />
                Vérifié
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); void toggleFavorite(); }}
            disabled={isPending}
            aria-pressed={favorited}
            aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
            className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow hover:scale-110 disabled:opacity-60 transition-transform"
          >
            <Heart className={`w-3.5 h-3.5 ${favorited ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
          </button>
        </div>

        {/* Fuel badge bottom left */}
        <div className="absolute bottom-2 left-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${FUEL_COLORS[listing.fuel] ?? "bg-gray-100 text-gray-600"}`}>
            {listing.fuel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={`${size === "sm" ? "p-2.5" : "p-3"}`}>
        <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-[#1a7a3c] transition-colors truncate">
          {listing.title}
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {listing.year} · {listing.km} · {listing.transmission}
        </p>
        <p className="flex items-center gap-0.5 text-[11px] text-gray-400 mt-0.5">
          <MapPin className="w-2.5 h-2.5 shrink-0" />
          {listing.location}
        </p>

        <div className="flex items-center justify-between mt-3 gap-1">
          <span className="text-[#1a7a3c] font-extrabold text-sm leading-none">
            {listing.price} <span className="text-[10px] font-semibold text-gray-400">DZD</span>
          </span>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 bg-[#25d366] hover:bg-[#1ebe5e] active:scale-95 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all shrink-0"
          >
            <MessageCircle className="w-3 h-3" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, Heart, Share2, Phone, MessageCircle, CheckCircle,
  MapPin, Eye, Clock, Star, Shield, ChevronLeft, ChevronRight,
  Gauge, Fuel, Settings, Calendar, Users, DoorOpen, Zap,
  Award, AlertCircle, Car,
} from "lucide-react";
import {
  useGetListing,
  type Listing,
  type ListingDetail as ListingDetailData,
} from "@workspace/api-client-react";
import CarCard from "@/components/CarCard";
import { useFavoriteListing } from "@/hooks/use-favorite-listing";

const FUEL_COLORS: Record<string, string> = {
  Essence:    "bg-orange-100 text-orange-700 border-orange-200",
  Diesel:     "bg-blue-100 text-blue-700 border-blue-200",
  GPL:        "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hybride:    "bg-teal-100 text-teal-700 border-teal-200",
  Électrique: "bg-green-100 text-green-700 border-green-200",
};

const ETAT_COLORS: Record<string, string> = {
  "Excellent": "bg-green-100 text-green-700",
  "Très bon":  "bg-teal-100 text-teal-700",
  "Bon":       "bg-yellow-100 text-yellow-700",
  "Passable":  "bg-orange-100 text-orange-700",
};

function GallerySlide({ color, title, angle }: { color: string; title: string; angle: number }) {
  const transforms = [
    { body: "M15 30 Q40 10 65 10 Q90 10 110 30", rx: 5, ry: 22 },
    { body: "M10 28 Q35 8 60 8 Q88 8 112 28", rx: 5, ry: 24 },
    { body: "M20 32 Q44 14 65 14 Q88 14 106 32", rx: 4, ry: 20 },
    { body: "M12 29 Q38 9 62 9 Q89 9 113 29", rx: 5, ry: 23 },
  ];
  const t = transforms[angle % transforms.length];
  const initials = title.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className={`w-full h-full bg-gradient-to-br ${color} flex flex-col items-center justify-center`}>
      <svg viewBox="0 0 130 70" fill="none" className="w-3/4 h-3/5 opacity-80">
        <rect x="8" y="30" width="114" height={t.ry} rx={t.rx} fill="rgba(255,255,255,0.45)" />
        <path d={t.body} stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" fill="rgba(255,255,255,0.28)" />
        <circle cx="30" cy="55" r="9" fill="rgba(0,0,0,0.5)" />
        <circle cx="100" cy="55" r="9" fill="rgba(0,0,0,0.5)" />
        <circle cx="30" cy="55" r="4.5" fill="rgba(255,255,255,0.35)" />
        <circle cx="100" cy="55" r="4.5" fill="rgba(255,255,255,0.35)" />
        <rect x="40" y="14" width="20" height="14" rx="2" fill="rgba(150,220,255,0.55)" />
        <rect x="66" y="14" width="20" height="14" rx="2" fill="rgba(150,220,255,0.55)" />
        <rect x="8" y="40" width="9" height="5" rx="1.5" fill="rgba(255,230,100,0.9)" />
        <rect x="113" y="40" width="9" height="5" rx="1.5" fill="rgba(255,80,80,0.9)" />
        {angle === 1 && <rect x="8" y="30" width="5" height={t.ry} rx="2" fill="rgba(255,255,255,0.15)" />}
        {angle === 2 && <ellipse cx="65" cy="32" rx="52" ry="12" fill="rgba(0,0,0,0.12)" />}
      </svg>
      <div className="flex flex-col items-center mt-1">
        <span className="text-white/50 text-[10px] font-semibold tracking-[0.2em] uppercase">
          {["Vue avant", "Profil gauche", "Vue arrière", "Intérieur", "Détail"][angle % 5]}
        </span>
        <span className="text-white/30 text-[9px] font-bold tracking-widest">{initials}</span>
      </div>
    </div>
  );
}

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = parseInt(params.id ?? "1", 10);

  const { data, isLoading, isError } = useGetListing(id);
  const listing = data?.listing;
  const detail = data?.detail;
  const similar = data?.similar ?? [];

  const [slide, setSlide] = useState(0);
  const { favorited, isPending: favoritePending, toggleFavorite } = useFavoriteListing(id);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const SLIDES = 5;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="h-4 w-56 bg-gray-100 rounded mb-5 animate-pulse" />
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 space-y-5">
            <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-52 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
          </div>
          <div className="w-full xl:w-80 space-y-4">
            <div className="h-56 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
            <div className="h-28 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !listing || !detail) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Car className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-700 mb-2">
          {isError ? "Impossible de charger l'annonce" : "Annonce introuvable"}
        </h1>
        <p className="text-gray-400 mb-6">
          {isError
            ? "Vérifiez que l'API est démarrée puis réessayez."
            : "Cette annonce n'existe pas ou a été supprimée."}
        </p>
        <button onClick={() => navigate("/annonces")} className="bg-[#1a7a3c] text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
          ← Voir toutes les annonces
        </button>
      </div>
    );
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 flex-wrap">
        <a href="/" className="hover:text-[#1a7a3c]">Accueil</a>
        <span>›</span>
        <button onClick={() => navigate("/annonces")} className="hover:text-[#1a7a3c]">Annonces</button>
        <span>›</span>
        <span className="text-gray-600 font-medium truncate max-w-[200px]">{listing.title}</span>
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate("/annonces")}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#1a7a3c] mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux annonces
      </button>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Gallery */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Main slide */}
            <div className="relative h-72 sm:h-96 select-none">
              <GallerySlide color={listing.color} title={listing.title} angle={slide} />

              {/* Arrows */}
              <button
                onClick={() => setSlide(s => (s - 1 + SLIDES) % SLIDES)}
                aria-label="Afficher la photo précédente"
                title="Photo précédente"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full shadow flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => setSlide(s => (s + 1) % SLIDES)}
                aria-label="Afficher la photo suivante"
                title="Photo suivante"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full shadow flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>

              {/* Counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {slide + 1} / {SLIDES}
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                {listing.badge && (
                  <span className="bg-[#1a7a3c] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                    {listing.badge}
                  </span>
                )}
                {listing.verified && (
                  <span className="flex items-center gap-1 bg-white/90 text-[#1a7a3c] text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                    <CheckCircle className="w-3 h-3" />
                    Vérifié
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 p-3 bg-gray-50 border-t border-gray-100">
              {Array.from({ length: SLIDES }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  aria-label={`Afficher la photo ${i + 1}`}
                  title={`Photo ${i + 1}`}
                  className={`flex-1 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    slide === i ? "border-[#1a7a3c] shadow-md" : "border-transparent opacity-60 hover:opacity-90"
                  }`}
                >
                  <GallerySlide color={listing.color} title={listing.title} angle={i} />
                </button>
              ))}
            </div>
          </div>

          {/* Title + meta (mobile) */}
          <div className="xl:hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <MobileHeader
              listing={listing}
              detail={detail}
              faved={favorited}
              favoritePending={favoritePending}
              onToggleFavorite={toggleFavorite}
              onShare={handleShare}
              copied={copied}
            />
          </div>

          {/* Specs grid */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 text-base mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#1a7a3c]" />
              Caractéristiques
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: <Calendar className="w-4 h-4 text-[#1a7a3c]" />, label: "Année", value: String(listing.year) },
                { icon: <Gauge className="w-4 h-4 text-[#1a7a3c]" />, label: "Kilométrage", value: listing.km },
                { icon: <Fuel className="w-4 h-4 text-[#1a7a3c]" />, label: "Carburant", value: listing.fuel },
                { icon: <Settings className="w-4 h-4 text-[#1a7a3c]" />, label: "Boîte", value: listing.transmission },
                { icon: <Zap className="w-4 h-4 text-[#1a7a3c]" />, label: "Puissance", value: `${detail.puissance} ch` },
                { icon: <Car className="w-4 h-4 text-[#1a7a3c]" />, label: "Cylindrée", value: detail.cylindree },
                { icon: <DoorOpen className="w-4 h-4 text-[#1a7a3c]" />, label: "Portes", value: `${detail.portes} portes` },
                { icon: <Users className="w-4 h-4 text-[#1a7a3c]" />, label: "Places", value: `${detail.places} places` },
                { icon: <MapPin className="w-4 h-4 text-[#1a7a3c]" />, label: "Wilaya", value: listing.wilaya },
                { icon: <Car className="w-4 h-4 text-[#1a7a3c]" />, label: "Couleur", value: detail.couleur },
                { icon: <Award className="w-4 h-4 text-[#1a7a3c]" />, label: "État", value: detail.etat },
                { icon: <Shield className="w-4 h-4 text-[#1a7a3c]" />, label: "Dédouané", value: detail.dedouane ? "Oui" : "Non" },
              ].map(spec => (
                <div key={spec.label} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
                  <div className="mt-0.5 shrink-0">{spec.icon}</div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{spec.label}</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{spec.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              {detail.firstHand && (
                <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> 1ère main
                </span>
              )}
              {detail.dedouane && (
                <span className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <Shield className="w-3 h-3" /> Dédouané
                </span>
              )}
              <span className={`flex items-center gap-1 border text-xs font-semibold px-3 py-1.5 rounded-full ${FUEL_COLORS[listing.fuel]}`}>
                <Fuel className="w-3 h-3" /> {listing.fuel}
              </span>
              <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${ETAT_COLORS[detail.etat]}`}>
                <Award className="w-3 h-3" /> {detail.etat}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 text-base mb-3">Description du vendeur</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{detail.description}</p>
          </div>

          {/* Options & Équipements */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 text-base mb-4">Équipements & Options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {detail.options.map(opt => (
                <div key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-[#1a7a3c] shrink-0" />
                  {opt}
                </div>
              ))}
            </div>
          </div>

          {/* Safety notice */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Conseil de sécurité</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Vérifiez toujours le véhicule en personne avant tout paiement. Ne versez jamais d'argent avant d'avoir inspecté la voiture. AutoDZ ne demande aucun frais de mise en relation.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="w-full xl:w-80 shrink-0 space-y-4">

          {/* Price card — desktop only */}
          <div className="hidden xl:block bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <DesktopHeader
              listing={listing}
              detail={detail}
              faved={favorited}
              favoritePending={favoritePending}
              onToggleFavorite={toggleFavorite}
              onShare={handleShare}
              copied={copied}
            />
          </div>

          {/* CTA buttons */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <a
              href={`https://wa.me/${detail.sellerWhatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25d366] hover:bg-[#1ebe5e] text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Contacter sur WhatsApp
            </a>

            {phoneRevealed ? (
              <a
                href={`tel:${detail.sellerPhone.replace(/\s/g, "")}`}
                className="flex items-center justify-center gap-2 w-full border-2 border-[#1a7a3c] text-[#1a7a3c] hover:bg-[#f0faf4] font-bold py-3 rounded-xl transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                {detail.sellerPhone}
              </a>
            ) : (
              <button
                onClick={() => setPhoneRevealed(true)}
                className="flex items-center justify-center gap-2 w-full border-2 border-[#1a7a3c] text-[#1a7a3c] hover:bg-[#f0faf4] font-bold py-3 rounded-xl transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                Voir le numéro de téléphone
              </button>
            )}
          </div>

          {/* Seller card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">À propos du vendeur</h3>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 bg-[#1a7a3c] rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                {detail.sellerName[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{detail.sellerName}</p>
                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                  detail.sellerType === "Concessionnaire"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {detail.sellerType}
                </span>
                <p className="text-[11px] text-gray-400 mt-0.5">Membre {detail.sellerMember}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-gray-900 text-sm">{detail.sellerRating}</span>
                </div>
                <p className="text-[10px] text-gray-400">Note</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="font-extrabold text-gray-900 text-sm">{detail.sellerTotalAds}</p>
                <p className="text-[10px] text-gray-400">Annonce{detail.sellerTotalAds > 1 ? "s" : ""}</p>
              </div>
            </div>

            <button
              disabled
              aria-disabled="true"
              title="Page vendeur bientôt disponible"
              className="w-full border border-gray-200 rounded-xl py-2 text-sm text-gray-400 cursor-not-allowed font-medium"
            >
              Voir toutes ses annonces · Bientôt
            </button>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Eye className="w-3.5 h-3.5" />
              <span><b className="text-gray-700">{detail.views}</b> vues</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {detail.postedDaysAgo === 0
                  ? "Aujourd'hui"
                  : detail.postedDaysAgo === 1
                  ? "Hier"
                  : `Il y a ${detail.postedDaysAgo} jours`}
              </span>
            </div>
          </div>

          {/* Verified trust box */}
          {listing.verified && (
            <div className="bg-[#f0faf4] border border-[#1a7a3c]/20 rounded-2xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#1a7a3c] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#1a7a3c]">Annonce vérifiée</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                  L'identité du vendeur et les informations du véhicule ont été vérifiées par AutoDZ.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SIMILAR LISTINGS ── */}
      {similar.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Annonces similaires</h2>
              <div className="w-12 h-1 bg-[#1a7a3c] rounded-full mt-1.5" />
            </div>
            <button
              onClick={() => navigate("/annonces")}
              className="text-sm text-[#1a7a3c] font-semibold hover:underline"
            >
              Voir toutes →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similar.map(l => <CarCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function MobileHeader({
  listing, detail, faved, favoritePending, onToggleFavorite, onShare, copied
}: {
  listing: Listing;
  detail: ListingDetailData;
  faved: boolean;
  favoritePending: boolean;
  onToggleFavorite: () => Promise<void>;
  onShare: () => void;
  copied: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2 mb-3">
        <h1 className="font-extrabold text-gray-900 text-xl leading-tight">{listing.title}</h1>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => { void onToggleFavorite(); }}
            disabled={favoritePending}
            aria-pressed={faved}
            aria-label={faved ? "Retirer des favoris" : "Ajouter aux favoris"}
            title={faved ? "Retirer des favoris" : "Ajouter aux favoris"}
            className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center hover:border-red-300 disabled:opacity-60 transition-colors"
          >
            <Heart className={`w-4 h-4 ${faved ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
          </button>
          <button
            onClick={onShare}
            aria-label="Partager l'annonce"
            title="Partager l'annonce"
            className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center hover:border-[#1a7a3c] transition-colors relative"
          >
            <Share2 className="w-4 h-4 text-gray-400" />
            {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">Copié !</span>}
          </button>
        </div>
      </div>
      <p className="text-3xl font-extrabold text-[#1a7a3c] mb-1">
        {listing.price} <span className="text-base font-semibold text-gray-400">DZD</span>
      </p>
      <p className="flex items-center gap-1 text-sm text-gray-500">
        <MapPin className="w-3.5 h-3.5" />{listing.location}, {listing.wilaya}
      </p>
    </>
  );
}

function DesktopHeader({
  listing, detail, faved, favoritePending, onToggleFavorite, onShare, copied
}: {
  listing: Listing;
  detail: ListingDetailData;
  faved: boolean;
  favoritePending: boolean;
  onToggleFavorite: () => Promise<void>;
  onShare: () => void;
  copied: boolean;
}) {
  return (
    <>
      <h1 className="font-extrabold text-gray-900 text-lg leading-tight mb-1">{listing.title}</h1>
      <p className="flex items-center gap-1 text-sm text-gray-500 mb-3">
        <MapPin className="w-3.5 h-3.5 shrink-0" />{listing.location}, {listing.wilaya}
      </p>
      <p className="text-3xl font-extrabold text-[#1a7a3c] mb-4">
        {listing.price} <span className="text-sm font-semibold text-gray-400">DZD</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => { void onToggleFavorite(); }}
          disabled={favoritePending}
          aria-pressed={faved}
          aria-label={faved ? "Retirer des favoris" : "Ajouter aux favoris"}
          title={faved ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={`flex-1 flex items-center justify-center gap-1.5 border-2 py-2 rounded-xl text-sm font-semibold transition-colors ${
            faved ? "border-red-300 text-red-500 bg-red-50" : "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-400"
          } disabled:opacity-60`}
        >
          <Heart className={`w-4 h-4 ${faved ? "fill-red-500" : ""}`} />
          {faved ? "Sauvegardé" : "Sauvegarder"}
        </button>
        <button
          onClick={onShare}
          aria-label="Partager l'annonce"
          title="Partager l'annonce"
          className="flex-1 flex items-center justify-center gap-1.5 border-2 border-gray-200 text-gray-600 hover:border-[#1a7a3c] hover:text-[#1a7a3c] py-2 rounded-xl text-sm font-semibold transition-colors relative"
        >
          <Share2 className="w-4 h-4" />
          {copied ? "Copié !" : "Partager"}
        </button>
      </div>
    </>
  );
}

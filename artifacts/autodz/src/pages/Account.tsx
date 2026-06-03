import { useState } from "react";
import { useLocation } from "wouter";
import {
  User, Star, Shield, Eye, MessageCircle, Heart, TrendingUp,
  Plus, Edit3, Trash2, Pause, Play, Zap, Clock, CheckCircle,
  ChevronRight, Phone, Car, AlertCircle, Bell, Settings,
  BarChart2, X, RefreshCw,
} from "lucide-react";
import { useListFavorites, type Listing as ApiListing } from "@workspace/api-client-react";
import { useFavoriteListing } from "@/hooks/use-favorite-listing";
import {
  ACCOUNT, MY_ADS, MY_MESSAGES,
  getListing, type AdStatus, type MyAd,
} from "@/data/account";

type Tab = "annonces" | "messages" | "favoris" | "profil";

const STATUS_CONFIG: Record<AdStatus, { label: string; color: string; dot: string }> = {
  active:  { label: "Active",  color: "bg-green-100 text-green-700",  dot: "bg-green-500"  },
  paused:  { label: "Pausée",  color: "bg-yellow-100 text-yellow-700",dot: "bg-yellow-500" },
  expired: { label: "Expirée", color: "bg-gray-100 text-gray-500",    dot: "bg-gray-400"   },
  sold:    { label: "Vendue",  color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500"   },
};

export default function Account() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("annonces");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [ads, setAds] = useState(MY_ADS);
  const [messages, setMessages] = useState(MY_MESSAGES);
  const favoritesQuery = useListFavorites();
  const favoriteListings = favoritesQuery.data?.items ?? [];

  const unreadCount = messages.filter(m => !m.read).length;

  const togglePause = (id: number) =>
    setAds(prev => prev.map(a =>
      a.listingId === id
        ? { ...a, status: a.status === "active" ? "paused" : "active" }
        : a
    ));

  const markRead = (id: number) =>
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));

  const activeAds  = ads.filter(a => a.status === "active").length;
  const totalViews = ads.reduce((s, a) => s + a.views, 0);
  const totalMsgs  = ads.reduce((s, a) => s + a.messages, 0);
  const totalFavs  = ads.reduce((s, a) => s + a.favorites, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
        <button onClick={() => navigate("/")} className="hover:text-[#1a7a3c]">Accueil</button>
        <span>›</span>
        <span className="text-gray-600 font-medium">Mon compte</span>
      </div>

      {/* ── PROFILE HEADER ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 bg-[#1a7a3c] rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-[#1a7a3c]/20">
              {ACCOUNT.initials}
            </div>
            {ACCOUNT.verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1a7a3c] rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-extrabold text-gray-900 text-xl">{ACCOUNT.name}</h1>
              <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
                {ACCOUNT.sellerType}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{ACCOUNT.email}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" /> Membre depuis {ACCOUNT.memberSince}
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                {ACCOUNT.rating} ({ACCOUNT.reviewCount} avis)
              </span>
              <span className="flex items-center gap-1 text-xs text-[#1a7a3c] font-semibold">
                <Car className="w-3 h-3" /> {ACCOUNT.totalSales} vente{ACCOUNT.totalSales > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-600 hover:border-[#1a7a3c] hover:text-[#1a7a3c] transition-colors font-medium">
              <Settings className="w-3.5 h-3.5" /> Modifier le profil
            </button>
            <button
              onClick={() => navigate("/deposer-annonce")}
              className="flex items-center gap-1.5 text-xs bg-[#1a7a3c] hover:bg-[#15632f] text-white rounded-xl px-3 py-2 font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nouvelle annonce
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100">
          {[
            { icon: <Car className="w-4 h-4 text-[#1a7a3c]" />,          label: "Annonces actives",  value: activeAds,                  suffix: "" },
            { icon: <Eye className="w-4 h-4 text-blue-500" />,           label: "Vues totales",       value: totalViews.toLocaleString(), suffix: "" },
            { icon: <MessageCircle className="w-4 h-4 text-green-500" />, label: "Messages reçus",    value: totalMsgs,                  suffix: "" },
            { icon: <Heart className="w-4 h-4 text-red-400" />,          label: "Favoris",            value: totalFavs,                  suffix: "" },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className="font-extrabold text-gray-900 text-base leading-none">{stat.value}{stat.suffix}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 mb-5">
        {([
          { id: "annonces" as Tab, label: "Mes annonces", icon: <Car className="w-4 h-4" />, badge: activeAds },
          { id: "messages" as Tab, label: "Messages",     icon: <MessageCircle className="w-4 h-4" />, badge: unreadCount },
          { id: "favoris"  as Tab, label: "Favoris",      icon: <Heart className="w-4 h-4" />, badge: favoriteListings.length },
          { id: "profil"   as Tab, label: "Profil",       icon: <User className="w-4 h-4" />,  badge: 0 },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all relative ${
              tab === t.id
                ? "bg-[#1a7a3c] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.badge > 0 && (
              <span className={`absolute -top-1 -right-1 w-4.5 h-4 text-[9px] font-extrabold rounded-full flex items-center justify-center px-1 ${
                tab === t.id ? "bg-white text-[#1a7a3c]" : "bg-[#1a7a3c] text-white"
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── MES ANNONCES ── */}
      {tab === "annonces" && (
        <div className="space-y-3">
          {ads.map(ad => {
            const listing = getListing(ad.listingId);
            if (!listing) return null;
            const cfg = STATUS_CONFIG[ad.status];

            return (
              <div key={ad.listingId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {ad.status === "expired" && (
                  <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">Cette annonce a expiré. Renouvelez-la pour qu'elle soit à nouveau visible.</p>
                    <button className="ml-auto text-xs font-bold text-amber-700 underline whitespace-nowrap">Renouveler</button>
                  </div>
                )}

                <div className="p-4 flex gap-4">
                  {/* Car illustration */}
                  <div
                    className={`w-28 h-20 sm:w-36 sm:h-24 rounded-xl shrink-0 bg-gradient-to-br ${listing.color} flex items-center justify-center cursor-pointer`}
                    onClick={() => navigate(`/annonces/${listing.id}`)}
                  >
                    <svg viewBox="0 0 120 60" fill="none" className="w-4/5 h-4/5 opacity-75">
                      <rect x="10" y="28" width="100" height="22" rx="5" fill="rgba(255,255,255,0.45)" />
                      <path d="M18 28 Q38 10 60 10 Q85 10 104 28" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
                      <circle cx="28" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
                      <circle cx="92" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
                      <circle cx="28" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
                      <circle cx="92" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          {ad.boosted && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              <Zap className="w-2.5 h-2.5" /> Boostée
                            </span>
                          )}
                        </div>
                        <h3
                          className="font-bold text-gray-900 text-sm cursor-pointer hover:text-[#1a7a3c] transition-colors truncate"
                          onClick={() => navigate(`/annonces/${listing.id}`)}
                        >
                          {listing.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {listing.year} · {listing.km} · {listing.fuel}
                        </p>
                        <p className="text-sm font-extrabold text-[#1a7a3c] mt-1">
                          {listing.price} DZD
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(ad.status === "active" || ad.status === "paused") && (
                          <>
                            <button
                              onClick={() => navigate(`/annonces/${listing.id}`)}
                              className="p-2 text-gray-400 hover:text-[#1a7a3c] hover:bg-green-50 rounded-lg transition-colors"
                              title="Voir l'annonce"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => togglePause(ad.listingId)}
                              className={`p-2 rounded-lg transition-colors ${
                                ad.status === "active"
                                  ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                  : "text-amber-600 bg-amber-50 hover:bg-amber-100"
                              }`}
                              title={ad.status === "active" ? "Mettre en pause" : "Réactiver"}
                            >
                              {ad.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                        {ad.status === "expired" && (
                          <button className="p-2 text-gray-400 hover:text-[#1a7a3c] hover:bg-green-50 rounded-lg transition-colors" title="Renouveler">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingId(ad.listingId)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                      <Stat icon={<Eye className="w-3 h-3 text-blue-400" />} value={ad.views.toLocaleString()} label="vues" />
                      <Stat icon={<MessageCircle className="w-3 h-3 text-green-400" />} value={ad.messages} label="messages" />
                      <Stat icon={<Heart className="w-3 h-3 text-red-400" />} value={ad.favorites} label="favoris" />
                      {ad.status === "active" && (
                        <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expire dans {ad.expiresInDays}j
                        </span>
                      )}
                      {ad.status === "sold" && (
                        <span className="text-[10px] text-blue-600 font-bold ml-auto flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Vendue il y a {ad.postedDaysAgo - 25}j
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Boost banner for non-boosted active ads */}
                {ad.status === "active" && !ad.boosted && (
                  <div className="border-t border-gray-50 px-4 py-2.5 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
                    <p className="text-xs text-amber-700 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span className="font-semibold">Boostez cette annonce</span> pour être mis en avant et recevoir 3× plus de contacts
                    </p>
                    <button className="text-xs font-bold text-amber-700 border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                      Booster
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* CTA for new ad */}
          <button
            onClick={() => navigate("/deposer-annonce")}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#1a7a3c] rounded-2xl py-5 text-sm font-semibold text-gray-400 hover:text-[#1a7a3c] transition-all group"
          >
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 group-hover:border-[#1a7a3c] flex items-center justify-center transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            Déposer une nouvelle annonce
          </button>
        </div>
      )}

      {/* ── MESSAGES ── */}
      {tab === "messages" && (
        <div className="space-y-2">
          {messages.length === 0 ? (
            <EmptyState icon={<MessageCircle className="w-8 h-8 text-gray-300" />} text="Aucun message reçu pour le moment." />
          ) : (
            messages.map(msg => {
              const listing = getListing(msg.listingId);
              return (
                <div
                  key={msg.id}
                  onClick={() => markRead(msg.id)}
                  className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
                    !msg.read ? "border-[#1a7a3c]/30 bg-[#f0faf4]/50" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow ${
                      msg.via === "whatsapp" ? "bg-[#25d366]" : "bg-[#1a7a3c]"
                    }`}>
                      {msg.senderName[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm font-bold ${!msg.read ? "text-gray-900" : "text-gray-700"}`}>
                            {msg.senderName}
                            {!msg.read && <span className="ml-2 w-1.5 h-1.5 bg-[#1a7a3c] rounded-full inline-block align-middle" />}
                          </p>
                          {listing && (
                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <Car className="w-3 h-3" /> {listing.title}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            msg.via === "whatsapp"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {msg.via === "whatsapp" ? "WhatsApp" : "Plateforme"}
                          </span>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {msg.receivedHoursAgo < 24
                              ? `Il y a ${msg.receivedHoursAgo}h`
                              : `Il y a ${Math.floor(msg.receivedHoursAgo / 24)}j`}
                          </span>
                        </div>
                      </div>

                      <p className={`text-xs mt-1.5 leading-relaxed line-clamp-2 ${!msg.read ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                        {msg.text}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        <a
                          href={`tel:${msg.senderPhone.replace(/\s/g, "")}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#1a7a3c] border border-[#1a7a3c]/30 hover:bg-[#f0faf4] px-2 py-1 rounded-lg transition-colors"
                        >
                          <Phone className="w-3 h-3" /> {msg.senderPhone}
                        </a>
                        {listing && (
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/annonces/${listing.id}`); }}
                            className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 hover:text-[#1a7a3c] transition-colors"
                          >
                            Voir l'annonce <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── FAVORIS ── */}
      {tab === "favoris" && (
        <div>
          {favoritesQuery.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-64 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
              ))}
            </div>
          ) : favoritesQuery.isError ? (
            <EmptyState icon={<AlertCircle className="w-8 h-8 text-red-300" />} text="Impossible de charger vos favoris pour le moment." />
          ) : favoriteListings.length === 0 ? (
            <EmptyState icon={<Heart className="w-8 h-8 text-gray-300" />} text="Vous n'avez pas encore sauvegardé d'annonces." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteListings.map((listing) => (
                <FavoriteAccountCard key={listing.id} listing={listing} onOpen={() => navigate(`/annonces/${listing.id}`)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROFIL ── */}
      {tab === "profil" && (
        <div className="space-y-4">
          {/* Personal info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-gray-900">Informations personnelles</h2>
              <button className="flex items-center gap-1.5 text-xs text-[#1a7a3c] font-semibold border border-[#1a7a3c]/30 hover:bg-[#f0faf4] px-3 py-1.5 rounded-lg transition-colors">
                <Edit3 className="w-3.5 h-3.5" /> Modifier
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nom complet",   value: ACCOUNT.name,      icon: <User className="w-4 h-4 text-gray-400" /> },
                { label: "Email",         value: ACCOUNT.email,     icon: <Bell className="w-4 h-4 text-gray-400" /> },
                { label: "Téléphone",     value: ACCOUNT.phone,     icon: <Phone className="w-4 h-4 text-gray-400" /> },
                { label: "Wilaya",        value: ACCOUNT.wilaya,    icon: <Car className="w-4 h-4 text-gray-400" /> },
                { label: "Type de compte",value: ACCOUNT.sellerType,icon: <User className="w-4 h-4 text-gray-400" /> },
                { label: "Membre depuis", value: ACCOUNT.memberSince,icon:<Clock className="w-4 h-4 text-gray-400" /> },
              ].map(field => (
                <div key={field.label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="mt-0.5">{field.icon}</div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{field.label}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{field.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reputation */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4">Réputation & Avis</h2>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <p className="text-4xl font-extrabold text-gray-900">{ACCOUNT.rating}</p>
                <div className="flex justify-center gap-0.5 my-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(ACCOUNT.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">{ACCOUNT.reviewCount} avis</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5,4,3,2,1].map(star => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-3">{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${[70, 20, 7, 2, 1][5 - star]}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 w-6">{[70, 20, 7, 2, 1][5 - star]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#1a7a3c]" />
              Performance des annonces
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Vues ce mois",   value: "2 684", trend: "+12%",  positive: true },
                { label: "Contacts reçus", value: "25",    trend: "+3",    positive: true },
                { label: "Taux de réponse",value: "92%",   trend: "",      positive: true },
                { label: "Ventes réalisées",value: "3",    trend: "",      positive: true },
              ].map(m => (
                <div key={m.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold text-gray-900">{m.value}</p>
                  {m.trend && (
                    <p className={`text-[10px] font-bold ${m.positive ? "text-green-600" : "text-red-500"}`}>
                      {m.positive ? "▲" : "▼"} {m.trend}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
            <h2 className="font-extrabold text-red-600 mb-2 text-sm">Zone sensible</h2>
            <p className="text-xs text-gray-500 mb-4">Ces actions sont irréversibles. Procédez avec prudence.</p>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 text-xs font-semibold text-gray-600 border border-gray-200 hover:border-red-200 hover:text-red-500 px-4 py-2 rounded-xl transition-colors">
                <X className="w-3.5 h-3.5" /> Désactiver le compte
              </button>
              <button className="flex items-center gap-2 text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Supprimer le compte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-extrabold text-gray-900">Supprimer l'annonce ?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Cette action est irréversible. L'annonce sera définitivement supprimée et ne sera plus visible par les acheteurs.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setAds(prev => prev.filter(a => a.listingId !== deletingId));
                  setDeletingId(null);
                }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FavoriteAccountCard({ listing, onOpen }: { listing: ApiListing; onOpen: () => void }) {
  const { isPending, toggleFavorite } = useFavoriteListing(listing.id);

  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group cursor-pointer"
    >
      <div className={`h-36 bg-gradient-to-br ${listing.color} flex items-center justify-center relative`}>
        <svg viewBox="0 0 120 60" fill="none" className="w-4/5 h-4/5 opacity-75">
          <rect x="10" y="28" width="100" height="22" rx="5" fill="rgba(255,255,255,0.45)" />
          <path d="M18 28 Q38 10 60 10 Q85 10 104 28" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
          <circle cx="28" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
          <circle cx="92" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
          <circle cx="28" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
          <circle cx="92" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
        </svg>
        <button
          onClick={(event) => { event.stopPropagation(); void toggleFavorite(); }}
          disabled={isPending}
          aria-label="Retirer des favoris"
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow disabled:opacity-60"
        >
          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
        </button>
        <span className="absolute bottom-2 left-2 text-[10px] bg-white/90 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
          {listing.fuel}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#1a7a3c] transition-colors truncate">{listing.title}</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">{listing.year} · {listing.km}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#1a7a3c] font-extrabold text-sm">
            {listing.price} <span className="text-[10px] text-gray-400 font-medium">DZD</span>
          </span>
          <span className="text-[10px] text-gray-400">Sauvegardé</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      {icon}
      <span className="font-bold text-gray-700">{value}</span>
      <span>{label}</span>
    </span>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3">
      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm text-gray-400 font-medium">{text}</p>
    </div>
  );
}

import { useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  User, Star, Eye, MessageCircle, Heart,
  Plus, Edit3, Trash2, Zap, Clock, CheckCircle,
  Phone, Car, AlertCircle, Bell, Settings,
  BarChart2, X, RefreshCw, Upload,
} from "lucide-react";
import {
  useGetAccount,
  useDeleteListing,
  useListFavorites,
  useUpdateListing,
  type AccountListing,
  type CreateListingPhoto,
  type Listing as ApiListing,
  type ListingPhoto,
  type ListingStatus,
  type UpdateListingRequest,
} from "@workspace/api-client-react";
import { useFavoriteListing } from "@/hooks/use-favorite-listing";
import {
  getMaxListingPhotos,
  uploadListingPhotos,
  validateListingPhoto,
} from "@/lib/listing-photo-storage";

type Tab = "annonces" | "messages" | "favoris" | "profil";
type AdStatus = AccountListing["status"];
type EditListingForm = {
  title: string;
  priceRaw: string;
  kmRaw: string;
  wilaya: string;
  location: string;
  description: string;
  status: ListingStatus;
};
type EditablePhoto = {
  key: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  file?: File;
};

const STATUS_CONFIG: Record<AdStatus, { label: string; color: string; dot: string }> = {
  active:  { label: "Active",  color: "bg-green-100 text-green-700",  dot: "bg-green-500"  },
  draft:   { label: "Brouillon", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  sold:    { label: "Vendue",  color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500"   },
};

const ACCOUNT_QUERY_KEY = ["/api/account"] as const;
const LISTINGS_QUERY_KEY = ["/api/listings"] as const;
const FAVORITES_QUERY_KEY = ["/api/favorites"] as const;
const EDIT_PHOTO_INPUT_ID = "account-edit-listing-photo-input";

function getApiErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Une erreur est survenue. Réessayez dans un instant.";
}

export default function Account() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("annonces");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingAd, setEditingAd] = useState<AccountListing | null>(null);
  const [editForm, setEditForm] = useState<EditListingForm>({
    title: "",
    priceRaw: "",
    kmRaw: "",
    wilaya: "",
    location: "",
    description: "",
    status: "active",
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [editPhotos, setEditPhotos] = useState<EditablePhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isUploadingEditPhotos, setIsUploadingEditPhotos] = useState(false);
  const [editPhotoDragOver, setEditPhotoDragOver] = useState(false);
  const accountQuery = useGetAccount();
  const favoritesQuery = useListFavorites();
  const updateListingMutation = useUpdateListing();
  const deleteListingMutation = useDeleteListing();
  const account = accountQuery.data;
  const accountListings = account?.listings ?? [];
  const favoriteListings = favoritesQuery.data?.items ?? [];
  const accountUser = account?.user;
  const profile = {
    name: accountUser?.name ?? "Compte AutoDZ",
    initials: accountUser?.initials ?? "AD",
    email: accountUser?.email ?? "—",
    phone: accountUser?.phone ?? "—",
    wilaya: accountUser?.wilaya ?? "—",
    sellerType: accountUser?.sellerType ?? "Particulier",
    memberSince: accountUser?.memberSince ?? "—",
    rating: accountUser?.rating ?? 0,
    reviewCount: accountUser?.reviewCount ?? 0,
    verified: accountUser?.verified ?? false,
    totalSales: accountUser?.totalSales ?? 0,
    isDevFallback: accountUser?.isDevFallback ?? false,
  };

  const activeAds  = accountListings.filter(a => a.status === "active").length;
  const totalViews = accountListings.reduce((s, a) => s + a.views, 0);
  const totalMsgs  = 0;
  const totalFavs  = accountListings.reduce((s, a) => s + a.favorites, 0);
  const updatingListingId = updateListingMutation.isPending
    ? updateListingMutation.variables?.listingId
    : undefined;

  const invalidateListingQueries = async (listingId?: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: LISTINGS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY }),
      listingId
        ? queryClient.invalidateQueries({ queryKey: [`/api/listings/${listingId}`] })
        : Promise.resolve(),
    ]);
  };

  const revokeNewPhotoPreviews = (photos: EditablePhoto[]) => {
    photos.forEach((photo) => {
      if (photo.file) URL.revokeObjectURL(photo.url);
    });
  };

  const toEditablePhotos = (photos: ListingPhoto[] | undefined): EditablePhoto[] => {
    const normalizedPhotos = photos ?? [];

    return normalizedPhotos.map((photo, index) => ({
      key: `${photo.url}-${index}`,
      url: photo.url,
      alt: photo.alt,
      isPrimary: photo.isPrimary || (index === 0 && !normalizedPhotos.some((item) => item.isPrimary)),
    }));
  };

  const closeEditModal = () => {
    revokeNewPhotoPreviews(editPhotos);
    setEditingAd(null);
    setEditPhotos([]);
    setPhotoError(null);
    setIsUploadingEditPhotos(false);
    setEditPhotoDragOver(false);
  };

  const openEditModal = (ad: AccountListing) => {
    revokeNewPhotoPreviews(editPhotos);
    setActionError(null);
    setActionSuccess(null);
    setPhotoError(null);
    setEditingAd(ad);
    setEditPhotos(toEditablePhotos(ad.listing.photos));
    setEditForm({
      title: ad.listing.title,
      priceRaw: String(ad.listing.priceRaw),
      kmRaw: String(ad.listing.kmRaw),
      wilaya: ad.listing.wilaya,
      location: ad.listing.location,
      description: ad.listing.description,
      status: ad.status,
    });
  };

  const normalizePrimaryPhoto = (photos: EditablePhoto[]) => {
    if (photos.length === 0) return photos;
    const primaryIndex = photos.findIndex((photo) => photo.isPrimary);
    const safePrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

    return photos.map((photo, index) => ({
      ...photo,
      isPrimary: index === safePrimaryIndex,
    }));
  };

  const handleEditPhotoFiles = (files: FileList | null) => {
    if (!files) return;

    setPhotoError(null);

    const remainingSlots = getMaxListingPhotos() - editPhotos.length;

    if (remainingSlots <= 0) {
      setPhotoError(`Vous pouvez ajouter jusqu'à ${getMaxListingPhotos()} photos maximum.`);
      return;
    }

    const acceptedPhotos: EditablePhoto[] = [];

    for (const file of Array.from(files)) {
      const validationError = validateListingPhoto(file);

      if (validationError) {
        setPhotoError(validationError);
        continue;
      }

      if (acceptedPhotos.length >= remainingSlots) {
        setPhotoError(`Seulement ${remainingSlots} photo${remainingSlots > 1 ? "s" : ""} supplémentaire${remainingSlots > 1 ? "s" : ""} ajoutée${remainingSlots > 1 ? "s" : ""}.`);
        break;
      }

      acceptedPhotos.push({
        key: `new-${Date.now()}-${acceptedPhotos.length}-${file.name}`,
        url: URL.createObjectURL(file),
        alt: file.name,
        isPrimary: false,
        file,
      });
    }

    if (acceptedPhotos.length === 0) return;

    setEditPhotos((photos) => normalizePrimaryPhoto([...photos, ...acceptedPhotos]));
  };

  const handleEditPhotoKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      editPhotoInputRef.current?.click();
    }
  };

  const removeEditPhoto = (photoKey: string) => {
    setEditPhotos((photos) => {
      const removedPhoto = photos.find((photo) => photo.key === photoKey);
      if (removedPhoto?.file) URL.revokeObjectURL(removedPhoto.url);

      return normalizePrimaryPhoto(photos.filter((photo) => photo.key !== photoKey));
    });
  };

  const setPrimaryEditPhoto = (photoKey: string) => {
    setEditPhotos((photos) =>
      photos.map((photo) => ({
        ...photo,
        isPrimary: photo.key === photoKey,
      })),
    );
  };

  const buildFinalPhotos = async (): Promise<CreateListingPhoto[]> => {
    const newPhotos = editPhotos.filter((photo) => photo.file);
    const uploadedPhotos = await uploadListingPhotos(
      newPhotos.map((photo) => photo.file).filter((file): file is File => Boolean(file)),
    );
    let uploadedIndex = 0;
    const normalizedPhotos = normalizePrimaryPhoto(editPhotos);

    return normalizedPhotos.map((photo, position) => {
      const uploadedPhoto = photo.file ? uploadedPhotos[uploadedIndex++] : undefined;

      return {
        url: uploadedPhoto?.url ?? photo.url,
        alt: photo.alt ?? uploadedPhoto?.alt,
        position,
        isPrimary: photo.isPrimary,
      };
    });
  };

  const handleUpdateListing = async (
    listingId: number,
    data: UpdateListingRequest,
    successMessage: string,
    options?: { keepModalOpen?: boolean },
  ) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await updateListingMutation.mutateAsync({ listingId, data });
      await invalidateListingQueries(listingId);
      setActionSuccess(successMessage);
      if (!options?.keepModalOpen) closeEditModal();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAd) return;

    setPhotoError(null);

    try {
      setIsUploadingEditPhotos(true);
      const photos = await buildFinalPhotos();
      setIsUploadingEditPhotos(false);

      await handleUpdateListing(
        editingAd.listing.id,
        {
          title: editForm.title,
          priceRaw: Number(editForm.priceRaw),
          kmRaw: Number(editForm.kmRaw),
          wilaya: editForm.wilaya,
          location: editForm.location,
          description: editForm.description,
          status: editForm.status,
          photos,
        },
        "Annonce modifiée avec succès.",
      );
    } catch (error) {
      setIsUploadingEditPhotos(false);
      setPhotoError(getApiErrorMessage(error));
    }
  };

  const handleDeleteListing = async () => {
    if (deletingId === null) return;

    setActionError(null);
    setActionSuccess(null);

    try {
      await deleteListingMutation.mutateAsync({ listingId: deletingId });
      await invalidateListingQueries(deletingId);
      setActionSuccess("Annonce supprimée avec succès.");
      setDeletingId(null);
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  };

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
              {profile.initials}
            </div>
            {profile.verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1a7a3c] rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-extrabold text-gray-900 text-xl">{profile.name}</h1>
              <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
                {profile.sellerType}
              </span>
              {profile.isDevFallback && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 font-semibold px-2 py-0.5 rounded-full">
                  Mode dev
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" /> Membre {profile.memberSince}
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                {profile.rating} ({profile.reviewCount} avis)
              </span>
              <span className="flex items-center gap-1 text-xs text-[#1a7a3c] font-semibold">
                <Car className="w-3 h-3" /> {profile.totalSales} vente{profile.totalSales > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              disabled
              aria-disabled="true"
              title="Modification du profil bientôt disponible"
              className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-400 cursor-not-allowed font-medium"
            >
              <Settings className="w-3.5 h-3.5" /> Modifier le profil · Bientôt
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
          { id: "messages" as Tab, label: "Messages",     icon: <MessageCircle className="w-4 h-4" />, badge: 0 },
          { id: "favoris"  as Tab, label: "Favoris",      icon: <Heart className="w-4 h-4" />, badge: favoriteListings.length },
          { id: "profil"   as Tab, label: "Profil",       icon: <User className="w-4 h-4" />,  badge: 0 },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-label={`Afficher ${t.label.toLowerCase()}`}
            title={t.label}
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
          {actionError && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 text-sm font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          {actionSuccess && (
            <div className="bg-green-50 border border-green-100 text-green-700 rounded-2xl px-4 py-3 text-sm font-medium flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}
          {accountQuery.isLoading ? (
            Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-40 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
            ))
          ) : accountQuery.isError ? (
            <EmptyState icon={<AlertCircle className="w-8 h-8 text-red-300" />} text="Impossible de charger vos annonces pour le moment." />
          ) : accountListings.length === 0 ? (
            <EmptyState icon={<Car className="w-8 h-8 text-gray-300" />} text="Vous n'avez pas encore déposé d'annonce." />
          ) : (
            accountListings.map(ad => {
            const listing = ad.listing;
            const cfg = STATUS_CONFIG[ad.status];

            return (
              <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {ad.status === "draft" && (
                  <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-600 font-medium">Cette annonce est en brouillon. Réactivez-la pour la publier.</p>
                  </div>
                )}

                <div className="p-4 flex gap-4">
                  {/* Car illustration */}
                  <div
                    className={`w-28 h-20 sm:w-36 sm:h-24 rounded-xl shrink-0 bg-gradient-to-br ${listing.color} flex items-center justify-center cursor-pointer overflow-hidden`}
                    onClick={() => navigate(`/annonces/${listing.id}`)}
                  >
                    {listing.photos?.[0] ? (
                      <img
                        src={listing.photos[0].url}
                        alt={listing.photos[0].alt ?? listing.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <svg viewBox="0 0 120 60" fill="none" className="w-4/5 h-4/5 opacity-75">
                        <rect x="10" y="28" width="100" height="22" rx="5" fill="rgba(255,255,255,0.45)" />
                        <path d="M18 28 Q38 10 60 10 Q85 10 104 28" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
                        <circle cx="28" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
                        <circle cx="92" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
                        <circle cx="28" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
                        <circle cx="92" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
                      </svg>
                    )}
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
                        <button
                          onClick={() => navigate(`/annonces/${listing.id}`)}
                          className="p-2 text-gray-400 hover:text-[#1a7a3c] hover:bg-green-50 rounded-lg transition-colors"
                          title="Voir l'annonce"
                          aria-label={`Voir l'annonce ${listing.title}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(ad)}
                          disabled={updatingListingId === listing.id}
                          className="p-2 text-gray-400 hover:text-[#1a7a3c] hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Modifier"
                          aria-label={`Modifier l'annonce ${listing.title}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {ad.status === "active" ? (
                          <button
                            onClick={() => void handleUpdateListing(listing.id, { status: "sold" }, "Annonce marquée comme vendue.")}
                            disabled={updatingListingId === listing.id}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Marquer comme vendu"
                            aria-label={`Marquer l'annonce ${listing.title} comme vendue`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => void handleUpdateListing(listing.id, { status: "active" }, "Annonce réactivée avec succès.")}
                            disabled={updatingListingId === listing.id}
                            className="p-2 text-gray-400 hover:text-[#1a7a3c] hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Réactiver"
                            aria-label={`Réactiver l'annonce ${listing.title}`}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingId(listing.id)}
                          disabled={deleteListingMutation.isPending}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                          aria-label={`Supprimer l'annonce ${listing.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                      <Stat icon={<Eye className="w-3 h-3 text-blue-400" />} value={ad.views.toLocaleString()} label="vues" />
                      <Stat icon={<MessageCircle className="w-3 h-3 text-green-400" />} value={0} label="messages" />
                      <Stat icon={<Heart className="w-3 h-3 text-red-400" />} value={ad.favorites} label="favoris" />
                      {ad.status === "active" && (
                        <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expire dans {ad.expiresInDays}j
                        </span>
                      )}
                      {ad.status === "sold" && (
                        <span className="text-[10px] text-blue-600 font-bold ml-auto flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Marquée vendue
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
                    <button
                      disabled
                      aria-disabled="true"
                      title="Boost d'annonce bientôt disponible"
                      className="text-xs font-bold text-amber-600 border border-amber-200 bg-amber-50/60 px-3 py-1.5 rounded-lg whitespace-nowrap cursor-not-allowed"
                    >
                      Booster · Bientôt
                    </button>
                  </div>
                )}
              </div>
            );
          }))}

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
          <EmptyState icon={<MessageCircle className="w-8 h-8 text-gray-300" />} text="Aucun message réel disponible pour le moment." />
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
              <button
                disabled
                aria-disabled="true"
                title="Modification du profil bientôt disponible"
                className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold border border-gray-200 px-3 py-1.5 rounded-lg cursor-not-allowed"
              >
                <Edit3 className="w-3.5 h-3.5" /> Modifier · Bientôt
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nom complet",   value: profile.name,        icon: <User className="w-4 h-4 text-gray-400" /> },
                { label: "Email",         value: profile.email,       icon: <Bell className="w-4 h-4 text-gray-400" /> },
                { label: "Téléphone",     value: profile.phone,       icon: <Phone className="w-4 h-4 text-gray-400" /> },
                { label: "Wilaya",        value: profile.wilaya,      icon: <Car className="w-4 h-4 text-gray-400" /> },
                { label: "Type de compte",value: profile.sellerType,  icon: <User className="w-4 h-4 text-gray-400" /> },
                { label: "Membre depuis", value: profile.memberSince, icon:<Clock className="w-4 h-4 text-gray-400" /> },
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
                <p className="text-4xl font-extrabold text-gray-900">{profile.rating}</p>
                <div className="flex justify-center gap-0.5 my-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(profile.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">{profile.reviewCount} avis</p>
              </div>
              <div className="flex-1 rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500">
                  La note et le nombre d'avis viennent du profil réel.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  La répartition détaillée des avis sera affichée dès qu'elle sera exposée par l'API.
                </p>
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
                { label: "Vues totales", value: totalViews.toLocaleString("fr-DZ"), trend: "", positive: true },
                { label: "Contacts reçus", value: totalMsgs, trend: "", positive: true },
                { label: "Favoris reçus", value: totalFavs, trend: "", positive: true },
                { label: "Ventes réalisées", value: profile.totalSales, trend: "", positive: true },
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
              <button
                disabled
                aria-disabled="true"
                title="Désactivation du compte bientôt disponible"
                className="flex items-center gap-2 text-xs font-semibold text-gray-400 border border-gray-200 px-4 py-2 rounded-xl cursor-not-allowed"
              >
                <X className="w-3.5 h-3.5" /> Désactiver le compte · Bientôt
              </button>
              <button
                disabled
                aria-disabled="true"
                title="Suppression du compte bientôt disponible"
                className="flex items-center gap-2 text-xs font-semibold text-gray-400 border border-gray-200 px-4 py-2 rounded-xl cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" /> Supprimer le compte · Bientôt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit listing modal */}
      {editingAd !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={closeEditModal}
            aria-label="Fermer la modification"
          />
          <form
            onSubmit={(event) => void handleEditSubmit(event)}
            className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">Modifier l'annonce</h3>
                <p className="text-sm text-gray-500 mt-1">Mettez à jour les informations principales de votre annonce.</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg"
                aria-label="Fermer"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-gray-600">Titre</span>
                <input
                  value={editForm.title}
                  onChange={(event) => setEditForm((form) => ({ ...form, title: event.target.value }))}
                  required
                  maxLength={180}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/20 focus:border-[#1a7a3c]"
                />
              </label>
              <label>
                <span className="text-xs font-bold text-gray-600">Prix (DZD)</span>
                <input
                  type="number"
                  value={editForm.priceRaw}
                  onChange={(event) => setEditForm((form) => ({ ...form, priceRaw: event.target.value }))}
                  required
                  min={1}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/20 focus:border-[#1a7a3c]"
                />
              </label>
              <label>
                <span className="text-xs font-bold text-gray-600">Kilométrage</span>
                <input
                  type="number"
                  value={editForm.kmRaw}
                  onChange={(event) => setEditForm((form) => ({ ...form, kmRaw: event.target.value }))}
                  required
                  min={0}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/20 focus:border-[#1a7a3c]"
                />
              </label>
              <label>
                <span className="text-xs font-bold text-gray-600">Wilaya</span>
                <input
                  value={editForm.wilaya}
                  onChange={(event) => setEditForm((form) => ({ ...form, wilaya: event.target.value }))}
                  required
                  maxLength={80}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/20 focus:border-[#1a7a3c]"
                />
              </label>
              <label>
                <span className="text-xs font-bold text-gray-600">Localisation</span>
                <input
                  value={editForm.location}
                  onChange={(event) => setEditForm((form) => ({ ...form, location: event.target.value }))}
                  required
                  maxLength={160}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/20 focus:border-[#1a7a3c]"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-gray-600">Statut</span>
                <select
                  value={editForm.status}
                  onChange={(event) => setEditForm((form) => ({ ...form, status: event.target.value as ListingStatus }))}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/20 focus:border-[#1a7a3c]"
                >
                  <option value="active">Active</option>
                  <option value="draft">Brouillon</option>
                  <option value="sold">Vendue</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs font-bold text-gray-600">Description</span>
                <textarea
                  value={editForm.description}
                  onChange={(event) => setEditForm((form) => ({ ...form, description: event.target.value }))}
                  rows={5}
                  maxLength={1000}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/20 focus:border-[#1a7a3c]"
                />
              </label>
            </div>

            <div
              className="mt-5 border-t border-gray-100 pt-5"
              onDragOver={(event) => {
                event.preventDefault();
                setEditPhotoDragOver(true);
              }}
              onDragLeave={() => setEditPhotoDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setEditPhotoDragOver(false);
                handleEditPhotoFiles(event.dataTransfer.files);
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900">Photos de l'annonce</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Jusqu'à {getMaxListingPhotos()} photos · JPG, PNG, WebP ou GIF · 5 Mo max.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    editPhotoInputRef.current?.click();
                  }}
                  onKeyDown={handleEditPhotoKeyDown}
                  disabled={editPhotos.length >= getMaxListingPhotos() || isUploadingEditPhotos}
                  aria-label="Choisir des photos depuis votre ordinateur"
                  className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-[#1a7a3c] text-white px-3 py-2 rounded-xl hover:bg-[#15632f] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/30"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Choisir des photos
                </button>
                <input
                  id={EDIT_PHOTO_INPUT_ID}
                  ref={editPhotoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="sr-only"
                  aria-label="Choisir des photos depuis votre ordinateur"
                  onChange={(event) => {
                    handleEditPhotoFiles(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
              </div>

              {photoError && (
                <div className="mb-3 bg-red-50 border border-red-100 text-red-700 rounded-xl px-3 py-2 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}

              {editPhotos.length === 0 ? (
                <div
                  className={`block border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                    editPhotoDragOver
                      ? "border-[#1a7a3c] bg-[#f0faf4]"
                      : "border-gray-200 hover:border-[#1a7a3c] hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Car className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Aucune photo pour cette annonce.</p>
                  <p className="text-xs text-gray-400 mt-2">Le site affichera le placeholder véhicule par défaut si vous n'ajoutez rien.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {editPhotos.map((photo, index) => (
                    <div key={photo.key} className="relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group">
                      <img
                        src={photo.url}
                        alt={photo.alt ?? `Photo ${index + 1}`}
                        className="w-full h-28 object-cover"
                      />
                      {photo.isPrimary && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-[#1a7a3c] text-white px-2 py-1 rounded-full shadow">
                          Principale
                        </span>
                      )}
                      <div className="absolute inset-x-2 bottom-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPrimaryEditPhoto(photo.key)}
                          disabled={photo.isPrimary || isUploadingEditPhotos}
                          className="flex-1 text-[10px] font-bold bg-white/90 text-gray-700 px-2 py-1.5 rounded-lg shadow-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          Principale
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEditPhoto(photo.key)}
                          disabled={isUploadingEditPhotos}
                          aria-label={`Supprimer la photo ${index + 1}`}
                          title="Supprimer la photo"
                          className="w-8 bg-white/90 text-red-500 rounded-lg shadow-sm flex items-center justify-center disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isUploadingEditPhotos || updateListingMutation.isPending}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isUploadingEditPhotos || updateListingMutation.isPending}
                className="flex-1 py-2.5 bg-[#1a7a3c] hover:bg-[#15632f] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
              >
                {isUploadingEditPhotos
                  ? "Upload des photos..."
                  : updateListingMutation.isPending
                    ? "Enregistrement..."
                    : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeletingId(null)}
            aria-label="Fermer la confirmation"
            disabled={deleteListingMutation.isPending}
          />
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
                disabled={deleteListingMutation.isPending}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => void handleDeleteListing()}
                disabled={deleteListingMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
              >
                {deleteListingMutation.isPending ? "Suppression..." : "Supprimer"}
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
  const primaryPhoto = listing.photos?.[0];

  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group cursor-pointer"
    >
      <div className={`h-36 bg-gradient-to-br ${listing.color} flex items-center justify-center relative overflow-hidden`}>
        {primaryPhoto ? (
          <img
            src={primaryPhoto.url}
            alt={primaryPhoto.alt ?? listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <svg viewBox="0 0 120 60" fill="none" className="w-4/5 h-4/5 opacity-75">
            <rect x="10" y="28" width="100" height="22" rx="5" fill="rgba(255,255,255,0.45)" />
            <path d="M18 28 Q38 10 60 10 Q85 10 104 28" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
            <circle cx="28" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
            <circle cx="92" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
            <circle cx="28" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
            <circle cx="92" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
          </svg>
        )}
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

function Stat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      {icon}
      <span className="font-bold text-gray-700">{value}</span>
      <span>{label}</span>
    </span>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3">
      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm text-gray-400 font-medium">{text}</p>
    </div>
  );
}

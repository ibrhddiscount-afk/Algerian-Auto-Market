import { useState, useMemo } from "react";
import { SlidersHorizontal, Search, X, ChevronDown, ChevronUp, LayoutGrid, List, ArrowUpDown, Heart, MessageCircle, MapPin, CheckCircle } from "lucide-react";
import {
  useListListings,
  type ListListingsParams,
  type Listing,
  type ListingFacets,
} from "@workspace/api-client-react";
import CarCard from "@/components/CarCard";
import { useLocation } from "wouter";

type SortKey = "recent" | "prix_asc" | "prix_desc" | "km_asc" | "annee_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent",     label: "Plus récents" },
  { value: "prix_asc",   label: "Prix croissant" },
  { value: "prix_desc",  label: "Prix décroissant" },
  { value: "km_asc",     label: "Kilométrage croissant" },
  { value: "annee_desc", label: "Année décroissante" },
];

const PRICE_RANGES = [
  { label: "Tous les prix",    min: 0,       max: Infinity },
  { label: "< 1 000 000 DZD", min: 0,       max: 999999 },
  { label: "1M – 2M DZD",     min: 1000000, max: 1999999 },
  { label: "2M – 4M DZD",     min: 2000000, max: 3999999 },
  { label: "4M – 7M DZD",     min: 4000000, max: 6999999 },
  { label: "> 7M DZD",        min: 7000000, max: Infinity },
];

const YEAR_RANGES = [
  { label: "Toutes les années", min: 0,    max: 9999 },
  { label: "2020 et plus",      min: 2020, max: 9999 },
  { label: "2017 – 2019",       min: 2017, max: 2019 },
  { label: "2014 – 2016",       min: 2014, max: 2016 },
  { label: "Avant 2014",        min: 0,    max: 2013 },
];

const KM_RANGES = [
  { label: "Tous kilométrages", min: 0,      max: Infinity },
  { label: "< 30 000 km",       min: 0,      max: 29999 },
  { label: "30 000 – 80 000",   min: 30000,  max: 79999 },
  { label: "80 000 – 130 000",  min: 80000,  max: 129999 },
  { label: "> 130 000 km",      min: 130000, max: Infinity },
];

const PAGE_SIZE = 9;

const DEFAULT_FACETS: ListingFacets = {
  marques: [],
  wilayas: [],
  fuels: ["Essence", "Diesel", "GPL", "Hybride", "Électrique"],
  transmissions: ["Manuelle", "Automatique"],
};

interface Filters {
  search: string;
  marque: string;
  wilaya: string;
  fuels: string[];
  transmissions: string[];
  priceRange: number;
  yearRange: number;
  kmRange: number;
  verifiedOnly: boolean;
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  marque: "",
  wilaya: "",
  fuels: [],
  transmissions: [],
  priceRange: 0,
  yearRange: 0,
  kmRange: 0,
  verifiedOnly: false,
};

function toggleArr(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-4">
      <button
        className="flex items-center justify-between w-full text-left mb-3"
        onClick={() => setOpen(!open)}
      >
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open && children}
    </div>
  );
}

export default function Listings() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const [gridView, setGridView] = useState<"grid" | "list">("grid");
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const listingParams = useMemo<ListListingsParams>(() => {
    const priceRange = PRICE_RANGES[filters.priceRange];
    const yearRange = YEAR_RANGES[filters.yearRange];
    const kmRange = KM_RANGES[filters.kmRange];

    return {
      search: filters.search || undefined,
      marque: filters.marque || undefined,
      wilaya: filters.wilaya || undefined,
      fuels: filters.fuels.length > 0 ? filters.fuels : undefined,
      transmissions:
        filters.transmissions.length > 0 ? filters.transmissions : undefined,
      priceMin: priceRange.min > 0 ? priceRange.min : undefined,
      priceMax: Number.isFinite(priceRange.max) ? priceRange.max : undefined,
      yearMin: yearRange.min > 0 ? yearRange.min : undefined,
      yearMax: yearRange.max < 9999 ? yearRange.max : undefined,
      kmMin: kmRange.min > 0 ? kmRange.min : undefined,
      kmMax: Number.isFinite(kmRange.max) ? kmRange.max : undefined,
      verifiedOnly: filters.verifiedOnly || undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    };
  }, [filters, sort, page]);

  const { data, isLoading, isError } = useListListings(listingParams);
  const facets = data?.facets ?? DEFAULT_FACETS;
  const paginated = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;

  const setFilter = <K extends keyof Filters>(key: K, val: Filters[K]) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const activeFilterCount =
    (filters.marque ? 1 : 0) +
    (filters.wilaya ? 1 : 0) +
    filters.fuels.length +
    filters.transmissions.length +
    (filters.priceRange > 0 ? 1 : 0) +
    (filters.yearRange > 0 ? 1 : 0) +
    (filters.kmRange > 0 ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0);

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  const SidebarContent = () => (
    <div className="space-y-0">
      {/* Search */}
      <div className="pb-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Marque, modèle…"
            value={filters.search}
            onChange={e => setFilter("search", e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/30 focus:border-[#1a7a3c]"
          />
          {filters.search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setFilter("search", "")}>
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Marque */}
      <FilterSection title="Marque">
        <select
          value={filters.marque}
          onChange={e => setFilter("marque", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/30 focus:border-[#1a7a3c]"
        >
          <option value="">Toutes les marques</option>
          {facets.marques.map(m => <option key={m}>{m}</option>)}
        </select>
      </FilterSection>

      {/* Wilaya */}
      <FilterSection title="Wilaya">
        <select
          value={filters.wilaya}
          onChange={e => setFilter("wilaya", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/30 focus:border-[#1a7a3c]"
        >
          <option value="">Toutes les wilayas</option>
          {facets.wilayas.map(w => <option key={w}>{w}</option>)}
        </select>
      </FilterSection>

      {/* Carburant */}
      <FilterSection title="Carburant">
        <div className="space-y-1.5">
          {facets.fuels.map(f => (
            <label key={f} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.fuels.includes(f)}
                onChange={() => setFilter("fuels", toggleArr(filters.fuels, f))}
                className="w-4 h-4 rounded border-gray-300 text-[#1a7a3c] focus:ring-[#1a7a3c] cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-[#1a7a3c]">{f}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Transmission */}
      <FilterSection title="Boîte de vitesses">
        <div className="space-y-1.5">
          {facets.transmissions.map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.transmissions.includes(t)}
                onChange={() => setFilter("transmissions", toggleArr(filters.transmissions, t))}
                className="w-4 h-4 rounded border-gray-300 text-[#1a7a3c] focus:ring-[#1a7a3c] cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-[#1a7a3c]">{t}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Prix */}
      <FilterSection title="Budget">
        <div className="space-y-1">
          {PRICE_RANGES.map((pr, i) => (
            <label key={pr.label} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="priceRange"
                checked={filters.priceRange === i}
                onChange={() => setFilter("priceRange", i)}
                className="w-4 h-4 text-[#1a7a3c] focus:ring-[#1a7a3c] cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-[#1a7a3c]">{pr.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Année */}
      <FilterSection title="Année" defaultOpen={false}>
        <div className="space-y-1">
          {YEAR_RANGES.map((yr, i) => (
            <label key={yr.label} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="yearRange"
                checked={filters.yearRange === i}
                onChange={() => setFilter("yearRange", i)}
                className="w-4 h-4 text-[#1a7a3c] focus:ring-[#1a7a3c] cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-[#1a7a3c]">{yr.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Kilométrage */}
      <FilterSection title="Kilométrage" defaultOpen={false}>
        <div className="space-y-1">
          {KM_RANGES.map((kr, i) => (
            <label key={kr.label} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="kmRange"
                checked={filters.kmRange === i}
                onChange={() => setFilter("kmRange", i)}
                className="w-4 h-4 text-[#1a7a3c] focus:ring-[#1a7a3c] cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-[#1a7a3c]">{kr.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Vérifié */}
      <div className="py-4">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={e => setFilter("verifiedOnly", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#1a7a3c] focus:ring-[#1a7a3c] cursor-pointer"
          />
          <span className="text-sm font-semibold text-gray-700 group-hover:text-[#1a7a3c]">Annonces vérifiées seulement</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <a href="/" className="hover:text-[#1a7a3c]">Accueil</a>
        <span>›</span>
        <span className="text-gray-600 font-medium">Toutes les annonces</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ─── DESKTOP SIDEBAR ─── */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-gray-900">Filtres</h2>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-xs text-[#1a7a3c] hover:underline font-medium">
                  Réinitialiser ({activeFilterCount})
                </button>
              )}
            </div>
            <SidebarContent />
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {/* Mobile filter button */}
              <button
                className="lg:hidden flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:border-[#1a7a3c] hover:text-[#1a7a3c] transition-colors"
                onClick={() => setMobileSidebar(true)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="bg-[#1a7a3c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                )}
              </button>

              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{total}</span> annonces trouvées
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={e => { setSort(e.target.value as SortKey); setPage(1); }}
                  className="appearance-none border border-gray-200 rounded-xl pl-8 pr-8 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/30 focus:border-[#1a7a3c] cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* View toggle */}
              <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  className={`p-2 transition-colors ${gridView === "grid" ? "bg-[#1a7a3c] text-white" : "text-gray-400 hover:text-gray-700"}`}
                  onClick={() => setGridView("grid")}
                  title="Vue grille"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  className={`p-2 transition-colors ${gridView === "list" ? "bg-[#1a7a3c] text-white" : "text-gray-400 hover:text-gray-700"}`}
                  onClick={() => setGridView("list")}
                  title="Vue liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.marque && (
                <Chip label={filters.marque} onRemove={() => setFilter("marque", "")} />
              )}
              {filters.wilaya && (
                <Chip label={filters.wilaya} onRemove={() => setFilter("wilaya", "")} />
              )}
              {filters.fuels.map(f => (
                <Chip key={f} label={f} onRemove={() => setFilter("fuels", toggleArr(filters.fuels, f))} />
              ))}
              {filters.transmissions.map(t => (
                <Chip key={t} label={t} onRemove={() => setFilter("transmissions", toggleArr(filters.transmissions, t))} />
              ))}
              {filters.priceRange > 0 && (
                <Chip label={PRICE_RANGES[filters.priceRange].label} onRemove={() => setFilter("priceRange", 0)} />
              )}
              {filters.yearRange > 0 && (
                <Chip label={YEAR_RANGES[filters.yearRange].label} onRemove={() => setFilter("yearRange", 0)} />
              )}
              {filters.kmRange > 0 && (
                <Chip label={KM_RANGES[filters.kmRange].label} onRemove={() => setFilter("kmRange", 0)} />
              )}
              {filters.verifiedOnly && (
                <Chip label="Vérifiées" onRemove={() => setFilter("verifiedOnly", false)} />
              )}
            </div>
          )}

          {/* Results grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: PAGE_SIZE }, (_, index) => (
                <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-5 bg-gray-100 rounded w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <X className="w-7 h-7 text-red-300" />
              </div>
              <h3 className="font-bold text-gray-700 text-lg mb-1">Impossible de charger les annonces</h3>
              <p className="text-sm text-gray-400">Vérifiez que l'API est démarrée puis réessayez.</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-700 text-lg mb-1">Aucun résultat</h3>
              <p className="text-sm text-gray-400 mb-4">Essayez d'élargir vos critères de recherche</p>
              <button onClick={resetFilters} className="text-sm font-semibold text-[#1a7a3c] hover:underline">
                Réinitialiser les filtres
              </button>
            </div>
          ) : gridView === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginated.map(l => <CarCard key={l.id} listing={l} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {paginated.map(l => <ListRow key={l.id} listing={l} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#1a7a3c] hover:text-[#1a7a3c] transition-colors bg-white"
              >
                ← Précédent
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-9 h-9 text-sm rounded-xl font-medium transition-colors ${
                      n === currentPage
                        ? "bg-[#1a7a3c] text-white shadow-sm"
                        : "border border-gray-200 text-gray-600 hover:border-[#1a7a3c] hover:text-[#1a7a3c] bg-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#1a7a3c] hover:text-[#1a7a3c] transition-colors bg-white"
              >
                Suivant →
              </button>
            </div>
          )}

          {/* Page info */}
          {totalPages > 1 && (
            <p className="text-center text-xs text-gray-400 mt-2">
              Page {currentPage} sur {totalPages} · {total} annonces
            </p>
          )}
        </div>
      </div>

      {/* ─── MOBILE SIDEBAR DRAWER ─── */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebar(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[90vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#1a7a3c]" />
                <h2 className="font-extrabold text-gray-900">Filtres</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-[#1a7a3c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                )}
              </div>
              <button onClick={() => setMobileSidebar(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SidebarContent />
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { resetFilters(); setMobileSidebar(false); }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600"
                >
                  Réinitialiser
                </button>
              )}
              <button
                onClick={() => setMobileSidebar(false)}
                className="flex-1 py-2.5 bg-[#1a7a3c] text-white rounded-xl text-sm font-bold"
              >
                Voir {total} annonces
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-[#f0faf4] text-[#1a7a3c] border border-[#1a7a3c]/20 text-xs font-semibold px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 ml-0.5 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function ListRow({ listing }: { listing: Listing }) {
  const [faved, setFaved] = useState(false);
  const [, navigate] = useLocation();

  return (
    <div
      onClick={() => navigate(`/annonces/${listing.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex group cursor-pointer"
    >
      <div className={`w-40 sm:w-52 shrink-0 bg-gradient-to-br ${listing.color} flex items-center justify-center`}>
        <svg viewBox="0 0 120 60" fill="none" className="w-4/5 h-4/5 opacity-70">
          <rect x="10" y="28" width="100" height="22" rx="5" fill="rgba(255,255,255,0.45)" />
          <path d="M18 28 Q38 10 60 10 Q85 10 104 28" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
          <circle cx="28" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
          <circle cx="92" cy="50" r="8" fill="rgba(0,0,0,0.45)" />
          <circle cx="28" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
          <circle cx="92" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
        </svg>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {listing.badge && (
                <span className="bg-[#1a7a3c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{listing.badge}</span>
              )}
              {listing.verified && (
                <span className="flex items-center gap-0.5 text-[#1a7a3c] text-[10px] font-semibold">
                  <CheckCircle className="w-3 h-3" /> Vérifié
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-base group-hover:text-[#1a7a3c] transition-colors truncate">{listing.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{listing.year} · {listing.km} · {listing.fuel} · {listing.transmission}</p>
            <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />{listing.location}
            </p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setFaved(!faved); }}>
            <Heart className={`w-4 h-4 ${faved ? "fill-red-500 text-red-500" : "text-gray-300"}`} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[#1a7a3c] font-extrabold text-lg">{listing.price} <span className="text-xs font-medium text-gray-400">DZD</span></span>
          <button onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 bg-[#25d366] hover:bg-[#1ebe5e] text-white text-xs font-bold px-3 py-2 rounded-lg">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

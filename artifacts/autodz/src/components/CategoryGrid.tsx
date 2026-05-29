import { Car } from "lucide-react";

const CATEGORIES = [
  {
    label: "Citadines",
    count: "2 532",
    icon: (
      <svg viewBox="0 0 48 30" fill="none" className="w-14 h-9">
        <rect x="4" y="12" width="40" height="14" rx="3" fill="#e5e7eb" />
        <path d="M8 12 Q16 4 24 4 Q32 4 40 12" stroke="#6b7280" strokeWidth="2" fill="#f3f4f6" />
        <circle cx="13" cy="26" r="4" fill="#374151" />
        <circle cx="35" cy="26" r="4" fill="#374151" />
        <circle cx="13" cy="26" r="2" fill="#9ca3af" />
        <circle cx="35" cy="26" r="2" fill="#9ca3af" />
      </svg>
    ),
  },
  {
    label: "SUV / 4x4",
    count: "1 842",
    icon: (
      <svg viewBox="0 0 52 32" fill="none" className="w-14 h-9">
        <rect x="2" y="10" width="48" height="17" rx="3" fill="#e5e7eb" />
        <path d="M6 10 Q14 2 26 2 Q38 2 46 10" stroke="#6b7280" strokeWidth="2" fill="#f3f4f6" />
        <rect x="2" y="20" width="48" height="7" rx="2" fill="#d1d5db" />
        <circle cx="14" cy="28" r="4" fill="#374151" />
        <circle cx="38" cy="28" r="4" fill="#374151" />
        <circle cx="14" cy="28" r="2" fill="#9ca3af" />
        <circle cx="38" cy="28" r="2" fill="#9ca3af" />
      </svg>
    ),
  },
  {
    label: "Berlines",
    count: "3 125",
    icon: (
      <svg viewBox="0 0 52 30" fill="none" className="w-14 h-9">
        <rect x="2" y="13" width="48" height="13" rx="3" fill="#e5e7eb" />
        <path d="M10 13 Q20 4 32 4 Q42 4 46 13" stroke="#6b7280" strokeWidth="2" fill="#f3f4f6" />
        <circle cx="14" cy="26" r="4" fill="#374151" />
        <circle cx="38" cy="26" r="4" fill="#374151" />
        <circle cx="14" cy="26" r="2" fill="#9ca3af" />
        <circle cx="38" cy="26" r="2" fill="#9ca3af" />
      </svg>
    ),
  },
  {
    label: "Utilitaires",
    count: "784",
    icon: (
      <svg viewBox="0 0 56 32" fill="none" className="w-14 h-9">
        <rect x="2" y="6" width="40" height="20" rx="3" fill="#e5e7eb" />
        <rect x="42" y="12" width="12" height="14" rx="2" fill="#d1d5db" />
        <rect x="2" y="6" width="40" height="8" rx="2" fill="#f3f4f6" />
        <circle cx="14" cy="28" r="4" fill="#374151" />
        <circle cx="36" cy="28" r="4" fill="#374151" />
        <circle cx="14" cy="28" r="2" fill="#9ca3af" />
        <circle cx="36" cy="28" r="2" fill="#9ca3af" />
      </svg>
    ),
  },
  {
    label: "Diesel",
    count: "2 114",
    icon: (
      <svg viewBox="0 0 52 30" fill="none" className="w-14 h-9">
        <rect x="2" y="14" width="48" height="12" rx="3" fill="#e5e7eb" />
        <path d="M8 14 Q18 5 28 5 Q40 5 48 14" stroke="#6b7280" strokeWidth="2" fill="#f3f4f6" />
        <circle cx="13" cy="26" r="4" fill="#374151" />
        <circle cx="39" cy="26" r="4" fill="#374151" />
        <circle cx="13" cy="26" r="2" fill="#9ca3af" />
        <circle cx="39" cy="26" r="2" fill="#9ca3af" />
        <text x="24" y="14" textAnchor="middle" fontSize="7" fill="#1a7a3c" fontWeight="bold">D</text>
      </svg>
    ),
  },
  {
    label: "Essence",
    count: "4 532",
    icon: (
      <svg viewBox="0 0 52 30" fill="none" className="w-14 h-9">
        <rect x="2" y="14" width="48" height="12" rx="3" fill="#e5e7eb" />
        <path d="M8 14 Q18 5 28 5 Q40 5 48 14" stroke="#6b7280" strokeWidth="2" fill="#f3f4f6" />
        <circle cx="13" cy="26" r="4" fill="#374151" />
        <circle cx="39" cy="26" r="4" fill="#374151" />
        <circle cx="13" cy="26" r="2" fill="#9ca3af" />
        <circle cx="39" cy="26" r="2" fill="#9ca3af" />
        <text x="24" y="14" textAnchor="middle" fontSize="7" fill="#f97316" fontWeight="bold">E</text>
      </svg>
    ),
  },
  {
    label: "Luxe",
    count: "532",
    icon: (
      <svg viewBox="0 0 56 30" fill="none" className="w-14 h-9">
        <rect x="2" y="13" width="52" height="13" rx="3" fill="#e5e7eb" />
        <path d="M8 13 Q20 3 34 3 Q46 3 52 13" stroke="#6b7280" strokeWidth="2" fill="#f3f4f6" />
        <circle cx="15" cy="26" r="4" fill="#374151" />
        <circle cx="42" cy="26" r="4" fill="#374151" />
        <circle cx="15" cy="26" r="2" fill="#d4af37" />
        <circle cx="42" cy="26" r="2" fill="#d4af37" />
        <path d="M28 8 L29.5 12 L34 12 L30.5 14.5 L32 18.5 L28 16 L24 18.5 L25.5 14.5 L22 12 L26.5 12 Z" fill="#d4af37" transform="translate(0,-4) scale(0.7) translate(12,4)" />
      </svg>
    ),
  },
];

export default function CategoryGrid() {
  return (
    <section className="bg-white border-b border-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800">Rechercher par type</h2>
          <a href="#" className="text-sm text-[#1a7a3c] font-medium hover:underline">Voir tout →</a>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {CATEGORIES.map(cat => (
            <a
              key={cat.label}
              href="#"
              className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-[#1a7a3c]/30 hover:bg-[#f0faf4] transition-all cursor-pointer"
            >
              <div className="group-hover:scale-105 transition-transform">
                {cat.icon}
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{cat.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{cat.count} annonces</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

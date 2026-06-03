import { Search } from "lucide-react";
import { useLocation } from "wouter";
import heroImage from "@assets/ChatGPT_Image_11_mai_2026,_03_32_24_1779320543345.png";

const MARQUES = ["Toutes les marques", "Renault", "Peugeot", "Volkswagen", "Hyundai", "Dacia", "Toyota", "BMW", "Mercedes"];
const MODELES = ["Tous les modèles", "Clio", "208", "Golf", "i20", "Logan", "Corolla", "Série 3"];
const PRIX = ["Prix max", "500 000 DZD", "1 000 000 DZD", "1 500 000 DZD", "2 000 000 DZD", "3 000 000 DZD", "5 000 000 DZD"];
const WILAYAS = ["Toutes les wilayas", "Alger", "Oran", "Constantine", "Annaba", "Blida", "Sétif", "Béjaïa", "Tizi Ouzou"];

export default function HeroSection() {
  const [, navigate] = useLocation();

  return (
    <section className="relative overflow-hidden bg-gray-900" style={{ minHeight: 380 }}>
      {/* Background image from attached reference — shows cityscape + car */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})`, backgroundPosition: "right center", backgroundSize: "cover" }}
      />
      {/* Strong left-to-right overlay so text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-gray-900/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
        <div className="max-w-xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3">
            Trouvez votre voiture<br />
            en{" "}
            <span className="text-[#4ade80] italic">Algérie</span>{" "}
            au meilleur prix
          </h1>
          <p className="text-gray-300 text-sm sm:text-base mb-8 leading-relaxed">
            Des milliers d'annonces de particuliers<br />
            et de professionnels près de chez vous.
          </p>

          {/* Search form */}
          <div className="bg-white rounded-2xl p-4 shadow-2xl max-w-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {[
                { label: "Marque", options: MARQUES },
                { label: "Modèle", options: MODELES },
                { label: "Prix max", options: PRIX },
                { label: "Wilaya", options: WILAYAS },
              ].map(({ label, options }) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">{label}</label>
                  <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a7a3c]/40 focus:border-[#1a7a3c] appearance-none cursor-pointer">
                    {options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/annonces")}
              className="w-full flex items-center justify-center gap-2 bg-[#1a7a3c] hover:bg-[#15632f] text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              Rechercher
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Shield, MessageCircle, Plus } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="space-y-4">
      {/* Verified listings */}
      <div className="bg-[#1a7a3c] rounded-2xl p-5 text-white">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">Annonces vérifiées</h3>
            <p className="text-green-100 text-xs mt-1 leading-snug">
              Plus de sécurité pour acheter en toute confiance
            </p>
          </div>
        </div>
        <span
          aria-disabled="true"
          className="inline-block text-xs font-bold border border-white/30 text-white/80 px-4 py-2 rounded-lg cursor-not-allowed"
        >
          En savoir plus · Bientôt
        </span>
      </div>

      {/* Direct contact */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#f0faf4] rounded-xl flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-[#1a7a3c]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">
              Contact direct<br />avec le vendeur
            </h3>
            <p className="text-gray-500 text-xs mt-1 leading-snug">
              Par WhatsApp ou téléphone en un clic !
            </p>
          </div>
        </div>
      </div>

      {/* Post ad */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-[#f0faf4] rounded-xl flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-[#1a7a3c]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">
              Déposez votre annonce gratuitement
            </h3>
            <p className="text-gray-500 text-xs mt-1 leading-snug">
              Rapide, simple et efficace
            </p>
          </div>
        </div>
        <a
          href="/deposer-annonce"
          className="flex items-center justify-center gap-2 w-full bg-[#1a7a3c] hover:bg-[#15632f] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Déposer une annonce
        </a>
      </div>
    </div>
  );
}

import { Car } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-[#1a7a3c] rounded-lg">
                <Car className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-base">AutoDZ</div>
                <div className="text-[10px] text-gray-400">Le marché auto en Algérie</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              La plateforme n°1 pour acheter et vendre des véhicules en Algérie.
            </p>
          </div>

          {[
            { title: "Acheteurs", links: ["Voitures neuves", "Voitures d'occasion", "Utilitaires", "Motos", "Recherche avancée"] },
            { title: "Vendeurs", links: ["Déposer une annonce", "Concessionnaires", "Conseils de vente", "Tarifs"] },
            { title: "AutoDZ", links: ["À propos", "Blog", "Contact", "Mentions légales", "CGU"] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="font-bold text-gray-900 text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-xs text-gray-500 hover:text-[#1a7a3c] transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">© 2026 AutoDZ. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            {["Facebook", "Instagram", "Twitter", "LinkedIn"].map(s => (
              <a key={s} href="#" className="text-xs text-gray-400 hover:text-[#1a7a3c] transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

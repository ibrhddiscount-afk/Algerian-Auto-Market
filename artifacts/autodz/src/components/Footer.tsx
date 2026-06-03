import { Car } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Acheteurs",
    links: [
      { label: "Voitures neuves", href: "/annonces" },
      { label: "Voitures d'occasion", href: "/annonces" },
      { label: "Utilitaires", href: "/annonces" },
      { label: "Motos" },
      { label: "Recherche avancée", href: "/annonces" },
    ],
  },
  {
    title: "Vendeurs",
    links: [
      { label: "Déposer une annonce", href: "/deposer-annonce" },
      { label: "Concessionnaires" },
      { label: "Conseils de vente" },
      { label: "Tarifs" },
    ],
  },
  {
    title: "AutoDZ",
    links: [
      { label: "À propos" },
      { label: "Blog" },
      { label: "Contact" },
      { label: "Mentions légales" },
      { label: "CGU" },
    ],
  },
];

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

          {FOOTER_COLUMNS.map(col => (
            <div key={col.title}>
              <h4 className="font-bold text-gray-900 text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    {link.href ? (
                      <a href={link.href} className="text-xs text-gray-500 hover:text-[#1a7a3c] transition-colors">{link.label}</a>
                    ) : (
                      <span aria-disabled="true" className="text-xs text-gray-400 cursor-not-allowed">
                        {link.label} <span className="text-[10px] uppercase tracking-wide">Bientôt</span>
                      </span>
                    )}
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
              <span key={s} aria-disabled="true" className="text-xs text-gray-400 cursor-not-allowed">
                {s} <span className="text-[10px]">Bientôt</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

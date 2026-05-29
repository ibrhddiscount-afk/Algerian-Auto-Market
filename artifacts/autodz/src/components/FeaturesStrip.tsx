import { MessageCircle, Car, Shield, MapPin } from "lucide-react";

const FEATURES = [
  {
    icon: <Car className="w-7 h-7 text-[#1a7a3c]" />,
    title: "100% Gratuit",
    desc: "Déposez vos annonces gratuitement",
  },
  {
    icon: <MessageCircle className="w-7 h-7 text-[#1a7a3c]" />,
    title: "Contact direct",
    desc: "WhatsApp, téléphone, email…",
  },
  {
    icon: <Car className="w-7 h-7 text-[#1a7a3c]" />,
    title: "Large choix",
    desc: "Des milliers de voitures disponibles",
  },
  {
    icon: <MapPin className="w-7 h-7 text-[#1a7a3c]" />,
    title: "Partout en Algérie",
    desc: "Toutes les wilayas couvertes",
  },
];

export default function FeaturesStrip() {
  return (
    <section className="bg-white border-t border-b border-gray-100 py-8 my-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{f.icon}</div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

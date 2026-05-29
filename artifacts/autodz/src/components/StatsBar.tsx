import { Car, Users, TrendingUp, Shield } from "lucide-react";

const STATS = [
  { icon: <Car className="w-6 h-6 text-[#4ade80]" />, value: "12 458", label: "Voitures disponibles" },
  { icon: <Users className="w-6 h-6 text-[#4ade80]" />, value: "8 932", label: "Utilisateurs actifs" },
  { icon: <TrendingUp className="w-6 h-6 text-[#4ade80]" />, value: "1 245", label: "Nouvelles annonces / semaine" },
  { icon: <Shield className="w-6 h-6 text-[#4ade80]" />, value: "98%", label: "Annonces vérifiées" },
];

export default function StatsBar() {
  return (
    <section className="bg-gray-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map(stat => (
            <div key={stat.label} className="flex items-center gap-4">
              <div className="shrink-0">{stat.icon}</div>
              <div>
                <p className="text-white font-extrabold text-2xl leading-tight">{stat.value}</p>
                <p className="text-gray-400 text-xs mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

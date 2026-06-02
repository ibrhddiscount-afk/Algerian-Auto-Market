export interface ListingDetail {
  id: number;
  description: string;
  sellerName: string;
  sellerType: "Particulier" | "Concessionnaire";
  sellerMember: string;
  sellerPhone: string;
  sellerWhatsapp: string;
  sellerRating: number;
  sellerTotalAds: number;
  options: string[];
  couleur: string;
  portes: number;
  places: number;
  puissance: number;
  cylindree: string;
  etat: "Excellent" | "Très bon" | "Bon" | "Passable";
  firstHand: boolean;
  dedouane: boolean;
  views: number;
  postedDaysAgo: number;
}

export const LISTING_DETAILS: Record<number, ListingDetail> = {
  1: {
    id: 1, description: "Volkswagen Golf 7 en excellent état, première main. Entretien régulier chez le concessionnaire avec tous les carnets à jour. Voiture très propre, non accidentée, pas de rouille. Pneus neufs (moins de 5 000 km). Disponible pour essai.", sellerName: "Karim B.", sellerType: "Particulier", sellerMember: "depuis 2021", sellerPhone: "0555 12 34 56", sellerWhatsapp: "0555123456", sellerRating: 4.8, sellerTotalAds: 3, options: ["Climatisation automatique", "GPS / Navigation", "Radar de recul", "Caméra de recul", "Régulateur de vitesse", "Toit ouvrant", "Sièges chauffants", "Bluetooth / AUX"], couleur: "Gris métallisé", portes: 5, places: 5, puissance: 115, cylindree: "1.6 TDI", etat: "Excellent", firstHand: true, dedouane: true, views: 1243, postedDaysAgo: 3,
  },
  2: {
    id: 2, description: "Renault Clio 4 diesel en très bon état général. Deuxième main, carnet d'entretien complet. Consommation faible, idéale pour la ville et les longs trajets. Pas de fumée, pas de bruit suspect. Révision récente effectuée.", sellerName: "Ahmed T.", sellerType: "Particulier", sellerMember: "depuis 2019", sellerPhone: "0661 98 76 54", sellerWhatsapp: "0661987654", sellerRating: 4.5, sellerTotalAds: 7, options: ["Climatisation", "Bluetooth", "Vitres électriques", "Direction assistée", "ABS", "Airbags"], couleur: "Blanc perle", portes: 5, places: 5, puissance: 90, cylindree: "1.5 dCi", etat: "Très bon", firstHand: false, dedouane: true, views: 876, postedDaysAgo: 8,
  },
  3: {
    id: 3, description: "Hyundai i20 essence, véhicule particulièrement entretenu. Première mise en circulation en 2019. Kilométrage certifié. Intérieur impeccable, carrosserie sans défaut. Idéale pour une famille cherchant une citadine fiable.", sellerName: "Samira L.", sellerType: "Particulier", sellerMember: "depuis 2020", sellerPhone: "0770 45 23 11", sellerWhatsapp: "0770452311", sellerRating: 4.2, sellerTotalAds: 1, options: ["Climatisation", "Direction assistée électrique", "ESP", "Bluetooth", "USB", "Régulateur de vitesse"], couleur: "Bleu marine", portes: 5, places: 5, puissance: 84, cylindree: "1.2 MPI", etat: "Très bon", firstHand: true, dedouane: true, views: 512, postedDaysAgo: 12,
  },
  4: {
    id: 4, description: "Peugeot 208 diesel en bon état. Légère égratignure sur le pare-choc arrière (visible sur les photos). Moteur impeccable, boîte de vitesses fluide. Consommation de 4,5L/100km en moyenne. Idéale pour les longs trajets.", sellerName: "Mohamed D.", sellerType: "Particulier", sellerMember: "depuis 2018", sellerPhone: "0550 77 88 99", sellerWhatsapp: "0550778899", sellerRating: 4.0, sellerTotalAds: 5, options: ["Climatisation", "Bluetooth", "Vitres électriques", "Jantes alliage", "ABS", "ESP"], couleur: "Gris anthracite", portes: 5, places: 5, puissance: 75, cylindree: "1.4 HDi", etat: "Bon", firstHand: false, dedouane: true, views: 698, postedDaysAgo: 5,
  },
  5: {
    id: 5, description: "Dacia Logan GPL bon état, parfaite pour la ville avec un coût d'utilisation très bas. Révision récente. Système GPL d'origine, sécurisé et certifié. Carrosserie présentable, intérieur propre.", sellerName: "Rachid M.", sellerType: "Particulier", sellerMember: "depuis 2017", sellerPhone: "0666 33 22 11", sellerWhatsapp: "0666332211", sellerRating: 3.9, sellerTotalAds: 4, options: ["Climatisation", "Direction assistée", "ABS", "Vitres électriques"], couleur: "Gris clair", portes: 4, places: 5, puissance: 75, cylindree: "1.4 MPI", etat: "Bon", firstHand: false, dedouane: true, views: 334, postedDaysAgo: 21,
  },
};

export function getDetail(id: number): ListingDetail {
  if (LISTING_DETAILS[id]) return LISTING_DETAILS[id];
  const seed = id % 5;
  const base = LISTING_DETAILS[(seed === 0 ? 5 : seed)];
  return {
    ...base,
    id,
    sellerName: ["Youcef A.", "Nassim B.", "Fatima K.", "Omar S.", "Lyes T.", "Amina H.", "Bilal R.", "Djamel N."][id % 8],
    sellerType: id % 3 === 0 ? "Concessionnaire" : "Particulier",
    sellerMember: `depuis ${2017 + (id % 6)}`,
    sellerPhone: `0${5 + (id % 4)}${String(id * 13 + 10).padStart(2, "0")} ${String(id * 7 + 20).padStart(2, "0")} ${String(id * 11 + 30).padStart(2, "0")} ${String(id * 3 + 40).padStart(2, "0")}`,
    sellerWhatsapp: `0${5 + (id % 4)}${String(id * 1000000).slice(0, 8)}`,
    sellerRating: parseFloat((3.8 + (id % 12) * 0.1).toFixed(1)),
    sellerTotalAds: 1 + (id % 9),
    views: 200 + id * 47,
    postedDaysAgo: 1 + (id % 25),
    etat: (["Excellent", "Très bon", "Bon", "Très bon", "Excellent"] as const)[id % 5],
    firstHand: id % 3 !== 2,
    dedouane: true,
  };
}

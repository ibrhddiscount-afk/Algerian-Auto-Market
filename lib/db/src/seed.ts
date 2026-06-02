import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inArray } from "drizzle-orm";

function loadRootEnv() {
  if (process.env.DATABASE_URL) return;

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(currentDir, "../../..", ".env");

  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

loadRootEnv();

const { db, pool } = await import("./index");
const {
  favoritesTable,
  listingPhotosTable,
  listingsTable,
  usersTable,
} = await import("./schema");

const seedEmails = [
  "karim.benali.seed@autodz.dz",
  "nadia.mansouri.seed@autodz.dz",
  "garage.elbahdja.seed@autodz.dz",
  "samir.khelifi.seed@autodz.dz",
];

const now = new Date();
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

async function main() {
  await db.delete(usersTable).where(inArray(usersTable.email, seedEmails));

  const users = await db
    .insert(usersTable)
    .values([
      {
        name: "Karim Benali",
        email: seedEmails[0],
        phone: "0555 12 34 56",
        whatsapp: "0555123456",
        wilaya: "Alger",
        sellerType: "particulier",
        rating: "4.8",
        reviewCount: 18,
        verified: true,
        totalSales: 4,
        createdAt: daysAgo(860),
        updatedAt: now,
      },
      {
        name: "Nadia Mansouri",
        email: seedEmails[1],
        phone: "0661 22 45 90",
        whatsapp: "0661224590",
        wilaya: "Oran",
        sellerType: "particulier",
        rating: "4.6",
        reviewCount: 9,
        verified: true,
        totalSales: 2,
        createdAt: daysAgo(520),
        updatedAt: now,
      },
      {
        name: "Garage El Bahdja",
        email: seedEmails[2],
        phone: "023 80 44 21",
        whatsapp: "0550987654",
        wilaya: "Alger",
        sellerType: "concessionnaire",
        rating: "4.9",
        reviewCount: 64,
        verified: true,
        totalSales: 51,
        createdAt: daysAgo(1450),
        updatedAt: now,
      },
      {
        name: "Samir Khelifi",
        email: seedEmails[3],
        phone: "0770 33 88 11",
        whatsapp: "0770338811",
        wilaya: "Sétif",
        sellerType: "particulier",
        rating: "4.2",
        reviewCount: 5,
        verified: false,
        totalSales: 1,
        createdAt: daysAgo(270),
        updatedAt: now,
      },
    ])
    .returning();

  const [karim, nadia, garage, samir] = users;

  const listings = await db
    .insert(listingsTable)
    .values([
      {
        sellerId: karim.id,
        title: "Volkswagen Golf 7 Confortline",
        marque: "Volkswagen",
        modele: "Golf",
        year: 2018,
        kmRaw: 118000,
        fuel: "Diesel",
        transmission: "Manuelle",
        location: "Hydra",
        wilaya: "Alger",
        priceRaw: 2450000,
        color: "from-gray-200 to-gray-500",
        verified: true,
        badge: "Vérifiée",
        description:
          "Golf 7 très propre, entretien suivi, pneus récents et carnet disponible. Aucun frais immédiat à prévoir.",
        couleur: "Gris métallisé",
        portes: 5,
        places: 5,
        puissance: 110,
        cylindree: "1.6 TDI",
        condition: "Très bon",
        firstHand: false,
        dedouane: true,
        views: 1284,
        createdAt: daysAgo(3),
        updatedAt: now,
      },
      {
        sellerId: nadia.id,
        title: "Renault Clio 4 GT Line",
        marque: "Renault",
        modele: "Clio",
        year: 2019,
        kmRaw: 72000,
        fuel: "Essence",
        transmission: "Manuelle",
        location: "Akid Lotfi",
        wilaya: "Oran",
        priceRaw: 2080000,
        color: "from-red-100 to-red-300",
        verified: true,
        badge: "Récent",
        description:
          "Clio 4 essence en excellent état, faible consommation, intérieur soigné et historique clair.",
        couleur: "Rouge",
        portes: 5,
        places: 5,
        puissance: 90,
        cylindree: "1.2 16V",
        condition: "Excellent",
        firstHand: true,
        dedouane: true,
        views: 742,
        createdAt: daysAgo(6),
        updatedAt: now,
      },
      {
        sellerId: garage.id,
        title: "Toyota Corolla Hybride Dynamic",
        marque: "Toyota",
        modele: "Corolla",
        year: 2021,
        kmRaw: 39000,
        fuel: "Hybride",
        transmission: "Automatique",
        location: "Dely Ibrahim",
        wilaya: "Alger",
        priceRaw: 5450000,
        color: "from-blue-100 to-blue-300",
        verified: true,
        badge: "Hybride",
        description:
          "Corolla hybride importée, garantie garage 3 mois, diagnostic complet disponible sur place.",
        couleur: "Bleu nuit",
        portes: 5,
        places: 5,
        puissance: 122,
        cylindree: "1.8 Hybrid",
        condition: "Excellent",
        firstHand: false,
        dedouane: true,
        views: 2110,
        createdAt: daysAgo(1),
        updatedAt: now,
      },
      {
        sellerId: garage.id,
        title: "Hyundai Tucson 2.0 CRDi",
        marque: "Hyundai",
        modele: "Tucson",
        year: 2020,
        kmRaw: 64000,
        fuel: "Diesel",
        transmission: "Automatique",
        location: "Cheraga",
        wilaya: "Alger",
        priceRaw: 4980000,
        color: "from-slate-200 to-slate-500",
        verified: true,
        badge: "SUV",
        description:
          "SUV familial, boîte automatique, caméra de recul, radar, climatisation bi-zone et contrôle technique récent.",
        couleur: "Noir",
        portes: 5,
        places: 5,
        puissance: 136,
        cylindree: "2.0 CRDi",
        condition: "Très bon",
        firstHand: false,
        dedouane: true,
        views: 1688,
        createdAt: daysAgo(8),
        updatedAt: now,
      },
      {
        sellerId: samir.id,
        title: "Dacia Logan GPL Lauréate",
        marque: "Dacia",
        modele: "Logan",
        year: 2016,
        kmRaw: 155000,
        fuel: "GPL",
        transmission: "Manuelle",
        location: "El Eulma",
        wilaya: "Sétif",
        priceRaw: 1120000,
        color: "from-amber-100 to-amber-300",
        verified: false,
        description:
          "Logan GPL économique, moteur fiable, carrosserie propre avec quelques traces d'usage normales.",
        couleur: "Blanc",
        portes: 4,
        places: 5,
        puissance: 75,
        cylindree: "1.4 MPI",
        condition: "Bon",
        firstHand: false,
        dedouane: true,
        views: 354,
        createdAt: daysAgo(14),
        updatedAt: now,
      },
      {
        sellerId: garage.id,
        title: "Peugeot 3008 Allure",
        marque: "Peugeot",
        modele: "3008",
        year: 2019,
        kmRaw: 81000,
        fuel: "Diesel",
        transmission: "Automatique",
        location: "Bir Mourad Raïs",
        wilaya: "Alger",
        priceRaw: 5750000,
        color: "from-violet-100 to-violet-300",
        verified: true,
        badge: "Premium",
        description:
          "3008 Allure avec toit panoramique, i-Cockpit, GPS, sièges semi-cuir et historique d'entretien.",
        couleur: "Gris Artense",
        portes: 5,
        places: 5,
        puissance: 130,
        cylindree: "1.5 BlueHDi",
        condition: "Très bon",
        firstHand: false,
        dedouane: true,
        views: 1942,
        createdAt: daysAgo(4),
        updatedAt: now,
      },
    ])
    .returning();

  await db.insert(listingPhotosTable).values(
    listings.flatMap((listing, listingIndex) =>
      [0, 1, 2].map((position) => ({
        listingId: listing.id,
        url: `https://images.unsplash.com/photo-${[
          "1549924231-f129b911e442",
          "1503376780353-7e6692767b70",
          "1492144534655-ae79c964c9d7",
          "1533473359331-0135ef1b58bf",
          "1511919884226-fd3cad34687c",
          "1542362567-b07e54358753",
        ][listingIndex]}?auto=format&fit=crop&w=${position === 0 ? 1200 : 900}&q=80`,
        alt: `${listing.title} photo ${position + 1}`,
        position,
        isPrimary: position === 0,
        createdAt: daysAgo(Math.max(1, listingIndex + position)),
      })),
    ),
  );

  await db.insert(favoritesTable).values([
    { userId: karim.id, listingId: listings[2].id, createdAt: daysAgo(1) },
    { userId: karim.id, listingId: listings[5].id, createdAt: daysAgo(2) },
    { userId: nadia.id, listingId: listings[0].id, createdAt: daysAgo(4) },
    { userId: samir.id, listingId: listings[1].id, createdAt: daysAgo(5) },
    { userId: samir.id, listingId: listings[3].id, createdAt: daysAgo(7) },
  ]);

  console.log(
    `Seeded ${users.length} users, ${listings.length} listings, ${listings.length * 3} photos and 5 favorites.`,
  );
}

try {
  await main();
} finally {
  await pool.end();
}

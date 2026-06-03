import { and, asc, count, desc, eq, gte, ilike, inArray, lte, ne, or, type SQL } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateListingRequest,
  CreateListingResponse,
  FavoriteMutationRequest,
  FavoriteStateResponse,
  FavoriteUserParamsSchema,
  ListListingsResponse,
  ListFavoritesResponse,
  ListingDetailResponse,
  ListingsQuerySchema,
} from "@workspace/api-zod";
import {
  db,
  favoritesTable,
  listingPhotosTable,
  listingsTable,
  usersTable,
} from "@workspace/db";

const router: IRouter = Router();
const TEST_USER_EMAIL = "test.user@autodz.local";

type ListingRow = Awaited<ReturnType<typeof selectListings>>[number];

const LISTING_FUELS = [
  "Essence",
  "Diesel",
  "GPL",
  "Électrique",
  "Hybride",
] as const;

const LISTING_TRANSMISSIONS = ["Manuelle", "Automatique"] as const;

function splitQueryList<T extends string>(
  value: string | undefined,
  allowedValues: readonly T[],
): T[] {
  const allowed = new Set<string>(allowedValues);
  return value?.split(",").filter((item): item is T => allowed.has(item)) ?? [];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-DZ").format(value);
}

function formatKm(value: number): string {
  return `${formatNumber(value)} km`;
}

function sellerTypeLabel(value: "particulier" | "concessionnaire") {
  return value === "concessionnaire" ? "Concessionnaire" : "Particulier";
}

function sellerMemberLabel(createdAt: Date) {
  return `depuis ${createdAt.getFullYear()}`;
}

function daysAgo(createdAt: Date) {
  const elapsed = Date.now() - createdAt.getTime();
  return Math.max(0, Math.floor(elapsed / 86400000));
}

function isZodValidationError(error: unknown): error is { issues: unknown[] } {
  return typeof error === "object" && error !== null && "issues" in error;
}

async function resolveFavoriteUserId(userId?: number) {
  if (userId) return userId;

  const [existingUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, TEST_USER_EMAIL))
    .limit(1);

  if (existingUser) return existingUser.id;

  const [testUser] = await db
    .insert(usersTable)
    .values({
      name: "Utilisateur Test",
      email: TEST_USER_EMAIL,
      phone: "0550 00 00 00",
      whatsapp: "0550000000",
      wilaya: "Alger",
      sellerType: "particulier",
    })
    .returning({ id: usersTable.id });

  return testUser.id;
}

async function ensureListingExists(listingId: number) {
  const [listing] = await db
    .select({ id: listingsTable.id })
    .from(listingsTable)
    .where(eq(listingsTable.id, listingId))
    .limit(1);

  return Boolean(listing);
}

function parseListingId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function buildListingWhere(query: ReturnType<typeof ListingsQuerySchema.parse>) {
  const conditions: SQL[] = [];
  const fuels = splitQueryList(query.fuels, LISTING_FUELS);
  const transmissions = splitQueryList(
    query.transmissions,
    LISTING_TRANSMISSIONS,
  );

  if (query.search) {
    const search = `%${query.search}%`;
    conditions.push(
      or(
        ilike(listingsTable.title, search),
        ilike(listingsTable.marque, search),
        ilike(listingsTable.modele, search),
        ilike(listingsTable.location, search),
      )!,
    );
  }

  if (query.marque) conditions.push(eq(listingsTable.marque, query.marque));
  if (query.wilaya) conditions.push(eq(listingsTable.wilaya, query.wilaya));
  if (fuels.length > 0) conditions.push(inArray(listingsTable.fuel, fuels));
  if (transmissions.length > 0) {
    conditions.push(inArray(listingsTable.transmission, transmissions));
  }
  if (query.verifiedOnly) conditions.push(eq(listingsTable.verified, true));
  if (query.priceMin !== undefined) {
    conditions.push(gte(listingsTable.priceRaw, query.priceMin));
  }
  if (query.priceMax !== undefined) {
    conditions.push(lte(listingsTable.priceRaw, query.priceMax));
  }
  if (query.yearMin !== undefined) {
    conditions.push(gte(listingsTable.year, query.yearMin));
  }
  if (query.yearMax !== undefined) {
    conditions.push(lte(listingsTable.year, query.yearMax));
  }
  if (query.kmMin !== undefined) {
    conditions.push(gte(listingsTable.kmRaw, query.kmMin));
  }
  if (query.kmMax !== undefined) {
    conditions.push(lte(listingsTable.kmRaw, query.kmMax));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function orderBy(sort = "recent") {
  switch (sort) {
    case "prix_asc":
      return [asc(listingsTable.priceRaw), desc(listingsTable.id)];
    case "prix_desc":
      return [desc(listingsTable.priceRaw), desc(listingsTable.id)];
    case "km_asc":
      return [asc(listingsTable.kmRaw), desc(listingsTable.id)];
    case "annee_desc":
      return [desc(listingsTable.year), desc(listingsTable.id)];
    default:
      return [desc(listingsTable.createdAt), desc(listingsTable.id)];
  }
}

function selectListings() {
  return db
    .select({
      id: listingsTable.id,
      title: listingsTable.title,
      marque: listingsTable.marque,
      modele: listingsTable.modele,
      year: listingsTable.year,
      kmRaw: listingsTable.kmRaw,
      fuel: listingsTable.fuel,
      transmission: listingsTable.transmission,
      location: listingsTable.location,
      wilaya: listingsTable.wilaya,
      priceRaw: listingsTable.priceRaw,
      color: listingsTable.color,
      verified: listingsTable.verified,
      badge: listingsTable.badge,
      description: listingsTable.description,
      couleur: listingsTable.couleur,
      portes: listingsTable.portes,
      places: listingsTable.places,
      puissance: listingsTable.puissance,
      cylindree: listingsTable.cylindree,
      condition: listingsTable.condition,
      firstHand: listingsTable.firstHand,
      dedouane: listingsTable.dedouane,
      views: listingsTable.views,
      createdAt: listingsTable.createdAt,
      sellerId: usersTable.id,
      sellerName: usersTable.name,
      sellerType: usersTable.sellerType,
      sellerMemberSince: usersTable.createdAt,
      sellerPhone: usersTable.phone,
      sellerWhatsapp: usersTable.whatsapp,
      sellerRating: usersTable.rating,
    })
    .from(listingsTable)
    .innerJoin(usersTable, eq(listingsTable.sellerId, usersTable.id));
}

function toApiListing(row: ListingRow) {
  return {
    id: row.id,
    title: row.title,
    marque: row.marque,
    modele: row.modele,
    year: row.year,
    kmRaw: row.kmRaw,
    km: formatKm(row.kmRaw),
    fuel: row.fuel,
    transmission: row.transmission,
    location: row.location,
    wilaya: row.wilaya,
    priceRaw: row.priceRaw,
    price: formatNumber(row.priceRaw),
    color: row.color,
    verified: row.verified,
    ...(row.badge ? { badge: row.badge } : {}),
  };
}

function toApiDetail(row: ListingRow, sellerTotalAds: number) {
  return {
    id: row.id,
    description: row.description,
    sellerName: row.sellerName,
    sellerType: sellerTypeLabel(row.sellerType),
    sellerMember: sellerMemberLabel(row.sellerMemberSince),
    sellerPhone: row.sellerPhone,
    sellerWhatsapp: row.sellerWhatsapp ?? row.sellerPhone,
    sellerRating: Number(row.sellerRating),
    sellerTotalAds,
    options: [],
    couleur: row.couleur,
    portes: row.portes,
    places: row.places,
    puissance: row.puissance,
    cylindree: row.cylindree,
    etat: row.condition,
    firstHand: row.firstHand,
    dedouane: row.dedouane,
    views: row.views,
    postedDaysAgo: daysAgo(row.createdAt),
  };
}

async function getFacets() {
  const [marques, wilayas, fuels, transmissions] = await Promise.all([
    db
      .selectDistinct({ value: listingsTable.marque })
      .from(listingsTable)
      .orderBy(asc(listingsTable.marque)),
    db
      .selectDistinct({ value: listingsTable.wilaya })
      .from(listingsTable)
      .orderBy(asc(listingsTable.wilaya)),
    db
      .selectDistinct({ value: listingsTable.fuel })
      .from(listingsTable)
      .orderBy(asc(listingsTable.fuel)),
    db
      .selectDistinct({ value: listingsTable.transmission })
      .from(listingsTable)
      .orderBy(asc(listingsTable.transmission)),
  ]);

  return {
    marques: marques.map((item) => item.value),
    wilayas: wilayas.map((item) => item.value),
    fuels: fuels.map((item) => item.value),
    transmissions: transmissions.map((item) => item.value),
  };
}

router.get("/listings", async (req, res) => {
  const query = ListingsQuerySchema.parse(req.query);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 9;
  const where = buildListingWhere(query);
  const [{ total }] = await db
    .select({ total: count() })
    .from(listingsTable)
    .where(where);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = await selectListings()
    .where(where)
    .orderBy(...orderBy(query.sort))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  const data = ListListingsResponse.parse({
    items: rows.map(toApiListing),
    total,
    page: safePage,
    pageSize,
    totalPages,
    facets: await getFacets(),
  });

  res.json(data);
});

router.get("/favorites", async (req, res) => {
  const query = FavoriteUserParamsSchema.parse(req.query);
  const userId = await resolveFavoriteUserId(query.userId);

  const favoriteRows = await db
    .select({ listingId: favoritesTable.listingId })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId))
    .orderBy(desc(favoritesTable.createdAt));

  const listingIds = favoriteRows.map((favorite) => favorite.listingId);
  const rows = listingIds.length
    ? await selectListings().where(inArray(listingsTable.id, listingIds))
    : [];
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const orderedRows = listingIds
    .map((listingId) => rowsById.get(listingId))
    .filter((row): row is ListingRow => Boolean(row));

  const data = ListFavoritesResponse.parse({
    userId,
    listingIds,
    items: orderedRows.map(toApiListing),
  });

  res.json(data);
});

router.post("/listings", async (req, res) => {
  const parsed = CreateListingRequest.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Données invalides pour créer l'annonce",
      issues: parsed.error.issues,
    });
    return;
  }

  const body = parsed.data;
  const title = `${body.marque} ${body.modele}`.trim();

  const createdListing = await db.transaction(async (tx) => {
    const userWhere = body.seller.email
      ? or(
          eq(usersTable.email, body.seller.email),
          eq(usersTable.phone, body.seller.phone),
        )!
      : eq(usersTable.phone, body.seller.phone);

    const [existingUser] = await tx
      .select()
      .from(usersTable)
      .where(userWhere)
      .limit(1);

    const userValues = {
      name: body.seller.name,
      email: body.seller.email ?? null,
      phone: body.seller.phone,
      whatsapp: body.seller.whatsapp ?? body.seller.phone,
      wilaya: body.seller.wilaya,
      sellerType: body.seller.sellerType,
      updatedAt: new Date(),
    };

    const [seller] = existingUser
      ? await tx
          .update(usersTable)
          .set(userValues)
          .where(eq(usersTable.id, existingUser.id))
          .returning()
      : await tx.insert(usersTable).values(userValues).returning();

    const [listing] = await tx
      .insert(listingsTable)
      .values({
        sellerId: seller.id,
        title,
        marque: body.marque,
        modele: body.modele,
        year: body.year,
        kmRaw: body.kmRaw,
        fuel: body.fuel,
        transmission: body.transmission,
        location: body.location,
        wilaya: body.wilaya,
        priceRaw: body.priceRaw,
        color: body.color ?? "from-gray-200 to-gray-400",
        description: body.description ?? "",
        couleur: body.couleur ?? "Non précisée",
        portes: body.portes ?? 5,
        places: body.places ?? 5,
        puissance: body.puissance ?? 0,
        cylindree: body.cylindree ?? "Non précisée",
        condition: body.condition ?? "Bon",
        firstHand: body.firstHand ?? false,
        dedouane: body.dedouane ?? true,
      })
      .returning();

    const photoValues = body.photos?.map((photo, position) => ({
      listingId: listing.id,
      url: photo.url,
      alt: photo.alt ?? title,
      position: photo.position ?? position,
      isPrimary: photo.isPrimary ?? position === 0,
    }));

    if (photoValues?.length) {
      await tx.insert(listingPhotosTable).values(photoValues);
    }

    return listing;
  });

  const [listing] = await selectListings()
    .where(eq(listingsTable.id, createdListing.id))
    .limit(1);

  if (!listing) {
    res.status(500).json({ message: "Annonce créée mais introuvable" });
    return;
  }

  const [{ total: sellerTotalAds }] = await db
    .select({ total: count() })
    .from(listingsTable)
    .where(eq(listingsTable.sellerId, listing.sellerId));

  try {
    const data = CreateListingResponse.parse({
      listing: toApiListing(listing),
      detail: toApiDetail(listing, sellerTotalAds),
      similar: [],
    });

    res.status(201).json(data);
  } catch (error) {
    if (isZodValidationError(error)) {
      res.status(500).json({
        message: "Annonce créée mais réponse API invalide",
        issues: error.issues,
      });
      return;
    }

    throw error;
  }
});

router.post("/listings/:id/favorite", async (req, res) => {
  const listingId = parseListingId(req.params.id);

  if (!listingId) {
    res.status(400).json({ message: "Invalid listing id" });
    return;
  }

  if (!(await ensureListingExists(listingId))) {
    res.status(404).json({ message: "Listing not found" });
    return;
  }

  const parsed = FavoriteMutationRequest.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Données invalides pour ajouter le favori",
      issues: parsed.error.issues,
    });
    return;
  }

  const userId = await resolveFavoriteUserId(parsed.data?.userId);

  await db
    .insert(favoritesTable)
    .values({ userId, listingId })
    .onConflictDoNothing({
      target: [favoritesTable.userId, favoritesTable.listingId],
    });

  const data = FavoriteStateResponse.parse({
    userId,
    listingId,
    favorited: true,
  });

  res.status(201).json(data);
});

router.delete("/listings/:id/favorite", async (req, res) => {
  const listingId = parseListingId(req.params.id);

  if (!listingId) {
    res.status(400).json({ message: "Invalid listing id" });
    return;
  }

  const parsed = FavoriteUserParamsSchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      message: "Données invalides pour supprimer le favori",
      issues: parsed.error.issues,
    });
    return;
  }

  const userId = await resolveFavoriteUserId(parsed.data.userId);

  await db
    .delete(favoritesTable)
    .where(
      and(
        eq(favoritesTable.userId, userId),
        eq(favoritesTable.listingId, listingId),
      ),
    );

  const data = FavoriteStateResponse.parse({
    userId,
    listingId,
    favorited: false,
  });

  res.json(data);
});

router.get("/listings/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: "Invalid listing id" });
    return;
  }

  const [listing] = await selectListings()
    .where(eq(listingsTable.id, id))
    .limit(1);

  if (!listing) {
    res.status(404).json({ message: "Listing not found" });
    return;
  }

  const [{ total: sellerTotalAds }] = await db
    .select({ total: count() })
    .from(listingsTable)
    .where(eq(listingsTable.sellerId, listing.sellerId));

  const similarRows = await selectListings()
    .where(
      and(
        ne(listingsTable.id, id),
        or(
          eq(listingsTable.marque, listing.marque),
          and(
            gte(listingsTable.priceRaw, listing.priceRaw - 500000),
            lte(listingsTable.priceRaw, listing.priceRaw + 500000),
          ),
        ),
      ),
    )
    .orderBy(desc(listingsTable.createdAt), desc(listingsTable.id))
    .limit(4);

  const data = ListingDetailResponse.parse({
    listing: toApiListing(listing),
    detail: toApiDetail(listing, sellerTotalAds),
    similar: similarRows.map(toApiListing),
  });

  res.json(data);
});

export default router;

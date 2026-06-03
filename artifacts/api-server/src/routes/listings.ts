import { and, asc, count, desc, eq, gte, ilike, inArray, lte, ne, or, type SQL } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  AccountResponse,
  AccountConversationsResponse,
  AccountMessagesResponse,
  CreateMessageReplyRequest,
  CreateMessageReplyResponse,
  CreateListingMessageRequest,
  CreateListingMessageResponse,
  CreateListingRequest,
  CreateListingResponse,
  DeleteListingResponse,
  FavoriteMutationRequest,
  FavoriteStateResponse,
  FavoriteUserParamsSchema,
  ListListingsResponse,
  ListFavoritesResponse,
  ListingDetailResponse,
  ListingsQuerySchema,
  MarkListingMessageReadResponse,
  UpdateListingRequest,
  UpdateListingResponse,
} from "@workspace/api-zod";
import {
  db,
  favoritesTable,
  listingPhotosTable,
  listingsTable,
  messageRepliesTable,
  messagesTable,
  usersTable,
} from "@workspace/db";

const router: IRouter = Router();
const DEV_FALLBACK_EMAIL = "dev.user@autodz.local";

type ListingRow = Awaited<ReturnType<typeof selectListings>>[number];
type UserRow = typeof usersTable.$inferSelect;
type ListingPhotoRow = typeof listingPhotosTable.$inferSelect;
type MessageReplyRow = typeof messageRepliesTable.$inferSelect;
type MessageRow = typeof messagesTable.$inferSelect & {
  listingTitle: string;
  replies: MessageReplyRow[];
};
type ListingUpdate = Partial<typeof listingsTable.$inferInsert>;

interface AuthIdentity {
  sub?: string;
  email?: string;
  name?: string;
  phone?: string;
  wilaya?: string;
}

class AuthRequiredError extends Error {
  readonly name = "AuthRequiredError";
}

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

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return undefined;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function getBearerToken(req: Request) {
  const authorization = req.header("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

function getAuthIdentity(req: Request): AuthIdentity | undefined {
  const payload = decodeJwtPayload(getBearerToken(req) ?? "");
  if (!payload) return undefined;

  const userMetadata = getRecord(payload.user_metadata) ?? {};
  const appMetadata = getRecord(payload.app_metadata) ?? {};

  return {
    sub: getString(payload.sub),
    email: getString(payload.email),
    name:
      getString(userMetadata.full_name) ??
      getString(userMetadata.name) ??
      getString(payload.name),
    phone:
      getString(userMetadata.phone) ??
      getString(payload.phone) ??
      getString(appMetadata.phone),
    wilaya: getString(userMetadata.wilaya),
  };
}

function initials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return letters || "AD";
}

function accountSellerTypeLabel(value: "particulier" | "concessionnaire") {
  return value === "concessionnaire" ? "Concessionnaire" : "Particulier";
}

function resolveIdentityEmail(identity: AuthIdentity) {
  return identity.email ?? (identity.sub ? `supabase-${identity.sub}@autodz.local` : undefined);
}

async function findUserById(userId: number) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  return user;
}

async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  return user;
}

async function upsertIdentityUser(identity: AuthIdentity) {
  const email = resolveIdentityEmail(identity);
  const name =
    identity.name ??
    email?.split("@", 1)[0]?.replace(/[._-]+/g, " ") ??
    "Utilisateur AutoDZ";
  const phone = identity.phone ?? "Non renseigné";
  const wilaya = identity.wilaya ?? "Alger";

  if (email) {
    const existing = await findUserByEmail(email);

    if (existing) {
      const [updatedUser] = await db
        .update(usersTable)
        .set({
          name,
          phone,
          whatsapp: identity.phone ?? existing.whatsapp,
          wilaya,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, existing.id))
        .returning();

      return updatedUser;
    }
  }

  const [createdUser] = await db
    .insert(usersTable)
    .values({
      name,
      email: email ?? null,
      phone,
      whatsapp: identity.phone,
      wilaya,
      sellerType: "particulier",
    })
    .returning();

  return createdUser;
}

async function resolveDevFallbackUser() {
  const existing = await findUserByEmail(DEV_FALLBACK_EMAIL);
  if (existing) return existing;

  const [fallbackUser] = await db
    .insert(usersTable)
    .values({
      name: "Utilisateur Dev",
      email: DEV_FALLBACK_EMAIL,
      phone: "0550 00 00 00",
      whatsapp: "0550000000",
      wilaya: "Alger",
      sellerType: "particulier",
    })
    .returning();

  return fallbackUser;
}

async function resolveRequestUser(req: Request, explicitUserId?: number) {
  const identity = getAuthIdentity(req);

  if (identity) {
    return { user: await upsertIdentityUser(identity), isDevFallback: false };
  }

  if (explicitUserId) {
    const user = await findUserById(explicitUserId);
    if (user) return { user, isDevFallback: false };
  }

  if (process.env.NODE_ENV === "production") {
    throw new AuthRequiredError("Authentication required");
  }

  return { user: await resolveDevFallbackUser(), isDevFallback: true };
}

async function resolveRequestUserOrRespond(
  req: Request,
  res: Response,
  explicitUserId?: number,
) {
  try {
    return await resolveRequestUser(req, explicitUserId);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      res.status(401).json({ message: "Authentication required" });
      return undefined;
    }

    throw error;
  }
}

async function resolveOptionalRequestUser(req: Request) {
  const identity = getAuthIdentity(req);

  if (identity) {
    return { user: await upsertIdentityUser(identity), isDevFallback: false };
  }

  if (process.env.NODE_ENV !== "production") {
    return { user: await resolveDevFallbackUser(), isDevFallback: true };
  }

  return undefined;
}

async function ensureActiveListingExists(listingId: number) {
  const [listing] = await db
    .select({ id: listingsTable.id })
    .from(listingsTable)
    .where(and(eq(listingsTable.id, listingId), eq(listingsTable.status, "active")))
    .limit(1);

  return Boolean(listing);
}

async function resolveOwnedListingOrRespond(
  req: Request,
  res: Response,
  listingId: number,
) {
  const resolved = await resolveRequestUserOrRespond(req, res);
  if (!resolved) return undefined;

  const [listing] = await db
    .select({ id: listingsTable.id, sellerId: listingsTable.sellerId })
    .from(listingsTable)
    .where(eq(listingsTable.id, listingId))
    .limit(1);

  if (!listing) {
    res.status(404).json({ message: "Listing not found" });
    return undefined;
  }

  if (listing.sellerId !== resolved.user.id) {
    res.status(403).json({ message: "Vous ne pouvez modifier que vos propres annonces." });
    return undefined;
  }

  return { listing, user: resolved.user };
}

function parseListingId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function parseMessageId(value: string | undefined) {
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

function publicListingsWhere(query?: ReturnType<typeof ListingsQuerySchema.parse>) {
  const queryWhere = query ? buildListingWhere(query) : undefined;

  return queryWhere
    ? and(eq(listingsTable.status, "active"), queryWhere)
    : eq(listingsTable.status, "active");
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
      status: listingsTable.status,
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

function toApiPhoto(row: ListingPhotoRow) {
  return {
    url: row.url,
    ...(row.alt ? { alt: row.alt } : {}),
    position: row.position,
    isPrimary: row.isPrimary,
  };
}

function sortPhotos(photos: ListingPhotoRow[]) {
  return [...photos].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
    return left.position - right.position || left.id - right.id;
  });
}

async function getPhotosByListingIds(listingIds: number[]) {
  if (listingIds.length === 0) return new Map<number, ListingPhotoRow[]>();

  const photos = await db
    .select()
    .from(listingPhotosTable)
    .where(inArray(listingPhotosTable.listingId, listingIds))
    .orderBy(
      asc(listingPhotosTable.listingId),
      desc(listingPhotosTable.isPrimary),
      asc(listingPhotosTable.position),
      asc(listingPhotosTable.id),
    );

  const photosByListingId = new Map<number, ListingPhotoRow[]>();

  for (const photo of photos) {
    const listingPhotos = photosByListingId.get(photo.listingId) ?? [];
    listingPhotos.push(photo);
    photosByListingId.set(photo.listingId, listingPhotos);
  }

  return photosByListingId;
}

function toApiListing(
  row: ListingRow,
  photosByListingId = new Map<number, ListingPhotoRow[]>(),
) {
  const photos = sortPhotos(photosByListingId.get(row.id) ?? []).map(toApiPhoto);

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
    status: row.status,
    description: row.description,
    ...(photos.length > 0 ? { photos } : {}),
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

function toAccountUser(user: UserRow, isDevFallback: boolean) {
  return {
    id: user.id,
    name: user.name,
    initials: initials(user.name),
    email: user.email,
    phone: user.phone,
    whatsapp: user.whatsapp,
    wilaya: user.wilaya,
    sellerType: accountSellerTypeLabel(user.sellerType),
    rating: Number(user.rating),
    reviewCount: user.reviewCount,
    verified: user.verified,
    totalSales: user.totalSales,
    memberSince: sellerMemberLabel(user.createdAt),
    isDevFallback,
  };
}

function toApiMessageReply(row: MessageReplyRow) {
  return {
    id: row.id,
    messageId: row.messageId,
    authorId: row.authorId,
    authorRole: row.authorRole,
    authorName: row.authorName,
    authorEmail: row.authorEmail,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

function toApiMessage(row: MessageRow) {
  return {
    id: row.id,
    listingId: row.listingId,
    listingTitle: row.listingTitle,
    senderId: row.senderId,
    sellerId: row.sellerId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    replies: row.replies.map(toApiMessageReply),
  };
}

async function getRepliesByMessageIds(messageIds: number[]) {
  if (messageIds.length === 0) return new Map<number, MessageReplyRow[]>();

  const replies = await db
    .select()
    .from(messageRepliesTable)
    .where(inArray(messageRepliesTable.messageId, messageIds))
    .orderBy(asc(messageRepliesTable.createdAt), asc(messageRepliesTable.id));

  const repliesByMessageId = new Map<number, MessageReplyRow[]>();

  replies.forEach((reply) => {
    const existingReplies = repliesByMessageId.get(reply.messageId) ?? [];
    existingReplies.push(reply);
    repliesByMessageId.set(reply.messageId, existingReplies);
  });

  return repliesByMessageId;
}

async function getAccountMessageRows(userId: number, messageId?: number) {
  const conditions: SQL[] = [eq(messagesTable.sellerId, userId)];

  if (messageId !== undefined) {
    conditions.push(eq(messagesTable.id, messageId));
  }

  const rows = await db
    .select({
      id: messagesTable.id,
      listingId: messagesTable.listingId,
      listingTitle: listingsTable.title,
      senderId: messagesTable.senderId,
      sellerId: messagesTable.sellerId,
      name: messagesTable.name,
      email: messagesTable.email,
      phone: messagesTable.phone,
      message: messagesTable.message,
      createdAt: messagesTable.createdAt,
      readAt: messagesTable.readAt,
    })
    .from(messagesTable)
    .innerJoin(listingsTable, eq(messagesTable.listingId, listingsTable.id))
    .where(and(...conditions))
    .orderBy(desc(messagesTable.createdAt), desc(messagesTable.id));

  const repliesByMessageId = await getRepliesByMessageIds(rows.map((row) => row.id));

  return rows.map((row) => ({
    ...row,
    replies: repliesByMessageId.get(row.id) ?? [],
  }));
}

async function getAccountConversationRows(userId: number, messageId?: number) {
  const participantWhere = or(
    eq(messagesTable.sellerId, userId),
    eq(messagesTable.senderId, userId),
  );
  const conditions: SQL[] = participantWhere ? [participantWhere] : [];

  if (messageId !== undefined) {
    conditions.push(eq(messagesTable.id, messageId));
  }

  const rows = await db
    .select({
      id: messagesTable.id,
      listingId: messagesTable.listingId,
      listingTitle: listingsTable.title,
      senderId: messagesTable.senderId,
      sellerId: messagesTable.sellerId,
      name: messagesTable.name,
      email: messagesTable.email,
      phone: messagesTable.phone,
      message: messagesTable.message,
      createdAt: messagesTable.createdAt,
      readAt: messagesTable.readAt,
    })
    .from(messagesTable)
    .innerJoin(listingsTable, eq(messagesTable.listingId, listingsTable.id))
    .where(and(...conditions))
    .orderBy(desc(messagesTable.createdAt), desc(messagesTable.id));

  const repliesByMessageId = await getRepliesByMessageIds(rows.map((row) => row.id));

  return rows.map((row) => ({
    ...row,
    replies: repliesByMessageId.get(row.id) ?? [],
  }));
}

async function buildListingDetailResponse(
  listingId: number,
  responseSchema: typeof ListingDetailResponse,
) {
  const [listing] = await selectListings()
    .where(eq(listingsTable.id, listingId))
    .limit(1);

  if (!listing) return undefined;

  const [{ total: sellerTotalAds }] = await db
    .select({ total: count() })
    .from(listingsTable)
    .where(eq(listingsTable.sellerId, listing.sellerId));

  const photosByListingId = await getPhotosByListingIds([listing.id]);

  return responseSchema.parse({
    listing: toApiListing(listing, photosByListingId),
    detail: toApiDetail(listing, sellerTotalAds),
    similar: [],
  });
}

async function getFacets() {
  const [marques, wilayas, fuels, transmissions] = await Promise.all([
    db
      .selectDistinct({ value: listingsTable.marque })
      .from(listingsTable)
      .where(eq(listingsTable.status, "active"))
      .orderBy(asc(listingsTable.marque)),
    db
      .selectDistinct({ value: listingsTable.wilaya })
      .from(listingsTable)
      .where(eq(listingsTable.status, "active"))
      .orderBy(asc(listingsTable.wilaya)),
    db
      .selectDistinct({ value: listingsTable.fuel })
      .from(listingsTable)
      .where(eq(listingsTable.status, "active"))
      .orderBy(asc(listingsTable.fuel)),
    db
      .selectDistinct({ value: listingsTable.transmission })
      .from(listingsTable)
      .where(eq(listingsTable.status, "active"))
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
  const where = publicListingsWhere(query);
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

  const photosByListingId = await getPhotosByListingIds(rows.map((row) => row.id));

  const data = ListListingsResponse.parse({
    items: rows.map((row) => toApiListing(row, photosByListingId)),
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
  const resolved = await resolveRequestUserOrRespond(req, res, query.userId);
  if (!resolved) return;
  const userId = resolved.user.id;

  const favoriteRows = await db
    .select({ listingId: favoritesTable.listingId })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId))
    .orderBy(desc(favoritesTable.createdAt));

  const listingIds = favoriteRows.map((favorite) => favorite.listingId);
  const rows = listingIds.length
    ? await selectListings().where(
        and(
          inArray(listingsTable.id, listingIds),
          eq(listingsTable.status, "active"),
        ),
      )
    : [];
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const photosByListingId = await getPhotosByListingIds(rows.map((row) => row.id));
  const orderedRows = listingIds
    .map((listingId) => rowsById.get(listingId))
    .filter((row): row is ListingRow => Boolean(row));

  const data = ListFavoritesResponse.parse({
    userId,
    listingIds,
    items: orderedRows.map((row) => toApiListing(row, photosByListingId)),
  });

  res.json(data);
});

router.get("/account/messages", async (req, res) => {
  const resolved = await resolveRequestUserOrRespond(req, res);
  if (!resolved) return;
  const userId = resolved.user.id;

  const rows = await getAccountMessageRows(userId);

  const unreadCount = rows.filter((row) => row.readAt === null).length;

  const data = AccountMessagesResponse.parse({
    items: rows.map(toApiMessage),
    unreadCount,
  });

  res.json(data);
});

router.get("/account/conversations", async (req, res) => {
  const resolved = await resolveRequestUserOrRespond(req, res);
  if (!resolved) return;
  const userId = resolved.user.id;

  const rows = await getAccountConversationRows(userId);
  const unreadCount = rows.filter(
    (row) => row.sellerId === userId && row.readAt === null,
  ).length;

  const data = AccountConversationsResponse.parse({
    items: rows.map(toApiMessage),
    unreadCount,
  });

  res.json(data);
});

router.patch("/account/messages/:id/read", async (req, res) => {
  const messageId = parseMessageId(req.params.id);

  if (!messageId) {
    res.status(400).json({ message: "Invalid message id" });
    return;
  }

  const resolved = await resolveRequestUserOrRespond(req, res);
  if (!resolved) return;
  const userId = resolved.user.id;

  const [message] = await getAccountMessageRows(userId, messageId);

  if (!message) {
    res.status(404).json({ message: "Message not found" });
    return;
  }

  const readAt = message.readAt ?? new Date();

  if (message.readAt === null) {
    await db
      .update(messagesTable)
      .set({ readAt })
      .where(eq(messagesTable.id, messageId));
  }

  const data = MarkListingMessageReadResponse.parse({
    message: toApiMessage({ ...message, readAt }),
  });

  res.json(data);
});

router.post("/account/messages/:id/replies", async (req, res) => {
  const messageId = parseMessageId(req.params.id);

  if (!messageId) {
    res.status(400).json({ message: "Invalid message id" });
    return;
  }

  const parsed = CreateMessageReplyRequest.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Réponse invalide",
      issues: parsed.error.issues,
    });
    return;
  }

  const resolved = await resolveRequestUserOrRespond(req, res);
  if (!resolved) return;
  const user = resolved.user;

  const [message] = await getAccountConversationRows(user.id, messageId);

  if (!message) {
    res.status(404).json({ message: "Message not found" });
    return;
  }

  const isSeller = message.sellerId === user.id;
  const isBuyer = message.senderId === user.id;

  if (!isSeller && !isBuyer) {
    res.status(403).json({ message: "Vous ne pouvez répondre qu'à vos conversations." });
    return;
  }

  const readAt = message.readAt ?? new Date();

  await db.transaction(async (tx) => {
    await tx.insert(messageRepliesTable).values({
      messageId,
      authorId: user.id,
      authorRole: isSeller ? "seller" : "buyer",
      authorName: user.name,
      authorEmail: user.email,
      body: parsed.data.body,
    });

    if (isSeller && message.readAt === null) {
      await tx
        .update(messagesTable)
        .set({ readAt })
        .where(eq(messagesTable.id, messageId));
    }
  });

  const [updatedMessage] = await getAccountConversationRows(user.id, messageId);

  if (!updatedMessage) {
    res.status(404).json({ message: "Message not found" });
    return;
  }

  const data = CreateMessageReplyResponse.parse({
    message: toApiMessage({ ...updatedMessage, readAt: updatedMessage.readAt ?? readAt }),
  });

  res.status(201).json(data);
});

router.get("/account", async (req, res) => {
  const resolved = await resolveRequestUserOrRespond(req, res);
  if (!resolved) return;
  const { user, isDevFallback } = resolved;

  const listingRows = await selectListings()
    .where(eq(listingsTable.sellerId, user.id))
    .orderBy(desc(listingsTable.createdAt), desc(listingsTable.id));

  const listingPhotosById = await getPhotosByListingIds(
    listingRows.map((row) => row.id),
  );

  const accountListings = await Promise.all(
    listingRows.map(async (row) => {
      const [{ total: favoriteCount }] = await db
        .select({ total: count() })
        .from(favoritesTable)
        .where(eq(favoritesTable.listingId, row.id));

      return {
        listing: toApiListing(row, listingPhotosById),
        status: row.status,
        views: row.views,
        favorites: favoriteCount,
        postedDaysAgo: daysAgo(row.createdAt),
        expiresInDays: Math.max(0, 30 - daysAgo(row.createdAt)),
        boosted: Boolean(row.badge),
      };
    }),
  );

  const favoriteRows = await db
    .select({ listingId: favoritesTable.listingId })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, user.id))
    .orderBy(desc(favoritesTable.createdAt));
  const favoriteIds = favoriteRows.map((favorite) => favorite.listingId);
  const favorites = favoriteIds.length
    ? await selectListings().where(
        and(
          inArray(listingsTable.id, favoriteIds),
          eq(listingsTable.status, "active"),
        ),
      )
    : [];
  const favoritesById = new Map(favorites.map((listing) => [listing.id, listing]));
  const favoritePhotosById = await getPhotosByListingIds(
    favorites.map((listing) => listing.id),
  );

  const data = AccountResponse.parse({
    user: toAccountUser(user, isDevFallback),
    listings: accountListings,
    favorites: favoriteIds
      .map((listingId) => favoritesById.get(listingId))
      .filter((listing): listing is ListingRow => Boolean(listing))
      .map((listing) => toApiListing(listing, favoritePhotosById)),
  });

  res.json(data);
});

router.post("/listings/:id/messages", async (req, res) => {
  const listingId = parseListingId(req.params.id);

  if (!listingId) {
    res.status(400).json({ message: "Invalid listing id" });
    return;
  }

  const parsed = CreateListingMessageRequest.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Données invalides pour envoyer le message",
      issues: parsed.error.issues,
    });
    return;
  }

  const [listing] = await selectListings()
    .where(and(eq(listingsTable.id, listingId), eq(listingsTable.status, "active")))
    .limit(1);

  if (!listing) {
    res.status(404).json({ message: "Listing not found" });
    return;
  }

  const resolved = await resolveOptionalRequestUser(req);
  const body = parsed.data;

  const [createdMessage] = await db
    .insert(messagesTable)
    .values({
      listingId,
      senderId: resolved?.user.id,
      sellerId: listing.sellerId,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone,
      message: body.message,
    })
    .returning();

  const data = CreateListingMessageResponse.parse({
    message: toApiMessage({
      ...createdMessage,
      listingTitle: listing.title,
      replies: [],
    }),
  });

  res.status(201).json(data);
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
  const resolved = await resolveRequestUserOrRespond(req, res);
  if (!resolved) return;
  const { user: currentUser } = resolved;

  const createdListing = await db.transaction(async (tx) => {
    const [seller] = await tx
      .update(usersTable)
      .set({
        name: body.seller.name,
        phone: body.seller.phone,
        whatsapp: body.seller.whatsapp ?? body.seller.phone,
        wilaya: body.seller.wilaya,
        sellerType: body.seller.sellerType,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, currentUser.id))
      .returning();

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

  const photosByListingId = await getPhotosByListingIds([listing.id]);

  try {
    const data = CreateListingResponse.parse({
      listing: toApiListing(listing, photosByListingId),
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

router.patch("/listings/:id", async (req, res) => {
  const listingId = parseListingId(req.params.id);

  if (!listingId) {
    res.status(400).json({ message: "Invalid listing id" });
    return;
  }

  const parsed = UpdateListingRequest.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Données invalides pour modifier l'annonce",
      issues: parsed.error.issues,
    });
    return;
  }

  const body = parsed.data;
  const updateData: ListingUpdate = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.priceRaw !== undefined) updateData.priceRaw = body.priceRaw;
  if (body.kmRaw !== undefined) updateData.kmRaw = body.kmRaw;
  if (body.wilaya !== undefined) updateData.wilaya = body.wilaya;
  if (body.location !== undefined) updateData.location = body.location;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.status !== undefined) updateData.status = body.status;

  if (Object.keys(updateData).length === 0 && body.photos === undefined) {
    res.status(400).json({ message: "Aucune modification fournie" });
    return;
  }

  const owned = await resolveOwnedListingOrRespond(req, res, listingId);
  if (!owned) return;

  await db.transaction(async (tx) => {
    await tx
      .update(listingsTable)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(listingsTable.id, listingId));

    if (body.photos !== undefined) {
      await tx
        .delete(listingPhotosTable)
        .where(eq(listingPhotosTable.listingId, listingId));

      const photoValues = body.photos.map((photo, position) => ({
        listingId,
        url: photo.url,
        alt: photo.alt ?? body.title ?? "Photo annonce",
        position: photo.position ?? position,
        isPrimary: photo.isPrimary ?? position === 0,
      }));

      if (photoValues.length > 0) {
        await tx.insert(listingPhotosTable).values(photoValues);
      }
    }
  });

  const data = await buildListingDetailResponse(listingId, UpdateListingResponse);

  if (!data) {
    res.status(404).json({ message: "Listing not found" });
    return;
  }

  res.json(data);
});

router.delete("/listings/:id", async (req, res) => {
  const listingId = parseListingId(req.params.id);

  if (!listingId) {
    res.status(400).json({ message: "Invalid listing id" });
    return;
  }

  const owned = await resolveOwnedListingOrRespond(req, res, listingId);
  if (!owned) return;

  await db.delete(listingsTable).where(eq(listingsTable.id, listingId));

  const data = DeleteListingResponse.parse({
    id: listingId,
    deleted: true,
  });

  res.json(data);
});

router.post("/listings/:id/favorite", async (req, res) => {
  const listingId = parseListingId(req.params.id);

  if (!listingId) {
    res.status(400).json({ message: "Invalid listing id" });
    return;
  }

  if (!(await ensureActiveListingExists(listingId))) {
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

  const resolved = await resolveRequestUserOrRespond(req, res, parsed.data?.userId);
  if (!resolved) return;
  const userId = resolved.user.id;

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

  const resolved = await resolveRequestUserOrRespond(req, res, parsed.data.userId);
  if (!resolved) return;
  const userId = resolved.user.id;

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

  if (listing.status !== "active") {
    const resolved = await resolveOptionalRequestUser(req);

    if (resolved?.user.id !== listing.sellerId) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }
  }

  const [{ total: sellerTotalAds }] = await db
    .select({ total: count() })
    .from(listingsTable)
    .where(eq(listingsTable.sellerId, listing.sellerId));

  const similarRows = await selectListings()
    .where(
      and(
        ne(listingsTable.id, id),
        eq(listingsTable.status, "active"),
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
  const photosByListingId = await getPhotosByListingIds([
    listing.id,
    ...similarRows.map((row) => row.id),
  ]);

  const data = ListingDetailResponse.parse({
    listing: toApiListing(listing, photosByListingId),
    detail: toApiDetail(listing, sellerTotalAds),
    similar: similarRows.map((row) => toApiListing(row, photosByListingId)),
  });

  res.json(data);
});

export default router;

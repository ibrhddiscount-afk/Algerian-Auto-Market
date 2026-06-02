import { Router, type IRouter } from "express";
import {
  ListListingsResponse,
  ListingDetailResponse,
  ListingsQuerySchema,
} from "@workspace/api-zod";
import { ALL_LISTINGS, type Listing } from "../listing-fixtures";
import { getDetail } from "../listing-details-fixtures";

const router: IRouter = Router();

const facets = {
  marques: [...new Set(ALL_LISTINGS.map((listing) => listing.marque))].sort(),
  wilayas: [...new Set(ALL_LISTINGS.map((listing) => listing.wilaya))].sort(),
  fuels: ["Essence", "Diesel", "GPL", "Hybride", "Électrique"],
  transmissions: ["Manuelle", "Automatique"],
};

function splitQueryList(value: string | undefined): string[] {
  return value?.split(",").filter(Boolean) ?? [];
}

function sortListings(listings: Listing[], sort = "recent"): Listing[] {
  const results = [...listings];

  switch (sort) {
    case "prix_asc":
      return results.sort((left, right) => left.priceRaw - right.priceRaw);
    case "prix_desc":
      return results.sort((left, right) => right.priceRaw - left.priceRaw);
    case "km_asc":
      return results.sort((left, right) => left.kmRaw - right.kmRaw);
    case "annee_desc":
      return results.sort((left, right) => right.year - left.year);
    default:
      return results.sort((left, right) => right.id - left.id);
  }
}

router.get("/listings", (req, res) => {
  const query = ListingsQuerySchema.parse(req.query);
  const fuels = splitQueryList(query.fuels);
  const transmissions = splitQueryList(query.transmissions);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 9;

  let results = [...ALL_LISTINGS];

  if (query.search) {
    const search = query.search.toLowerCase();
    results = results.filter(
      (listing) =>
        listing.title.toLowerCase().includes(search) ||
        listing.marque.toLowerCase().includes(search) ||
        listing.modele.toLowerCase().includes(search) ||
        listing.location.toLowerCase().includes(search),
    );
  }

  if (query.marque) {
    results = results.filter((listing) => listing.marque === query.marque);
  }

  if (query.wilaya) {
    results = results.filter((listing) => listing.wilaya === query.wilaya);
  }

  if (fuels.length > 0) {
    results = results.filter((listing) => fuels.includes(listing.fuel));
  }

  if (transmissions.length > 0) {
    results = results.filter((listing) =>
      transmissions.includes(listing.transmission),
    );
  }

  if (query.verifiedOnly) {
    results = results.filter((listing) => listing.verified);
  }

  if (query.priceMin !== undefined) {
    const priceMin = query.priceMin;
    results = results.filter((listing) => listing.priceRaw >= priceMin);
  }

  if (query.priceMax !== undefined) {
    const priceMax = query.priceMax;
    results = results.filter((listing) => listing.priceRaw <= priceMax);
  }

  if (query.yearMin !== undefined) {
    const yearMin = query.yearMin;
    results = results.filter((listing) => listing.year >= yearMin);
  }

  if (query.yearMax !== undefined) {
    const yearMax = query.yearMax;
    results = results.filter((listing) => listing.year <= yearMax);
  }

  if (query.kmMin !== undefined) {
    const kmMin = query.kmMin;
    results = results.filter((listing) => listing.kmRaw >= kmMin);
  }

  if (query.kmMax !== undefined) {
    const kmMax = query.kmMax;
    results = results.filter((listing) => listing.kmRaw <= kmMax);
  }

  const sorted = sortListings(results, query.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const items = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const data = ListListingsResponse.parse({
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
    facets,
  });

  res.json(data);
});

router.get("/listings/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: "Invalid listing id" });
    return;
  }

  const listing = ALL_LISTINGS.find((item) => item.id === id);

  if (!listing) {
    res.status(404).json({ message: "Listing not found" });
    return;
  }

  const detail = getDetail(id);
  const similar = ALL_LISTINGS.filter(
    (item) =>
      item.id !== id &&
      (item.marque === listing.marque ||
        Math.abs(item.priceRaw - listing.priceRaw) < 500000),
  ).slice(0, 4);

  const data = ListingDetailResponse.parse({ listing, detail, similar });
  res.json(data);
});

export default router;

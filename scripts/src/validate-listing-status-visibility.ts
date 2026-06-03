type AccountListing = {
  listing: {
    id: number;
    title: string;
  };
  status: "active" | "draft" | "sold";
};

type AccountResponse = {
  listings: AccountListing[];
};

type ListListingsResponse = {
  items: Array<{
    id: number;
    title: string;
    status: string;
  }>;
};

const apiBaseUrl = (process.env.API_BASE_URL ?? "http://localhost:3000/api").replace(
  /\/+$/,
  "",
);

async function requestJson<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `${init?.method ?? "GET"} ${path} failed with ${response.status}: ${text}`,
    );
  }

  return (text ? JSON.parse(text) : null) as TResponse;
}

async function patchListingStatus(
  listingId: number,
  status: AccountListing["status"],
) {
  await requestJson(`/listings/${listingId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

async function main() {
  const account = await requestJson<AccountResponse>("/account");
  const candidate = account.listings.find((item) => item.status === "active");

  if (!candidate) {
    throw new Error(
      "Aucune annonce active trouvée dans /api/account. Créez ou réactivez une annonce avant cette validation.",
    );
  }

  const listingId = candidate.listing.id;
  const listingTitle = candidate.listing.title;

  try {
    await patchListingStatus(listingId, "sold");

    const publicListings = await requestJson<ListListingsResponse>(
      `/listings?search=${encodeURIComponent(listingTitle)}&pageSize=50`,
    );
    const stillPublic = publicListings.items.some((item) => item.id === listingId);

    if (stillPublic) {
      throw new Error(
        `Validation échouée: l'annonce ${listingId} est encore visible dans /api/listings après status=sold.`,
      );
    }

    const updatedAccount = await requestJson<AccountResponse>("/account");
    const accountListing = updatedAccount.listings.find(
      (item) => item.listing.id === listingId,
    );

    if (!accountListing || accountListing.status !== "sold") {
      throw new Error(
        `Validation échouée: l'annonce ${listingId} n'est pas conservée en sold dans /api/account.`,
      );
    }

    console.log(
      `OK: l'annonce ${listingId} disparaît de /api/listings et reste dans /api/account avec status=sold.`,
    );
  } finally {
    await patchListingStatus(listingId, "active");
    console.log(`Restauration: annonce ${listingId} repassée en active.`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});

import { useQueryClient } from "@tanstack/react-query";
import {
  useAddFavorite,
  useListFavorites,
  useRemoveFavorite,
} from "@workspace/api-client-react";

const FAVORITES_QUERY_PREFIX = ["/api/favorites"] as const;

export function useFavoriteListing(listingId: number) {
  const queryClient = useQueryClient();
  const favoritesQuery = useListFavorites();
  const addFavorite = useAddFavorite({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_PREFIX });
      },
    },
  });
  const removeFavorite = useRemoveFavorite({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_PREFIX });
      },
    },
  });

  const favorited = favoritesQuery.data?.listingIds.includes(listingId) ?? false;
  const isPending = addFavorite.isPending || removeFavorite.isPending;

  const toggleFavorite = async () => {
    if (isPending) return;

    if (favorited) {
      await removeFavorite.mutateAsync({ listingId });
      return;
    }

    await addFavorite.mutateAsync({ listingId });
  };

  return {
    favorited,
    isPending,
    isLoading: favoritesQuery.isLoading,
    isError: favoritesQuery.isError || addFavorite.isError || removeFavorite.isError,
    toggleFavorite,
  };
}

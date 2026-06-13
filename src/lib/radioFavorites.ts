const FAVORITES_KEY = 'user_radio_favorites';

export const getFavorites = (): number[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const toggleFavorite = (stationId: number): number[] => {
  const favorites = getFavorites();
  const index = favorites.indexOf(stationId);
  if (index === -1) {
    favorites.push(stationId);
  } else {
    favorites.splice(index, 1);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return favorites;
};

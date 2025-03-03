export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  runtime?: number;
  genres?: { id: number; name: string }[];
  budget?: number;
  revenue?: number;
  original_language?: string;
  production_countries?: { iso_3166_1: string; name: string }[];
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  status?: string;
  tagline?: string;
  original_title?: string;
  adult?: boolean;
  certification?: string;
}

export interface MovieCredit {
  id: number;
  name: string;
  profile_path: string | null;
  character?: string;
  job?: string;
}

export interface MovieCredits {
  cast: MovieCredit[];
  crew: MovieCredit[];
}

export interface MovieWithProviders extends Movie {
  watch_providers?: WatchProviders;
  credits?: MovieCredits;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviders {
  flatrate?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface MovieSearchResponse {
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
export const getPosterUrl = (path: string | null, size = "w342") =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : "/placeholder-poster.svg";
export const getBackdropUrl = (path: string | null, size = "original") =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : "/placeholder-backdrop.svg";
export const getProviderLogoUrl = (path: string | null, size = "w92") =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : "/placeholder-logo.svg";

export const getProfileUrl = (path: string | null, size = "w185") =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export const getLanguageName = (code: string) => {
  try {
    return new Intl.DisplayNames(['de'], { type: 'language' }).of(code);
  } catch (e) {
    return code.toUpperCase();
  }
};

export const searchMovies = async (query: string): Promise<MovieSearchResponse> => {
  if (!query || query.length < 2) {
    return { results: [], total_pages: 0, total_results: 0 };
  }

  try {
    const response = await fetch(`/api/movies/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error("Fehler bei der Filmsuche");
    }
    return await response.json();
  } catch (error) {
    console.error("Fehler bei der TMDB-API-Anfrage:", error);
    return { results: [], total_pages: 0, total_results: 0 };
  }
};
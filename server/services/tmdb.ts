const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

interface TMDBSearchParams {
  query: string;
  language?: string;
  include_adult?: boolean;
  page?: number;
}

export async function searchMovies({
  query,
  language = "de-DE",
  include_adult = false,
  page = 1,
}: TMDBSearchParams) {
  const url = new URL(`${TMDB_BASE_URL}/search/movie`);
  url.searchParams.append("api_key", TMDB_API_KEY);
  url.searchParams.append("query", query);
  url.searchParams.append("language", language);
  url.searchParams.append("include_adult", String(include_adult));
  url.searchParams.append("page", String(page));

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
}

export async function getTrendingMovies(language = "de-DE") {
  const response = await fetch(
    `${TMDB_BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}&language=${language}`,
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
}

export async function getMovieDetails(movieId: string, language = "de-DE") {
  const [movieResponse, providersResponse, creditsResponse, releaseDatesResponse] =
    await Promise.all([
      fetch(
        `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=${language}`,
      ),
      fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`,
      ),
      fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=${language}`,
      ),
      fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/release_dates?api_key=${TMDB_API_KEY}`,
      ),
    ]);

  const [movieData, providersData, creditsData, releaseDatesData] =
    await Promise.all([
      movieResponse.json(),
      providersResponse.json(),
      creditsResponse.json(),
      releaseDatesResponse.json(),
    ]);

  const providers = providersData.results?.DE || {};

  let certification = null;
  const germanReleases = releaseDatesData.results?.find(
    (country: any) => country.iso_3166_1 === "DE",
  );
  if (germanReleases?.release_dates?.length > 0) {
    const certifiedRelease = germanReleases.release_dates.find(
      (release: any) => release.certification,
    );
    certification = certifiedRelease?.certification || null;
  }

  return {
    ...movieData,
    watch_providers: providers,
    credits: creditsData,
    certification,
  };
}

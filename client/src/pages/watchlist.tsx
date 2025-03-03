import { useQuery } from "@tanstack/react-query";
import { MovieGrid } from "@/components/movie-grid";
import { Card, CardContent } from "@/components/ui/card";
import type { SelectWatchlistMovie } from "@db/schema";

export default function Watchlist() {
  const { data: watchlist, isLoading } = useQuery<SelectWatchlistMovie[]>({
    queryKey: ["/api/watchlist"],
  });

  const movies = watchlist?.map(item => ({
    id: item.movie_id,
    title: item.movie_title,
    poster_path: item.poster_path,
    // Add placeholder values for required Movie type properties
    overview: "",
    backdrop_path: null,
    release_date: new Date().toISOString(),
    vote_average: 0
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <h1 className="text-4xl font-bold mb-6 text-primary">My Watchlist</h1>
          </CardContent>
        </Card>

        <MovieGrid 
          movies={movies} 
          isLoading={isLoading}
          showWatchlistButton={true}
          isWatchlistPage={true}
        />
      </div>
    </div>
  );
}
import { Movie } from "@/lib/tmdb";
import { MovieCard } from "./movie-card";
import { Skeleton } from "@/components/ui/skeleton";

interface MovieGridProps {
  movies?: Movie[];
  isLoading?: boolean;
  showWatchlistButton?: boolean;
  isWatchlistPage?: boolean;
}

export function MovieGrid({ 
  movies, 
  isLoading, 
  showWatchlistButton = true,
  isWatchlistPage = false 
}: MovieGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-500">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="aspect-[2/3] rounded-lg animate-pulse" 
          />
        ))}
      </div>
    );
  }

  if (!movies?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground animate-in fade-in duration-300">
        No movies found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-300">
      {movies.map((movie) => (
        <MovieCard 
          key={movie.id} 
          movie={movie} 
          showWatchlistButton={showWatchlistButton}
          isWatchlistPage={isWatchlistPage}
        />
      ))}
    </div>
  );
}
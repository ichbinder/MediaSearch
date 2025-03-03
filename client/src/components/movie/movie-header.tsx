import { Star, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Check } from "lucide-react";
import type { Movie } from "@/lib/tmdb";

interface MovieHeaderProps {
  movie: Movie;
  isInWatchlist: boolean;
  isWatchlistLoading: boolean;
  onWatchlistClick: () => void;
}

export function MovieHeader({ 
  movie, 
  isInWatchlist, 
  isWatchlistLoading, 
  onWatchlistClick 
}: MovieHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-4xl font-bold">{movie.title}</h1>
        <Button
          size="icon"
          variant={isInWatchlist ? "secondary" : "default"}
          className="h-10 w-10"
          onClick={onWatchlistClick}
          disabled={isWatchlistLoading}
        >
          {isWatchlistLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isInWatchlist ? (
            <Check className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </Button>
      </div>
      {movie.tagline && (
        <p className="text-lg text-muted-foreground mb-4 italic">
          {movie.tagline}
        </p>
      )}

      <div className="flex gap-4 mb-6 text-muted-foreground">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4" />
          <span>{movie.vote_average.toFixed(1)}</span>
        </div>
        {movie.runtime && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{movie.runtime} min</span>
          </div>
        )}
        {movie.certification && (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            <span>FSK {movie.certification}</span>
          </div>
        )}
        <div>{new Date(movie.release_date).getFullYear()}</div>
      </div>
    </>
  );
}

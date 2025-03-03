import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Movie, getPosterUrl } from "@/lib/tmdb";
import { Link } from "wouter";
import { Plus, Check, Trash2, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SelectWatchlistMovie } from "@db/schema";

interface MovieCardProps {
  movie: Movie;
  showWatchlistButton?: boolean;
  isWatchlistPage?: boolean;
}

export function MovieCard({ movie, showWatchlistButton = true, isWatchlistPage = false }: MovieCardProps) {
  const queryClient = useQueryClient();

  const { data: watchlist } = useQuery<SelectWatchlistMovie[]>({
    queryKey: ["/api/watchlist"],
  });

  const isInWatchlist = watchlist?.some(item => item.movie_id === movie.id);

  const addToWatchlist = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/watchlist", {
        movie_id: movie.id,
        movie_title: movie.title,
        poster_path: movie.poster_path,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/watchlist/${movie.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (isInWatchlist) {
      removeFromWatchlist.mutate();
    } else {
      addToWatchlist.mutate();
    }
  };

  const isLoading = addToWatchlist.isPending || removeFromWatchlist.isPending;
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'N/A';

  return (
    <Link href={`/movie/${movie.id}`}>
      <Card className="overflow-hidden cursor-pointer group transition-transform hover:-translate-y-1">
        <div className="aspect-[2/3] relative">
          <img
            src={getPosterUrl(movie.poster_path)}
            alt={movie.title}
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: isLoading ? 0.7 : 1 }}
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4">
            <div className="h-full flex flex-col justify-between">
              <div className="flex justify-end">
                {showWatchlistButton && (
                  <Button
                    size="icon"
                    variant={isWatchlistPage ? "destructive" : isInWatchlist ? "secondary" : "default"}
                    className="h-8 w-8"
                    onClick={handleWatchlistClick}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isWatchlistPage ? (
                      <Trash2 className="h-4 w-4" />
                    ) : isInWatchlist ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold">{movie.title}</h3>
                <p className="text-white/80 text-sm mt-1">
                  {releaseYear}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
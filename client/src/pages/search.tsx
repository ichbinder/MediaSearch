import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { MovieGrid } from "@/components/movie-grid";
import { Card, CardContent } from "@/components/ui/card";
import type { MovieSearchResponse } from "@/lib/tmdb";

export default function Search() {
  const [search, setSearch] = useState("");
  const showSearchResults = search.length >= 2;

  const { data: searchResults, isLoading } = useQuery<MovieSearchResponse>({
    queryKey: ["/api/movies/search", search],
    queryFn: async () => {
      const response = await fetch(`/api/movies/search?query=${encodeURIComponent(search)}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: showSearchResults,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <h1 className="text-4xl font-bold mb-6 text-primary">Filmsuche</h1>
            <SearchBar value={search} onChange={setSearch} />
          </CardContent>
        </Card>

        {!showSearchResults && search.length > 0 && (
          <p className="text-muted-foreground mb-4">
            Geben Sie mindestens 2 Zeichen ein, um zu suchen
          </p>
        )}

        {showSearchResults && (
          <h2 className="text-2xl font-semibold mb-4">
            Suchergebnisse
          </h2>
        )}

        <MovieGrid 
          movies={searchResults?.results} 
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { MovieGrid } from "@/components/movie-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ListVideo } from "lucide-react";
import type { MovieSearchResponse } from "@/lib/tmdb";

export default function Home() {
  const [search, setSearch] = React.useState("");
  const showSearchResults = search.length >= 2;

  const { data: searchResults, isLoading: isSearchLoading } = useQuery<MovieSearchResponse>({
    queryKey: ["/api/movies/search", search],
    queryFn: async () => {
      console.log("Sending search request for:", search);
      const response = await fetch(`/api/movies/search?query=${encodeURIComponent(search)}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Search response:", data);
      return data;
    },
    enabled: showSearchResults,
  });

  const { data: trending, isLoading: isTrendingLoading } = useQuery<MovieSearchResponse>({
    queryKey: ["/api/movies/trending"],
    enabled: !showSearchResults,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-6">
                              <h1 className="text-4xl font-bold text-primary">MovieFlix</h1>
                            </div>
                            <SearchBar value={search} onChange={setSearch} />
          </CardContent>
        </Card>

        <h2 className="text-2xl font-semibold mb-4">
          {showSearchResults ? "Suchergebnisse" : "Aktuelle Filme"}
        </h2>

        {!showSearchResults && search.length > 0 && (
          <p className="text-muted-foreground mb-4">
            Geben Sie mindestens 2 Zeichen ein, um zu suchen
          </p>
        )}

        <MovieGrid 
          movies={showSearchResults ? searchResults?.results : trending?.results} 
          isLoading={showSearchResults ? isSearchLoading : isTrendingLoading} 
        />
      </div>
    </div>
  );
}
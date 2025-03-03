import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Globe2, Languages, CircleDollarSign, TrendingUp, Film, Download, Play, Quote, Tv, ShoppingCart } from "lucide-react";
import { getBackdropUrl, getProviderLogoUrl, formatCurrency, getLanguageName } from "@/lib/tmdb";
import type { WatchProviders, MovieWithProviders } from "@/lib/tmdb";
import type { SelectWatchlistMovie } from "@db/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MovieVersionComparison } from "@/components/movie-version-comparison";
import { WatchProvidersSection } from "@/components/movie/watch-providers-section";
import { InfoSection } from "@/components/movie/info-section";
import { CreditSection } from "@/components/movie/credit-section";
import { MovieHeader } from "@/components/movie/movie-header";
import { genreIcons } from "@/components/movie/genre-icons";
import React from 'react';

function hasWatchProviders(providers?: WatchProviders): boolean {
  if (!providers) return false;
  return !!(
    providers.flatrate?.length ||
    providers.free?.length ||
    providers.ads?.length ||
    providers.rent?.length ||
    providers.buy?.length
  );
}

export default function MovieDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const movieId = parseInt(id ?? '0');

  const { data: movie, isLoading } = useQuery<MovieWithProviders>({
    queryKey: [`/api/movies/${id}`],
  });

  const { data: nzbData, isLoading: isLoadingNzb } = useQuery({
    queryKey: [`/api/nzb/movies/${id}`],
    enabled: !!id,
  });

  // Update the queue status query to use hash instead of tmdbId
  const [selectedVersion, setSelectedVersion] = React.useState<Version | null>(null);
  const { data: queueStatus, isLoading: isQueueLoading } = useQuery<{ isInQueue: boolean; isProcessing: boolean; status?: string }>({
    queryKey: [`/api/nzb/check-queue/${selectedVersion?.hash || ''}`],
    enabled: !!selectedVersion?.hash,
    // Poll every 5 seconds to keep queue status updated
    refetchInterval: 5000,
  });

  // Get all unique hashes from versions
  const versionHashes = nzbData?.versions?.map(v => v.hash) || [];

  // Fetch S3 status for all versions at once with shorter interval when processing
  const s3Queries = useQueries({
    queries: versionHashes.map(hash => ({
      queryKey: [`/api/s3/status/${hash}`],
      queryFn: () => fetch(`/api/s3/status/${hash}`).then(res => res.json()),
      enabled: !!hash,
      // Kürzeres Abfrageintervall wenn gerade verarbeitet wird
      refetchInterval: queueStatus?.isProcessing ? 5000 : 10000,
    }))
  });

  // Create a map of hash to S3 status
  const s3StatusMap = Object.fromEntries(
    (nzbData?.versions || []).map((version, index) => [
      version.hash,
      s3Queries[index].data?.exists || false
    ])
  );


  const { data: watchlist } = useQuery<SelectWatchlistMovie[]>({
    queryKey: ["/api/watchlist"],
  });

  const isInWatchlist = watchlist?.some(item => item.movie_id === movieId);

  const addToWatchlist = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/watchlist", {
        movie_id: movieId,
        movie_title: movie?.title,
        poster_path: movie?.poster_path,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/watchlist/${movieId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const handleWatchlistClick = () => {
    if (isInWatchlist) {
      removeFromWatchlist.mutate();
    } else {
      addToWatchlist.mutate();
    }
  };

  const isWatchlistLoading = addToWatchlist.isPending || removeFromWatchlist.isPending;

  const downloadNzb = useMutation({
    mutationFn: async (hash: string) => {
      console.log('Attempting download with:', { hash, tmdbId: movieId });
      const response = await fetch('/api/nzb/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hash,
          tmdbId: movieId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download fehlgeschlagen');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Download gestartet",
        description: "Der Download wurde zu SABnzbd hinzugefügt.",
      });
      // Invalidate both S3 status and queue status queries after successful download
      queryClient.invalidateQueries({ queryKey: [`/api/s3/status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/nzb/check-queue`] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Download konnte nicht gestartet werden: " + error.message,
        variant: "destructive",
      });
    },
  });

  const downloadS3File = useMutation({
    mutationFn: async (hash: string) => {
      const year = movie?.release_date ? new Date(movie.release_date).getFullYear().toString() : '';
      const response = await fetch(`/api/s3/download/${hash}?title=${encodeURIComponent(movie?.title || '')}&year=${year}`);
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }
      const { url } = await response.json();
      window.location.href = url;
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Download fehlgeschlagen: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDownload = (hash: string) => {
    console.log('handleDownload called with hash:', hash);
    if (!hash) {
      toast({
        title: "Fehler",
        description: "Keine Hash-ID für den Download verfügbar",
        variant: "destructive",
      });
      return;
    }
    downloadNzb.mutate(hash);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background animate-in fade-in duration-500">
        <div className="w-full h-[40vh] relative bg-muted animate-pulse" />
        <div className="container mx-auto px-4 -mt-32 relative">
          <Card className="bg-card/95 backdrop-blur animate-in slide-in-from-bottom duration-500">
            <CardContent className="p-6">
              <Skeleton className="h-10 w-2/3 mb-4" />
              <div className="flex gap-4 mb-6">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="grid md:grid-cols-[300px,1fr] gap-8">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <div>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="min-h-screen bg-background">
      <div
        className="w-full h-[40vh] relative bg-cover bg-center animate-in fade-in duration-500"
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.8)), url(${getBackdropUrl(
            movie.backdrop_path,
          )})`,
        }}
      />

      <div className="container mx-auto px-4 -mt-32 relative max-w-[80%]">
        <Card className="bg-card/95 backdrop-blur animate-in slide-in-from-bottom duration-500">
          <CardContent className="p-6">
            <MovieHeader
              movie={movie}
              isInWatchlist={isInWatchlist}
              isWatchlistLoading={isWatchlistLoading}
              onWatchlistClick={handleWatchlistClick}
            />

            <div className="grid md:grid-cols-[300px,1fr] gap-8">
              <div className="space-y-4">
                <img
                  src={getBackdropUrl(movie.poster_path, "w342")}
                  alt={movie.title}
                  className="rounded-lg shadow-xl w-full animate-in fade-in-50 duration-500"
                />

                {(hasWatchProviders(movie.watch_providers) || nzbData) && (
                  <Card className="p-6 mb-4">
                    <h3 className="text-lg font-semibold mb-4">Verfügbarkeit</h3>
                    <div className="space-y-8 divide-y divide-border">
                      <WatchProvidersSection
                        title="Stream"
                        providers={movie.watch_providers?.flatrate}
                        icon={Play}
                      />
                      <WatchProvidersSection
                        title="Kostenlos mit Werbung"
                        providers={movie.watch_providers?.ads}
                        icon={Tv}
                      />
                      <WatchProvidersSection
                        title="Download"
                        providers={[]}
                        icon={Download}
                      >
                        {nzbData && nzbData.versions && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <MovieVersionComparison
                                versions={nzbData.versions}
                                s3StatusMap={s3StatusMap}
                                onDownloadNzb={handleDownload}
                                onDownloadS3={(hash) => downloadS3File.mutate(hash)}
                                isDownloading={downloadNzb.isPending || downloadS3File.isPending}
                                isInQueue={queueStatus?.isInQueue}
                                isProcessing={queueStatus?.isProcessing}
                                status={queueStatus?.status}
                                onVersionSelect={setSelectedVersion}
                                selectedVersion={selectedVersion}
                              />
                            </div>
                          </div>
                        )}
                      </WatchProvidersSection>
                      <WatchProvidersSection
                        title="Kaufen"
                        providers={movie.watch_providers?.buy}
                        icon={ShoppingCart}
                      />
                      <WatchProvidersSection
                        title="Leihen"
                        providers={movie.watch_providers?.rent}
                        icon={ShoppingCart}
                      />
                    </div>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Handlung</h3>
                  <p className="text-muted-foreground">{movie.overview}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {movie.original_title && movie.original_title !== movie.title && (
                    <InfoSection title="Originaltitel" icon={Quote}>
                      {movie.original_title}
                    </InfoSection>
                  )}
                  {movie.original_language && (
                    <InfoSection title="Originalsprache" icon={Languages}>
                      {getLanguageName(movie.original_language)}
                    </InfoSection>
                  )}
                  {movie.production_countries && movie.production_countries.length > 0 && (
                    <InfoSection title="Produktionsländer" icon={Globe2}>
                      {movie.production_countries.map(country => country.name).join(", ")}
                    </InfoSection>
                  )}
                  {movie.budget !== 0 && (
                    <InfoSection title="Budget" icon={CircleDollarSign}>
                      {formatCurrency(movie.budget!)}
                    </InfoSection>
                  )}
                  {movie.revenue !== 0 && (
                    <InfoSection title="Einnahmen" icon={TrendingUp}>
                      {formatCurrency(movie.revenue!)}
                    </InfoSection>
                  )}
                </div>

                {movie.production_companies && movie.production_companies.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4" />
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Produktionsfirmen
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      {movie.production_companies.map((company) => (
                        <div
                          key={company.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          {company.logo_path ? (
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1">
                              <img
                                src={getProviderLogoUrl(company.logo_path)}
                                alt={company.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                          <span>{company.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {movie.genres && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Film className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Genres
                      </h3>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      {movie.genres.map((genre) => {
                        const GenreIcon = genreIcons[genre.name] || genreIcons.default;
                        return (
                          <div
                            key={genre.id}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground"
                          >
                            <GenreIcon className="w-4 h-4" />
                            <span>{genre.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {movie.credits && (
                  <div className="space-y-6">
                    <CreditSection
                      title="Besetzung"
                      credits={movie.credits.cast.slice(0, 10)}
                      role="cast"
                    />
                    <CreditSection
                      title="Crew"
                      credits={movie.credits.crew.filter(
                        person => ["Director", "Producer", "Screenplay", "Story"].includes(person.job || "")
                      )}
                      role="crew"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, Download, Loader2, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Version {
  hash: string;
  resolution: string;
  size?: number;
  source?: string;
}

interface MovieVersionComparisonProps {
  versions: Version[];
  s3StatusMap: Record<string, boolean>;
  onDownloadNzb: (hash: string) => void;
  onDownloadS3: (hash: string) => void;
  isDownloading: boolean;
  isInQueue?: boolean;
  isProcessing?: boolean;
  status?: string;
  selectedVersion: Version | null;
  onVersionSelect: (version: Version) => void;
}

export function MovieVersionComparison({
  versions,
  s3StatusMap,
  onDownloadNzb,
  onDownloadS3,
  isDownloading,
  isInQueue = false,
  isProcessing = false,
  status = "",
  selectedVersion,
  onVersionSelect,
}: MovieVersionComparisonProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (open && versions.length > 0 && !selectedVersion) {
      onVersionSelect(versions[0]);
    }
  }, [open, versions, selectedVersion, onVersionSelect]);

  const downloadStatusQueries = useQueries({
    queries: versions.map((version) => ({
      queryKey: [`/api/download-status/${version.hash}`],
      enabled: open,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
      staleTime: 0,
    })),
  });

  const formatSize = (size?: number) => {
    if (!size) return "Unbekannt";
    const units = ["B", "KB", "MB", "GB"];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
  };

  const isValidPersistentStatus = (status?: string): boolean => {
    if (!status) return false;
    return ["processing", "downloading", "extracting", "failed", "queued", "running"].includes(status);
  };

  const getButtonVariant = (
    isS3: boolean,
    status: string,
    isInQueue: boolean,
    persistentStatus?: string,
  ) => {
    if (isS3) return "success";
    if (status === "failed" || persistentStatus === "failed") return "destructive";
    if (isInQueue || persistentStatus === "downloading" || persistentStatus === "queued" || persistentStatus === "running") return "nzb-active";
    return "ghost";
  };

  const getButtonText = (
    isS3: boolean,
    status: string,
    isProcessing: boolean,
    isInQueue: boolean,
    isDownloading: boolean,
    persistentStatus?: string,
  ) => {
    if (isS3) return "Von S3 laden";
    if (isDownloading) return "Vorbereitung...";
    if (status === "failed" || persistentStatus === "failed") return "Download fehlgeschlagen";
    if (isProcessing || persistentStatus === "extracting") return "Wird gerade entpackt";
    if (persistentStatus === "queued") return "In Warteschlange";
    if (persistentStatus === "running") return "Wird heruntergeladen";
    if (isInQueue || persistentStatus === "downloading") return "Wird heruntergeladen";
    if (persistentStatus === "processing") return "In Bearbeitung";
    return "Von NZB laden";
  };

  const getButtonIcon = (
    isS3: boolean,
    status: string,
    isProcessing: boolean,
    isInQueue: boolean,
    isDownloading: boolean,
    persistentStatus?: string,
    isLoading?: boolean,
  ) => {
    if (isLoading) return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
    if (isS3) return <Check className="h-4 w-4 mr-2" />;
    if (isDownloading || persistentStatus === "processing") return <Loader2 className="h-4 w-4 animate-spin" />;
    if (status === "failed" || persistentStatus === "failed" || isProcessing || isInQueue || persistentStatus === "queued" || persistentStatus === "running") return <AlertCircle className="h-4 w-4 mr-2" />;
    return <Download className="h-4 w-4 mr-2" />;
  };

  const getTooltipText = (
    status: string,
    isProcessing: boolean,
    persistentStatus?: string,
  ) => {
    if (status === "failed" || persistentStatus === "failed") return "Der letzte Download ist fehlgeschlagen. Versuchen Sie es erneut.";
    if (isProcessing || persistentStatus === "extracting") return "Der Film wird gerade vom Sabnzbd-Server verarbeitet";
    if (persistentStatus === "processing") return "Der Download wird vorbereitet";
    if (persistentStatus === "queued") return "Der Film befindet sich in der Download-Warteschlange";
    if (persistentStatus === "running") return "Der Film wird gerade heruntergeladen";
    return "Der Film befindet sich bereits in der Download-Warteschlange";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Versionen vergleichen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Verfügbare Versionen</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Auflösung</TableHead>
              <TableHead>Größe</TableHead>
              <TableHead>Quelle</TableHead>
              <TableHead>Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version, index) => {
              const isCurrentVersion = selectedVersion?.hash === version.hash;
              const persistentStatus = downloadStatusQueries[index]?.data?.status;
              const effectivePersistentStatus = isValidPersistentStatus(persistentStatus) ? persistentStatus : undefined;
              const isLoading = downloadStatusQueries[index]?.isLoading;

              const versionStatus = isCurrentVersion ? status : "";
              const versionIsInQueue = isCurrentVersion && isInQueue;
              const versionIsProcessing = isCurrentVersion && isProcessing;
              const versionIsDownloading = isCurrentVersion && isDownloading;

              // Nur NZB-Downloads deaktivieren, S3-Downloads bleiben aktiv
              const isCurrentVersionDisabled = !s3StatusMap[version.hash] && (
                (isCurrentVersion && isDownloading) ||
                ((versionIsInQueue || versionIsProcessing) && !s3StatusMap[version.hash]) ||
                effectivePersistentStatus === "processing" ||
                effectivePersistentStatus === "downloading" ||
                effectivePersistentStatus === "extracting" ||
                effectivePersistentStatus === "failed" ||
                effectivePersistentStatus === "queued" ||
                effectivePersistentStatus === "running"
              );

              return (
                <TableRow key={version.hash}>
                  <TableCell>{version.resolution}</TableCell>
                  <TableCell>{formatSize(version.size)}</TableCell>
                  <TableCell>
                    {s3StatusMap[version.hash] ? "S3 Storage" : "NZB"}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={getButtonVariant(
                              s3StatusMap[version.hash],
                              versionStatus,
                              versionIsInQueue,
                              effectivePersistentStatus,
                            )}
                            size="sm"
                            onClick={() => {
                              // Verhindere Klicks auf fehlgeschlagene Downloads
                              if (effectivePersistentStatus === "failed" && !s3StatusMap[version.hash]) {
                                return;
                              }
                              onVersionSelect(version);
                              if (s3StatusMap[version.hash]) {
                                onDownloadS3(version.hash);
                              } else {
                                onDownloadNzb(version.hash);
                              }
                            }}
                            disabled={isCurrentVersionDisabled || isLoading}
                          >
                            {getButtonIcon(
                              s3StatusMap[version.hash],
                              versionStatus,
                              versionIsProcessing,
                              versionIsInQueue,
                              versionIsDownloading,
                              effectivePersistentStatus,
                              isLoading
                            )}
                            {isLoading ? "Status prüfen..." : getButtonText(
                              s3StatusMap[version.hash],
                              versionStatus,
                              versionIsProcessing,
                              versionIsInQueue,
                              versionIsDownloading,
                              effectivePersistentStatus,
                            )}
                          </Button>
                        </TooltipTrigger>
                        {((versionIsInQueue || versionIsProcessing || versionStatus === "failed" || effectivePersistentStatus) && !s3StatusMap[version.hash]) && (
                          <TooltipContent>
                            <p>
                              {getTooltipText(versionStatus, versionIsProcessing, effectivePersistentStatus)}
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
import { Play, Tv, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getProviderLogoUrl } from "@/lib/tmdb";

interface WatchProvidersSectionProps {
  title: string;
  providers?: Array<{ provider_name: string; logo_path: string }>;
  icon: LucideIcon;
  children?: React.ReactNode;
}

export function WatchProvidersSection({
  title,
  providers,
  icon: Icon,
  children,
}: WatchProvidersSectionProps) {
  if (!providers?.length && !children) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {providers?.map((provider) => (
          <TooltipProvider key={provider.provider_name}>
            <Tooltip>
              <TooltipTrigger>
                <img
                  src={getProviderLogoUrl(provider.logo_path)}
                  alt={provider.provider_name}
                  className="w-8 h-8 rounded-lg shadow-sm transition-transform hover:scale-105"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{provider.provider_name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {children}
      </div>
    </div>
  );
}

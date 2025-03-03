import { Users } from "lucide-react";
import { getProfileUrl } from "@/lib/tmdb";
import type { MovieCredit } from "@/lib/tmdb";

interface CreditSectionProps {
  title: string;
  credits: MovieCredit[];
  role: "cast" | "crew";
}

export function CreditSection({ title, credits, role }: CreditSectionProps) {
  if (!credits?.length) return null;

  // Zusammenfassen von doppelten Einträgen für Crew-Mitglieder
  const uniqueCredits = role === "crew"
    ? credits.reduce((acc, current) => {
      const existingPerson = acc.find(p => p.id === current.id);
      if (existingPerson) {
        existingPerson.job = `${existingPerson.job}, ${current.job}`;
        return acc;
      }
      return [...acc, current];
    }, [] as MovieCredit[])
    : credits;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {uniqueCredits.map((person) => (
          <div key={`${person.id}-${role}`} className="flex flex-col">
            <div className="aspect-[2/3] mb-2 bg-muted rounded-lg overflow-hidden">
              <img
                src={getProfileUrl(person.profile_path)}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium line-clamp-1">{person.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {role === "cast" ? person.character : person.job}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

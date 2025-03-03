import {
  Sword,
  Rabbit,
  Baby,
  Laugh,
  Skull,
  Video,
  Drama,
  Heart,
  Ghost,
  History as HistoryIcon,
  Music,
  Rocket,
  Tv,
  Bomb,
  Flag,
  Film
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const genreIcons: Record<string, LucideIcon> = {
  "Action": Sword,
  "Abenteuer": Rabbit,
  "Animation": Baby,
  "Komödie": Laugh,
  "Krimi": Skull,
  "Dokumentarfilm": Video,
  "Drama": Drama,
  "Familie": Heart,
  "Fantasy": Ghost,
  "Historie": HistoryIcon,
  "Horror": Skull,
  "Musik": Music,
  "Mystery": Ghost,
  "Romanze": Heart,
  "Science Fiction": Rocket,
  "TV-Film": Tv,
  "Thriller": Bomb,
  "Kriegsfilm": Flag,
  // Fallback for unknown genres
  "default": Film
};

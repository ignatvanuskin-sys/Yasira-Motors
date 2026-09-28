import { Star } from "lucide-react";

export function Stars({
  value = 5,
  className = "h-4 w-4",
  gap = "gap-0.5",
}: {
  value?: number;
  className?: string;
  gap?: string;
}) {
  return (
    <span className={`inline-flex items-center ${gap}`} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${className} ${i <= value ? "fill-gold-400 text-gold-400" : "text-night-700"}`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

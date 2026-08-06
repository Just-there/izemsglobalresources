import { scorePassword } from "@/lib/password";
import { cn } from "@/lib/utils";

/** Visual password strength meter with a live hint. */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color, hints } = scorePassword(password);
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < score ? color : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="mt-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        {hints[0] && <span className="text-muted-foreground">{hints[0]}</span>}
      </p>
    </div>
  );
}

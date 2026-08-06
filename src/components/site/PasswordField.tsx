import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordFieldProps = React.ComponentProps<typeof Input> & {
  /** Accessible label used to build the toggle's aria-label. */
  toggleLabel?: string;
};

/**
 * Password input with a show/hide toggle. Disables mobile auto-capitalization,
 * autocorrect and spellcheck so a manually typed password matches exactly.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, toggleLabel = "password", ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? `Hide ${toggleLabel}` : `Show ${toggleLabel}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          tabIndex={-1}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);
PasswordField.displayName = "PasswordField";

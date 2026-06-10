import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateInputProps {
  id?: string;
  value?: string; // YYYY-MM-DD
  onChange?: (value: string) => void; // YYYY-MM-DD
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function digitsToISO(digits: string): string {
  if (digits.length < 8) return "";
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return `${y}-${m}-${d}`;
}

function formatDisplay(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export function DateInput({
  id,
  value = "",
  onChange,
  className,
  placeholder = "DD/MM/AAAA",
  disabled,
}: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToDisplay(value));
  const nativeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplay(isoToDisplay(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    const formatted = formatDisplay(digits);
    setDisplay(formatted);
    if (digits.length === 8) {
      onChange?.(digitsToISO(digits));
    } else {
      onChange?.("");
    }
  }

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const iso = e.target.value; // YYYY-MM-DD
    setDisplay(isoToDisplay(iso));
    onChange?.(iso);
  }

  function openPicker() {
    const el = nativeRef.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      el.click();
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background/70 px-3 py-1 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-muted/35",
          className,
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={openPicker}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:pointer-events-none"
      >
        <CalendarDays className="h-4 w-4" />
      </button>
      {/* Input nativo oculto — solo para el picker del calendario */}
      <input
        ref={nativeRef}
        type="date"
        value={value}
        onChange={handleNativeChange}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
      />
    </div>
  );
}

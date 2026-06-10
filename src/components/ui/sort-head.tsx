import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import type { SortDir } from "@/hooks/useSortable";

interface Props {
  label: string;
  sortKey: string;
  col: string | null;
  dir: SortDir;
  onSort: (key: string) => void;
  className?: string;
}

export function SortHead({ label, sortKey, col, dir, onSort, className }: Props) {
  const active = col === sortKey;
  return (
    <TableHead
      className={`cursor-pointer select-none ${className ?? ""}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        {label}
        {active
          ? dir === "asc"
            ? <ChevronUp className="h-3 w-3 shrink-0" />
            : <ChevronDown className="h-3 w-3 shrink-0" />
          : <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-30" />}
      </span>
    </TableHead>
  );
}

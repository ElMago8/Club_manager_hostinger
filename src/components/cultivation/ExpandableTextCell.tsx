import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ExpandableTextCellProps = {
  title: string;
  text?: string | null;
  emptyLabel?: string;
  className?: string;
};

export function ExpandableTextCell({
  title,
  text,
  emptyLabel = "-",
  className = "max-w-[260px]",
}: ExpandableTextCellProps) {
  const [open, setOpen] = useState(false);
  const trimmedText = text?.trim();

  if (!trimmedText) {
    return <span className="text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <>
      <button
        type="button"
        className={[
          "mx-auto block cursor-pointer truncate text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline",
          className,
        ].join(" ")}
        title="Ver contenido completo"
        onClick={() => setOpen(true)}
      >
        {trimmedText}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Contenido completo del registro seleccionado.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {trimmedText}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

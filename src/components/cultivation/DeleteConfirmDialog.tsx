import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteConfirmDialogProps = {
  open: boolean;
  entityLabel: string;
  itemName?: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function DeleteConfirmDialog({
  open,
  entityLabel,
  itemName,
  description,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-border bg-background shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar {entityLabel}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ??
              `Estas por eliminar ${itemName ? `"${itemName}"` : "este registro"}. Esta accion no se puede deshacer.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => void onConfirm()}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

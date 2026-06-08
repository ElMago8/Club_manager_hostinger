import { AlertTriangle } from "lucide-react";

type RelationshipWarningProps = {
  message: string;
  className?: string;
};

export function isRelationshipWarning(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("no se puede") ||
    normalized.includes("relacionad") ||
    normalized.includes("reasigna") ||
    normalized.includes("asociad")
  );
}

export function RelationshipWarning({ message, className = "" }: RelationshipWarningProps) {
  return (
    <div
      className={[
        "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive",
        className,
      ].join(" ")}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

export function CultivationStatusMessage({ message }: { message: string }) {
  if (isRelationshipWarning(message)) {
    return <RelationshipWarning message={message} />;
  }

  return <p className="text-sm text-muted-foreground">{message}</p>;
}

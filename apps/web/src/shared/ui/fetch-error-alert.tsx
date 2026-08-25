import { Alert, AlertDescription } from "@/shared/ui/shadcn/alert";

/** Dismissible fetch error banner. Shows nothing when error is null. */
export function FetchErrorAlert({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

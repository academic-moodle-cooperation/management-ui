import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@oc-mui/ui/components";

import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
}

export const StatCard = ({ label, value, hint }: StatCardProps) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription>{label}</CardDescription>
      <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
    </CardHeader>
    {hint ? <CardContent className="text-sm text-muted-foreground">{hint}</CardContent> : null}
  </Card>
);

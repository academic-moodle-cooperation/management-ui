// PREVIEW ONLY: a mock course-bound variant so the chooser can be seen on the
// test box before an org plugin ships a real one. Lives on the `preview`
// branch, never in a PR.
import { useState } from "react";

import type { CreateSeriesVariantProps } from "@oc-mui/plugin-core";
import {
  Button,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@oc-mui/ui/components";

const COURSES = [
  { id: "250011", number: "250011", title: "Analysis I", term: "2026W" },
  { id: "250042", number: "250042", title: "Lineare Algebra", term: "2026W" },
  { id: "250077", number: "250077", title: "Einführung in die Informatik", term: "2026W" },
];

export const DemoCourseVariant = ({ onCreated, onCancel }: CreateSeriesVariantProps) => {
  const [picked, setPicked] = useState<string | null>(null);
  const course = COURSES.find((c) => c.id === picked);

  return (
    <>
      <DialogHeader>
        <DialogTitle>LV-Serie anlegen (Demo)</DialogTitle>
        <DialogDescription>
          Wählen Sie die Lehrveranstaltung. Titel und Semester werden übernommen. Diese
          Demo legt nichts an.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 py-2">
        {!course &&
          COURSES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setPicked(c.id)}
              className="flex items-center justify-between rounded-md border border-border p-3 text-left hover:bg-accent"
            >
              <span className="font-medium">{c.title}</span>
              <span className="text-sm text-muted-foreground">
                {c.number} · {c.term}
              </span>
            </button>
          ))}
        {course && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="demo-title">Titel</Label>
              <Input id="demo-title" value={course.title} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="demo-term">Semester</Label>
              <Input id="demo-term" value={course.term} disabled />
            </div>
          </>
        )}
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button disabled={!course} onClick={() => onCreated(`demo-${picked}`)}>
          Anlegen
        </Button>
      </DialogFooter>
    </>
  );
};

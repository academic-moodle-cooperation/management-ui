import { useI18n } from "@oc-mui/i18n";
import { PageShell } from "@oc-mui/ui/components";

import { SeriesTable } from "./components/SeriesTable";

import "./index.css";

export const App = () => {
  const { t } = useI18n();

  return (
    <PageShell title={t("common:series")}>
      <SeriesTable />
    </PageShell>
  );
};

export default App;

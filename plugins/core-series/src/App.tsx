import { useI18n } from "@oc-mui/i18n";
import { PageShell } from "@oc-mui/ui/components";

import { CreateSeriesAction } from "./components/CreateSeriesAction";
import { SeriesTable } from "./components/SeriesTable";
import { seriesConfig } from "./config";

import "./index.css";

export const App = () => {
  const { t } = useI18n();
  const cfg = seriesConfig.use();
  const placement = cfg.seriesTable?.createSeries?.placement ?? "heading";

  return (
    <PageShell
      title={t("common:series")}
      {...(placement === "heading" && { actions: <CreateSeriesAction /> })}
    >
      <SeriesTable />
    </PageShell>
  );
};

export default App;

import { useI18n } from "@oc-mui/i18n";
import { useParams } from "@oc-mui/router";
import { PageShell } from "@oc-mui/ui/components";

import { EpisodesTable } from "./components/EpisodesTable";
import { useSeriesName } from "./hooks/useSeriesName";

import "./index.css";

export const App = () => {
  const { t } = useI18n();
  const { routeSubPath: seriesId } = useParams({ strict: false });
  const seriesTitle = useSeriesName(seriesId);

  const getHeading = () => {
    if (!seriesTitle) return t("common:episodes");
    return `${t("common:episodes")} / ${seriesTitle}`;
  };

  return (
    <PageShell title={getHeading()}>
      <EpisodesTable seriesId={seriesId} />
    </PageShell>
  );
};

export default App;

import { useI18n } from "@oc-mui/i18n";
import { useParams } from "@oc-mui/router";
import { AppHeading, Container, Separator } from "@oc-mui/ui/components";

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
    <Container className="p-8">
      <Container className="flex items-center justify-between space-y-2">
        <AppHeading heading={getHeading()} description="" />
      </Container>
      <Separator className="mt-4 mb-8" />
      <EpisodesTable seriesId={seriesId} />
    </Container>
  );
};

export default App;

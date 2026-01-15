import { useI18n } from "@workspace/i18n";
import { useGetSeriesNameByIdQuery } from "@workspace/query";
import { useParams } from "@workspace/router";
import { AppHeading, Separator, Container } from "@workspace/ui/components";

import { EpisodesTable } from "./components/EpisodesTable";

import "./index.css";

export const App = () => {
  const { t } = useI18n();
  const { routeSubPath: seriesId } = useParams({ strict: false });
  const { data } = useGetSeriesNameByIdQuery({ seriesId: seriesId || "" });
  const seriesTitle = data?.seriesById?.title;

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

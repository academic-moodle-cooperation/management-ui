import { useI18n } from "@oc-mui/i18n";
import { AppHeading, Separator, Container } from "@oc-mui/ui/components";

import { SeriesTable } from "./components/SeriesTable";

import "./index.css";

export const App = () => {
  const { t } = useI18n();

  return (
    <Container className="p-8">
      <Container className="flex items-center justify-between space-y-2">
        <AppHeading heading={t("common:series")} description="" />
      </Container>
      <Separator className="mt-4 mb-8" />
      <SeriesTable />
    </Container>
  );
};

export default App;

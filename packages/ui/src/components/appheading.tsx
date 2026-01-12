import { FC } from "react";

interface AppHeadingProps {
  heading: string;
  description?: string;
}

const AppHeading: FC<AppHeadingProps> = ({ heading, description }) => {
  return (
    <div className="space-y-1">
      <h2 className="text-2xl/[2.25rem] font-semibold -tracking-4 md:text-3xl/[3.625rem]">
        {heading}
      </h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
};

export { AppHeading };

import { cn } from "@workspace/ui/lib/utils";

const AppLoader = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
  return (
    <section
      className={cn(
        "fixed top-0 left-0 right-0 w-auto h-full z-[9999] flex flex-col justify-center items-center bg-transparent opacity-80",
        className,
      )}
    >
      <div className="flex justify-center">
        <div
          className="w-4 h-4 mx-0.5 bg-primary rounded-full animate-bouncing-loader"
          style={{ animationDelay: "0s" }}
        ></div>
        <div
          className="w-4 h-4 mx-0.5 bg-primary rounded-full animate-bouncing-loader"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="w-4 h-4 mx-0.5 bg-primary rounded-full animate-bouncing-loader"
          style={{ animationDelay: "0.4s" }}
        ></div>
      </div>
      {children}
    </section>
  );
};

export { AppLoader };

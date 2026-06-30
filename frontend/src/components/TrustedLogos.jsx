import { PLATFORM_LOGOS } from "../data/platformLogos";

export default function TrustedLogos() {
  return (
    <section className="bg-background py-stack-lg">
      <div className="container mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
        <h2 className="mb-stack-md text-center font-headline-lg text-headline-lg text-on-background">
          Used by freelancers who work on
        </h2>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-gutter md:gap-stack-md">
          {PLATFORM_LOGOS.map((logo) => (
            <div
              key={logo.name}
              className="flex h-4 items-center md:h-5"
              title={logo.name}
              aria-label={logo.name}
              style={{ filter: "none" }}
              dangerouslySetInnerHTML={{ __html: logo.svg }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

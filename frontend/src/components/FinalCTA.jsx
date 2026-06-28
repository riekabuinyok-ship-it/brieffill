import { Link } from "react-router-dom";
import Button from "./Button";

export default function FinalCTA() {
  return (
    <section className="bg-surface-container-low py-12 md:py-16">
      <div className="container mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
        <div className="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-container/30 to-secondary-container/20 p-stack-lg text-center md:p-16">
          <h2 className="font-headline-lg text-headline-lg mb-4 text-on-background">
            Ready to stop guessing?
          </h2>
          <p className="mb-stack-md text-body-lg text-on-surface-variant">
            Start your first brief — free. No credit card required.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button as="a" to="/register" size="lg" iconRight="arrow_forward">
              Start Analyzing Your First Brief
            </Button>
            <Link
              to="/pricing"
              className="rounded-lg px-4 py-2 text-sm font-medium text-primary hover:underline"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

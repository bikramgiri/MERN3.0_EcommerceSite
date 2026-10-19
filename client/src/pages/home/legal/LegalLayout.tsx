import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../../../global/Breadcrumb";
import { useStoreSettings } from "../../../services/storeSettingsService";
import usePageTitle from "../../../hooks/usePageTitle";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalLayoutProps {
  title: string;
  intro: ReactNode;
  lastUpdated: string;
  sections: LegalSection[];
}

/** Shared layout for policy pages: title, contents list and readable sections */
const LegalLayout = ({ title, intro, lastUpdated, sections }: LegalLayoutProps) => {
  const { supportEmail, supportPhone } = useStoreSettings();
  usePageTitle(title);

  return (
    <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumb items={[{ label: title }]} />

        <header className="max-w-3xl">
          <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-[#1A1613]/60">Last updated: {lastUpdated}</p>
          <div className="mt-4 leading-relaxed text-[#1A1613]/80">{intro}</div>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1A1613]/50">
                On this page
              </p>
              <ol className="space-y-2 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-[#1A1613]/70 transition-colors hover:text-[#E6540B]"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="max-w-3xl space-y-10">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold">
                  {index + 1}. {section.title}
                </h2>
                <div className="mt-3 space-y-3 leading-relaxed text-[#1A1613]/80 [&_a]:font-medium [&_a]:text-[#E6540B] [&_a:hover]:underline [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                  {section.content}
                </div>
              </section>
            ))}

            <div className="rounded-xl border border-[#1A1613]/10 bg-white p-5 sm:p-6">
              <h2 className="font-semibold">Questions?</h2>
              <p className="mt-1 text-sm text-[#1A1613]/70">
                Contact us at{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="font-medium text-[#E6540B] hover:underline"
                >
                  {supportEmail}
                </a>
                {supportPhone && <> or call {supportPhone}</>}. You can also read
                our{" "}
                <Link to="/faq" className="font-medium text-[#E6540B] hover:underline">
                  FAQ
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalLayout;

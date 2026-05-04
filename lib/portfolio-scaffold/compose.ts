import { buildScaffold, type ScaffoldFile } from "./files";
import {
  buildComponentFiles,
  buildDataModule,
  buildPreviewHtml,
  type PortfolioContent,
} from "./templates";

export type ComposedPortfolio = {
  files: ScaffoldFile[];
  previewHtml: string;
};

export function composePortfolio(opts: {
  projectName: string;
  title: string;
  content: PortfolioContent;
}): ComposedPortfolio {
  const scaffold = buildScaffold({
    projectName: opts.projectName,
    title: opts.title,
    theme: opts.content.theme,
  });
  const components = buildComponentFiles();
  const dataFile: ScaffoldFile = {
    path: "app/data.ts",
    content: buildDataModule(opts.content),
  };
  const previewHtml = buildPreviewHtml(opts.content);

  return {
    files: [...scaffold, dataFile, ...components],
    previewHtml,
  };
}

export type { PortfolioContent } from "./templates";

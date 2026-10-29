export type FieldCapture = {
  name: string;
  type: string;
  label: string;
};

export type FormCapture = {
  method: string;
  action: string;
  fields: FieldCapture[];
};

export type LinkCapture = {
  text: string;
  href: string;
};

export type ClickCapture = {
  text: string;
  href: string;
  to: string;
  note: string;
};

export type PageCapture = {
  url: string;
  title: string;
  status: number | null;
  headings: string[];
  nav: string[];
  buttons: string[];
  links: LinkCapture[];
  forms: FormCapture[];
  paths: string[];
  clicks: ClickCapture[];
  screenshotFile: string;
  error: string | null;
};

export type Feature = {
  name: string;
  description: string;
  pageUrl: string;
  foundBy: string;
};

export type FeatureArea = {
  name: string;
  features: Feature[];
};

export type Project = {
  id: string;
  url: string;
  description: string;
  createdAt: string;
  summary: string;
  areas: FeatureArea[];
  pages: PageCapture[];
  llmError: string | null;
};

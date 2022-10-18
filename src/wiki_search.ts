import wiki, { imageResult } from "wikipedia";

export type WikiDetails = {
  summary: string;
  images: imageResult[];
  fullUrl: string;
};

export const getSummary = async (phrase: string): Promise<WikiDetails> => {
  const page = await wiki.page(phrase);
  const summary = (await page.summary()).extract;
  const images = await page.images();
  const fullUrl = page.fullurl;
  return {
    summary: summary,
    images: images,
    fullUrl: fullUrl,
  };
};

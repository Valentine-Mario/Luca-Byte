import wiki from "wikipedia";

export const getSummary = async (phrase: string) => {
  const page = await wiki.page(phrase);
  const summary = (await page.summary()).extract;
  const images= await page.images();
  const fullUrl=await page.fullurl;
  return [summary, images, fullUrl]
};

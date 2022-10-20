import wiki, { imageResult } from "wikipedia";
import { setItemInRedis, getItemInRedis } from "./lib";

export type WikiDetails = {
  summary: string;
  images: imageResult[] | string[];
  fullUrl: string;
  inCache: boolean;
};

export const getSummary = async (phrase: string): Promise<WikiDetails> => {
  //get item from redis cache
  let cached_tweet = await getItemInRedis(phrase);

  if (cached_tweet !== null) {
    console.log("using cache...")
    let summary = await getItemInRedis(phrase);
    let imgs = await getItemInRedis(`${phrase}-img`);
    let fullUrl = await getItemInRedis(`${phrase}-fullUrl`);
    let images = JSON.parse(imgs!);
    return {
      summary: summary!,
      images: images!,
      fullUrl: fullUrl!,
      inCache: true,
    };
  } else {
    const page = await wiki.page(phrase);
    const summary = (await page.summary()).extract;
    const images = await page.images();
    const fullUrl = page.fullurl;

    //set item in redis cache
    //Todo: make this a bg job
    //set summary
    await setItemInRedis(phrase, summary, 60 * 60 * 24 * 7);
    //set source
    await setItemInRedis(`${phrase}-fullUrl`, fullUrl, 60 * 60 * 24 * 7);

    return {
      summary: summary,
      images: images,
      fullUrl: fullUrl,
      inCache: false,
    };
  }
};

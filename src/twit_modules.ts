import {
  ETwitterStreamEvent,
  EUploadMimeType,
  TwitterApi,
} from "twitter-api-v2";
import { imageResult } from "wikipedia/dist/resultTypes";
import { getBuffer } from "./lib";
import { getSummary } from "./wiki_search";

const BOT_NAME = "ByteLuca";

export const ExecBot = async (client: TwitterApi, client2: TwitterApi) => {
  // Get and delete old rules if needed
  const rules = await client.v2.streamRules();
  if (rules.data?.length) {
    await client.v2.updateStreamRules({
      delete: { ids: rules.data.map((rule) => rule.id) },
    });
  }
  // Add our rules
  await client.v2.updateStreamRules({
    add: [{ value: "@" + BOT_NAME }],
  });
  const stream = await client.v2.searchStream({
    "tweet.fields": ["referenced_tweets", "author_id"],
    expansions: ["referenced_tweets.id"],
  });
  // Enable auto reconnect
  stream.autoReconnect = true;

  //get bot details
  const bot = await client2.readOnly.v2.userByUsername(BOT_NAME);

  stream.on(ETwitterStreamEvent.Data, async (tweet) => {
    console.log(tweet.data.text);
    const text = tweet.data.text;

    if (!text.toLowerCase().includes("search")) {
      // do not reply
      // await replyTweet(client2, "invalid search request", tweet.data.id, "");
    } else {
      const search_phrase = text.match(/[search|get]\s+(.*)/i)![1];
      const { summary, images, fullUrl } = await getSummary(
        search_phrase
      );
      // Ignore RTs or self-sent tweets
      const isARt =
        tweet.data.referenced_tweets?.some(
          (tweet) => tweet.type === "retweeted"
        ) ?? false;

      if (isARt || tweet.data.author_id === bot.data.id) {
        return;
      }

      const filtered = images.filter(
        (x) =>
          get_url_extension(x.url) === "jpg" ||
          get_url_extension(x.url) === "jpeg"
      );

      if (filtered.length > 0) {
        await replyTweetWithImg(
          client2,
          filtered.slice(0, 4),
          summary.slice(0, 200),
          tweet.data.id,
          `\nSource: ${fullUrl}`
        );
      } else {
        // Reply to tweet
        await replyTweet(
          client2,
          summary.slice(0, 200),
          tweet.data.id,
          `\nSource: ${fullUrl}`
        );
      }
    }
  });
};

const replyTweet = async (
  client: TwitterApi,
  text: string,
  id: string,
  source: string
) => {
  await client.v1.reply(text + source, id);
};

const replyTweetWithImg = async (
  client: TwitterApi,
  urls: imageResult[],
  text: string,
  id: string,
  source: string
) => {
  let arry = [];
  let uploaded_media = [];

  for (let i of urls) {
    arry.push(getBuffer(i.url));
  }

  let resolved_buffer = await Promise.all(arry);

  for (let buf of resolved_buffer) {
    uploaded_media.push(
      client.v1.uploadMedia(buf, { mimeType: EUploadMimeType.Jpeg })
    );
  }

  let resolved_media = await Promise.all(uploaded_media);
  await client.v2.reply(text + source, id, {
    media: { media_ids: resolved_media },
  });
};

function get_url_extension(url: string) {
  return url.split(/[#?]/)[0].split(".").pop()!.trim();
}

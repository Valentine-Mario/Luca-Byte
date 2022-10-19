import {
  ETwitterStreamEvent,
  EUploadMimeType,
  TweetV1,
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
      const { summary, images, fullUrl } = await getSummary(search_phrase);
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

      await replyTweetWithImg(
        client2,
        filtered.slice(0, 4),
        summary,
        tweet.data.id,
        `\nSource: ${fullUrl}`
      );
    }
  });
};

const replyTweet = async (
  client: TwitterApi,
  text: string,
  id: string
): Promise<TweetV1> => {
  let tweet = await client.v1.reply(text, id);
  return tweet;
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
  //limit tweet to 200 charachters
  let all_text = text + "\n\n" + source;
  let subStringLenth = all_text.length / 200;
  let string_partition = divideEqual(all_text, Math.ceil(subStringLenth));

  if (resolved_media.length > 0) {
    let init_tweet = await client.v2.reply(string_partition[0], id, {
      media: { media_ids: resolved_media },
    });
    string_partition.shift();
    for (let i of string_partition) {
      await replyTweet(client, i, init_tweet.data.id);
    }
  } else {
    let init_tweet = await replyTweet(client, string_partition[0], id);
    string_partition.shift();
    for (let i of string_partition) {
      await replyTweet(client, i, init_tweet.id_str);
    }
  }
};

function get_url_extension(url: string) {
  return url.split(/[#?]/)[0].split(".").pop()!.trim();
}

export const divideEqual = (str: string, num: number): string[] => {
  const len = str.length / num;
  const creds = str.split("").reduce(
    (acc: any, val) => {
      let { res, currInd } = acc;
      if (!res[currInd] || res[currInd].length < len) {
        res[currInd] = (res[currInd] || "") + val;
      } else {
        res[++currInd] = val;
      }
      return { res, currInd };
    },
    {
      res: [],
      currInd: 0,
    }
  );
  return creds.res;
};

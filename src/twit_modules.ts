import {
  ETwitterStreamEvent,
  EUploadMimeType,
  TweetV1,
  TweetV2SingleStreamResult,
  TwitterApi,
  UserV2Result,
} from "twitter-api-v2";
import { imageResult } from "wikipedia/dist/resultTypes";
import {
  getBuffer,
  get_url_extension,
  removeItemInRedis,
  resolveStringPartition,
} from "./lib";
import { getSummary } from "./wiki_search";
import { setItemInRedis } from "./lib";

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
    const text = tweet.data.text.trim();

    if (!text.toLowerCase().includes("search")) {
      // do not reply
    } else {
      const search_match = text.match(/search\s+(.*)/i);

      if (search_match) {
        console.log("searching for phrase", search_match[1]);

        let search_phrase = search_match[1];
        await getReply(search_phrase, tweet, client2, bot);
      }
    }
  });
};

const getReply = async (
  search_phrase: string,
  tweet: TweetV2SingleStreamResult,
  client: TwitterApi,
  bot: UserV2Result
) => {
  const { summary, images, fullUrl, inCache } = await getSummary(search_phrase);
  // Ignore RTs or self-sent tweets
  const isARt =
    tweet.data.referenced_tweets?.some((tweet) => tweet.type === "retweeted") ??
    false;

  if (isARt || tweet.data.author_id === bot.data.id) {
    return;
  }
  const source = `\nSource: ${fullUrl}`;

  if (inCache) {
    await replyCachedTweet(
      search_phrase,
      client,
      images as string[],
      summary,
      tweet.data.id,
      source,
      bot,
      tweet
    );
  } else {
    let img = images as imageResult[];
    const filtered = img.filter(
      (x) =>
        get_url_extension(x.url) === "jpg" ||
        get_url_extension(x.url) === "jpeg"
    );

    await replyTweetWithImg(
      search_phrase,
      client,
      filtered.slice(0, 4),
      summary,
      tweet.data.id,
      source
    );
  }
};

const replyTweet = async (
  client: TwitterApi,
  text: string,
  id: string
): Promise<TweetV1> => {
  let tweet = await client.v1.reply(text, id);
  return tweet;
};

const replyCachedTweet = async (
  search_phrase: string,
  client: TwitterApi,
  images: string[],
  text: string,
  id: string,
  source: string,
  bot: UserV2Result,
  tweet: TweetV2SingleStreamResult
) => {
  try {
    const string_partition = resolveStringPartition(text, source);

    if (images.length > 0) {
      let init_tweet = await client.v2.reply(string_partition![0], id, {
        media: { media_ids: images },
      });
      makeThread(string_partition as string[], client, init_tweet.data.id);
    } else {
      let init_tweet = await replyTweet(client, string_partition![0], id);
      makeThread(string_partition as string[], client, init_tweet.id_str);
    }
  } catch (err) {
    //if error clear cache and make query again
    await removeItemInRedis(`${search_phrase}`);
    getReply(search_phrase, tweet, client, bot);
  }
};

const replyTweetWithImg = async (
  search_phrase: string,
  client: TwitterApi,
  urls: imageResult[],
  text: string,
  id: string,
  source: string
) => {
  let arry = [];
  let uploaded_media = [];

  //resolve all url to buffer consurently
  for (let i of urls) {
    arry.push(getBuffer(i.url));
  }
  let resolved_buffer = await Promise.all(arry);

  //resolve all uploads concurrently
  for (let buf of resolved_buffer) {
    //file shoul not be more thna 5242880 bytes
    if (buf.byteLength < 5242880) {
      uploaded_media.push(
        client.v1.uploadMedia(buf, { mimeType: EUploadMimeType.Jpeg })
      );
    }
  }
  let resolved_media = await Promise.all(uploaded_media);

  const string_partition = resolveStringPartition(text, source);

  if (resolved_media.length > 0) {
    //save media id to cache
    await setItemInRedis(
      `${search_phrase}-img`,
      JSON.stringify(resolved_media),
      60 * 60 * 24 * 7
    );

    let init_tweet = await client.v2.reply(string_partition![0], id, {
      media: { media_ids: resolved_media },
    });
    makeThread(string_partition as string[], client, init_tweet.data.id);
  } else {
    let init_tweet = await replyTweet(client, string_partition![0], id);
    makeThread(string_partition as string[], client, init_tweet.id_str);
  }
};

const makeThread = async (
  string_partition: string[],
  client: TwitterApi,
  id: string
) => {
  string_partition.shift();
  for (let i of string_partition) {
    await replyTweet(client, i, id);
  }
};

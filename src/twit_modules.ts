import { ETwitterStreamEvent, TwitterApi } from "twitter-api-v2";
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
    // Ignore RTs or self-sent tweets
    const isARt =
      tweet.data.referenced_tweets?.some(
        (tweet) => tweet.type === "retweeted"
      ) ?? false;

    if (isARt || tweet.data.author_id === bot.data.id) {
      return;
    }

    // Reply to tweet
    await replyTweet(client2, "hello friend ", tweet.data.id);
  });
};

const replyTweet = async (client: TwitterApi, text: string, id: string) => {
  await client.v1.reply(text, id);
};

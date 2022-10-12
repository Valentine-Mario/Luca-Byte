import * as dotenv from 'dotenv'
dotenv.config()
import { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError } from 'twitter-api-v2';

import {TwitConnection} from "./src/twit_connection"
import {replyTweet} from "./src/twit_modules"


const run=async()=>{
  const T= TwitConnection();
  const readOnlyClient = T.readWrite;
const client = new TwitterApi(process.env.BEARER_TOKEN!);
// Get and delete old rules if needed
const rules = await client.v2.streamRules();
if (rules.data?.length) {
  await client.v2.updateStreamRules({
    delete: { ids: rules.data.map(rule => rule.id) },
  });
}

// Add our rules
await client.v2.updateStreamRules({
  add: [{value:"@ByteLuca"}],
});

const stream = await client.v2.searchStream({
  'tweet.fields': ['referenced_tweets', 'author_id'],
  expansions: ['referenced_tweets.id'],
});
// Enable auto reconnect
stream.autoReconnect = true;

stream.on(ETwitterStreamEvent.Data, async tweet => {
  console.log(tweet.data.text)
  // Ignore RTs or self-sent tweets
  const isARt = tweet.data.referenced_tweets?.some(tweet => tweet.type === 'retweeted') ?? false;
  // if (isARt || tweet.data.author_id === meAsUser.id_str) {
  //   return;
 // }

  // Reply to tweet
  await T.v1.reply('Did you call me?', tweet.data.id);
});

}
run().then(e=>{
  // console.log(e)
}).catch(err=>{
  console.log(err)
})
 




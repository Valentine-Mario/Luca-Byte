import { TwitterApi } from 'twitter-api-v2';

export function TwitConnection(): TwitterApi {
  const client = new TwitterApi({
    appKey: process.env.CONSUMER_KEY!,
    appSecret: process.env.CONSUMER_SECRET!,
    accessToken: process.env.ACCESS_TOKEN!,
    accessSecret: process.env.ACCESS_TOKEN_SECRET!,
  });
  return client;
}



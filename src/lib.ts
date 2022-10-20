import axios from "axios";
import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL!);

export const getBuffer = async (image: string): Promise<Buffer> => {
  const response = await axios.get(image, { responseType: "arraybuffer" });
  const buffer = Buffer.from(response.data, "utf-8");
  return buffer;
};

export const get_url_extension = (url: string) => {
  return url.split(/[#?]/)[0].split(".").pop()!.trim();
};

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

export const setItemInRedis = async (
  key: string,
  value: string,
  ex: number
): Promise<void> => {
  await redis.set(key, value, "EX", ex, (err) => {
    if (err) console.log("error setting to redis ", err);
  });
};

export const getItemInRedis = async (key: string): Promise<string | null> => {
  let item = await redis.get(key);
  return item;
};

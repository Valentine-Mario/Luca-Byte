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

export const removeItemInRedis = async (key: string) => {
  await redis.del(key);
};

export const resolveStringPartition = (
  text: string,
  source: string
): RegExpMatchArray | null => {
  //limit tweet to 200 charachters
  let all_text = text.replace(/\r?\n|\r/g, " ");
  let string_partition = all_text.match(/.{1,200}\s/g);
  if ((string_partition![string_partition!.length - 1] + source).length < 200) {
    string_partition![string_partition!.length - 1] = `${
      string_partition![string_partition!.length - 1]
    }${source}`;
  } else {
    string_partition![string_partition!.length] = `${source}`;
  }
  return string_partition;
};

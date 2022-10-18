import axios from "axios";

export const getBuffer = async (image: string): Promise<Buffer> => {
  const response = await axios.get(image, { responseType: "arraybuffer" });
  const buffer = Buffer.from(response.data, "utf-8");
  return buffer;
};

import * as dotenv from "dotenv";
dotenv.config();

import { TwitConnection } from "./src/twit_connection";
import { ExecBot } from "./src/twit_modules";

const run = async () => {
  const [client1, client2] = TwitConnection();

 ExecBot(client2, client1);
};
run()
  .then((e) => {
    // console.log(e)
  })
  .catch((err) => {
    console.log(err);
  });

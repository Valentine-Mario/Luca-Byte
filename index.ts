import * as dotenv from 'dotenv'
dotenv.config()

import {TwitConnection} from "./src/twit_connection"
import {ExecBot} from "./src/twit_modules"
import {setItemInRedis} from "./src/lib"

const run=async()=>{
  const [client1, client2]=TwitConnection();

 ExecBot(client2, client1);
  // await setItemInRedis("white", "harry", 60 * 60 * 24)
  
}
run().then(e=>{
  // console.log(e)
}).catch(err=>{
  console.log(err)
})
 

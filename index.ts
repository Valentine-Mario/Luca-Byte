import * as dotenv from 'dotenv'
dotenv.config()

import {TwitConnection} from "./src/twit_connection"
import {ExecBot, divideEqual} from "./src/twit_modules"
import { getSummary } from './src/wiki_search'

const run=async()=>{
  const [client1, client2]=TwitConnection();

  //ExecBot(client2, client1);
  let v="Batman is a superhero appearing in American comic books published by DC Comics. The character was created by artist Bob Kane and writer Bill Finger, and debuted in the 27th issue of the comic book Detective Comics on March 30, 1939. In the DC Universe continuity, Batman is the alias of Bruce Wayne, a wealthy American playboy, philanthropist, and industrialist who resides in Gotham City. Batman's origin story features him swearing vengeance against criminals after witnessing the murder of his parents Thomas and Martha, who were robbed and shot to death infront of an eight-year-old Bruce, a vendetta tempered with the ideal of justice. He trains himself physically and intellectually, crafts a bat-inspired persona, and monitors the Gotham streets at night. Kane, Finger, and other creators accompanied Batman with supporting characters, including his sidekicks Robin and Batgirl; allies Alfred Pennyworth, James Gordon, and Catwoman; and foes such as the Penguin, the Riddler, and his archenemy the Joker."
  let subStringLenth=v.length/200
  let a =divideEqual(v, Math.ceil(subStringLenth))
  console.log(a)
}
run().then(e=>{
  // console.log(e)
}).catch(err=>{
  console.log(err)
})
 

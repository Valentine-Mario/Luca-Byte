import Twit from "twit";

const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;
const access_token = process.env.ACCESS_TOKEN;
const access_token_secret = process.env.ACCESS_TOKEN_SECRET;

export function TwitConnection(): Twit {
  const T = new Twit({
    consumer_key: consumer_key!,
    consumer_secret: consumer_secret!,
    access_token: access_token!,
    access_token_secret: access_token_secret!,
  });
  return T;
}


export module TwitModules{

    const tweet=(T: Twit)=>{
        var res = {
            status: 'This is a tweet @' ,
            in_reply_to_status_id: ''
          };
        
          T.post('statuses/update', res,
            function(err, data, response) {
              console.log(data);
            }
          );
    }
}
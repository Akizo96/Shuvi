import * as DiscordJS from "discord.js";
import Twitter from "twitter";
import {Config} from "../utility/Config";
import {Discord} from "../discord/Base";
import {Log} from "../utility/Log";

class Stream {
    public static connected = false;
    private static handle = new Twitter({
        "consumer_key": Config.twitter.consumerKey,
        "consumer_secret": Config.twitter.consumerSecret,
        "access_token_key": Config.twitter.tokenKey,
        "access_token_secret": Config.twitter.tokenSecret
    });

    public static async load() {
        //if (Twitter.connected) return;
        this.handle.stream('statuses/filter', {
            follow: Config.twitter.users,
            tweet_mode: 'extended'
        }, async (stream) => {
            Log.write('Twitter', `Connection established`);
            Twitter.connected = true;
            stream.on('data', (tweet) => {
                Log.write('Twitter', `Processing Tweet...`);
                if (this.isReply(tweet)) {
                    Log.write('Twitter', `Tweet is an answer, stopped processing.`);
                    return;
                }

                let postDate = new Date(tweet.created_at);

                let twitterPost = {
                    embed: {
                        color: 3174143,
                        description: tweet.truncated ? tweet.extended_tweet.full_text : tweet.text,
                        timestamp: postDate.toISOString(),
                        footer: {
                            icon_url: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
                            text: "Twitter"
                        },
                        author: {
                            name: tweet.user.name + ` (@${tweet.user.screen_name})`,
                            url: 'https://twitter.com/' + tweet.user.screen_name,
                            icon_url: tweet.user.profile_image_url
                        },
                        image: {}
                    }
                };

                if (tweet.truncated) {
                    if (tweet.extended_tweet.entities.media !== undefined) {
                        if (tweet.extended_tweet.entities.media[0] !== undefined) {
                            if (tweet.extended_tweet.entities.media[0].media_url_https !== undefined) {
                                twitterPost.embed.image = {
                                    url: tweet.extended_tweet.entities.media[0].media_url_https
                                }
                            }
                        }
                    }
                } else {
                    if (tweet.entities.media !== undefined) {
                        if (tweet.entities.media[0] !== undefined) {
                            if (tweet.entities.media[0].media_url_https !== undefined) {
                                twitterPost.embed.image = {
                                    url: tweet.entities.media[0].media_url_https
                                }
                            }
                        }
                    }
                }

                Config.twitter.discordChannels.forEach((channelID, i, a) => {
                    const announceChannel = <DiscordJS.TextChannel> Discord.client.channels.get(channelID);
                    announceChannel.send(twitterPost).catch((err) => {
                        Log.write('Discord', `Couldn't send the Tweet as Discord message`);
                    });
                });
            });

            stream.on('error', (error) => {
                //if (!Twitter.connected) return;
                Twitter.connected = false;
                console.error(error);
                Log.write('Twitter', 'Error occurred. Trying to reconnect...');
                setTimeout(() => {
                    Stream.load().catch(() => {
                    });
                }, 15000);
            });

            stream.on('disconnect', (msg) => {
                //if (!Twitter.connected) return;
                Twitter.connected = false;
                console.error(msg);
                Log.write('Twitter', 'Disconnected. Trying to reconnect...');
                setTimeout(() => {
                    Stream.load().catch(() => {
                    });
                }, 15000);
            });

            stream.on('end', (msg) => {
                //if (!Twitter.connected) return;
                Twitter.connected = false;
                console.error(msg);
                Log.write('Twitter', 'Stream Ended. Trying to reconnect...');
                setTimeout(() => {
                    Stream.load().catch(() => {
                    });
                }, 15000);
            });
        });
    }

    private static isReply(tweet) {
        if (tweet.retweeted || tweet.retweeted_status || tweet.in_reply_to_status_id || tweet.in_reply_to_status_id_str || tweet.in_reply_to_user_id || tweet.in_reply_to_user_id_str || tweet.in_reply_to_screen_name) {
            return true;
        }
        return false;
    }
}

export {Stream};
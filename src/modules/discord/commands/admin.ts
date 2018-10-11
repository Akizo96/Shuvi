import {Config} from "../../utility/Config";
import {Discord} from "../Base";
import {Log} from "../../utility/Log";

class Admin {
    public static async handle(msg, args) {
        if (Config.admins.indexOf(msg.author.id) < 0) return;
        let method = args.shift();

        if (typeof this[method] !== 'undefined') {
            this[method](msg, args);
        }
    }

    private static async channelIDs(msg, args) {
        Discord.client.guilds.forEach((guild) => {
            let channels: string = '';
            let types: string = '';
            let channelIDs: string = '';
            guild.channels.forEach((channel) => {
                channels = `${channels}${channel.name}\n`;
                types = `${types}${channel.type}\n`;
                channelIDs = `${channelIDs}${channel.id}\n`;
            });

            msg.channel.send({
                embed: {
                    'title': `${guild.name} - Channel IDs`,
                    'fields': [
                        {
                            'name': 'Channel',
                            'value': channels,
                            'inline': true
                        },
                        {
                            'name': 'Type',
                            'value': types,
                            'inline': true
                        },
                        {
                            'name': 'ID',
                            'value': channelIDs,
                            'inline': true
                        }
                    ]
                }
            }).catch(() => {
                Log.write('Discord', `Couldn't send message to Discord`);
            });
        });
    }
}

export {Admin};
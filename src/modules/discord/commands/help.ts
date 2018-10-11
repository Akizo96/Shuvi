import {CommandHandler, CommandList} from "../CommandHandler";
import {Config} from "../../utility/Config";
import {Log} from "../../utility/Log";

class Help {
    public static async handle(msg, args) {
        let list = CommandHandler.getCommandList();
        let commands = '';
        let descriptions = '';

        list.forEach((v: CommandList, k, m) => {
            if (!v.onlyDM && !v.isAdmin) {
                commands = `${commands}${Config.prefix}${k} ${v.param}\n`;
                descriptions = `${descriptions}${v.desc}\n`;
            }
        });

        await msg.channel.send({
            embed: {
                'title': 'Command List',
                'fields': [
                    {
                        'name': 'Commands',
                        'value': commands,
                        'inline': true
                    },
                    {
                        'name': 'Description',
                        'value': descriptions,
                        'inline': true
                    }
                ]
            }
        }).catch(() => {
            Log.write('Discord', `Couldn't send message to Discord`);
        });
    }
}

export {Help};
import {Character} from "../../bns/Character";
import {Log} from "../../utility/Log";
import {Config} from "../../utility/Config";

class Char {
    public static async handle(msg, args) {
        if (args.length >= 1) {
            const charName = args.join(' ');
            const character = await Character.search(charName);

            if (character !== false) {
                msg.channel.send({embed: character}).catch((err) => {
                    Log.write('Discord', `Couldn't send the Character Data to Discord`);
                });
            } else {
                msg.reply(' Character \'' + charName + '\' not found.').catch((err) => {
                    Log.write('Discord', `Couldn't send the Character Data to Discord`);
                });
            }
        } else {
            msg.reply('The correct command syntax is `' + Config.prefix + 'char [name]`').catch((err) => {
                Log.write('Discord', `Couldn't send the Character Data to Discord`);
            });
        }
    }
}

export {Char};
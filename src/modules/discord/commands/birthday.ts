import {Log} from "../../utility/Log";
import {Config} from "../../utility/Config";
import {Birthday as BDay} from "../../misc/Birthday";

class Birthday {
    public static async handle(msg, args) {
        if (msg.channel.type === 'dm') return;
        if (args.length >= 3) {
            let check: boolean = await BDay.checkMember(msg.author, msg.guild);
            let checkDate: boolean = await this.checkDate(parseInt(args[0]), parseInt(args[1]), parseInt(args[2]));
            if (!checkDate) {
                msg.reply('Your Birthday is in a wrong format!').catch(() => {
                    Log.write('Discord', `Couldn't send message to Discord`);
                });
                return;
            }

            if (!check) {
                BDay.addMember(msg.author, msg.guild, new Date(parseInt(args[2]), (parseInt(args[1]) - 1), parseInt(args[0]))).then(() => {
                    msg.reply(`Your Birthday was successfully saved.`).catch(() => {
                        Log.write('Discord', `Couldn't send message to Discord`);
                    });
                }).catch(() => {
                    Log.write('Birthday', `Error adding user to the Database`);
                });
            } else {
                msg.reply(`Your Birthday is already saved in our database, do you want to override it?\nAnswer with \`yes\` if you want to override.`).catch(() => {
                    Log.write('Discord', `Couldn't send message to Discord`);
                });

                msg.channel.awaitMessages((m) => m.content === 'yes' && m.author.id == msg.author.id, {
                    max: 1,
                    time: 30000,
                    errors: ['time']
                }).then(() => {
                    BDay.updateMember(msg.author, msg.guild, new Date(parseInt(args[2]), (parseInt(args[1]) - 1), parseInt(args[0]))).then(() => {
                        msg.reply(`Your Birthday was successfully updated.`).catch(() => {
                            Log.write('Discord', `Couldn't send message to Discord`);
                        });
                    }).catch(() => {
                        Log.write('Birthday', `Error adding user to the Database`);
                    });
                }).catch(() => {
                    msg.reply(`Your saved birthday wasn't changed.`).catch(() => {
                        Log.write('Discord', `Couldn't send message to Discord`);
                    });
                });
            }
        } else {
            msg.reply(`The correct command syntax is \`${Config.prefix}birthday [day] [month] [year]\``).catch(() => {
                Log.write('Discord', `Couldn't send message to Discord`);
            });
        }
    }

    private static async checkDate(day: number, month: number, year: number) {
        if (day < 1 || day > 31) {
            return false;
        }

        if (month < 1 || month > 12) {
            return false;
        }

        if (year < 1900 || year > (new Date()).getFullYear()) {
            return false;
        }
        return true;
    }
}

export {Birthday};
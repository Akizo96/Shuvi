import * as DiscordJS from "discord.js";
import {Config} from "../utility/Config";

//<Commands>
import {Help} from "./commands/help";
import {Char} from "./commands/char";
import {Birthday} from "./commands/birthday";
import {Admin} from "./commands/admin";
import {Raffle} from "./commands/raffle";

//</Commands>

class CommandHandler {
    private static commandList: Map<string, CommandList> = new Map([
        ['help', {onlyDM: false, class: Help, param: '', desc: 'Shows all Commands', isAdmin: false}],
        ['char', {onlyDM: false, class: Char, param: '[name]', desc: 'Shows information about a Blade & Soul Character', isAdmin: false}],
        ['birthday', {onlyDM: false, class: Birthday, param: '[day] [month] [year]', desc: '', isAdmin: false}],
        ['admin', {onlyDM: true, class: Admin, param: '', desc: '', isAdmin: true}],
        ['craffle', {onlyDM: false, class: Raffle, param: '', desc: '', isAdmin: true}]
    ]);

    public static async handle(msg: DiscordJS.Message) {
        if (msg.content[0] !== Config.prefix) return;
        let isDM: boolean = msg.channel.type === 'dm';
        
        if(!isDM && Config.commandChannels.get(msg.guild.id) !== msg.channel.id) return;
        const args = msg.content.slice(Config.prefix.length).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();

        let handler = this.commandList.get(cmd);
        if (typeof handler !== 'undefined') {
            if (handler.onlyDM && !isDM) return;
            if (handler.isAdmin && Config.admins.indexOf(msg.author.id) < 0) return;
            await handler.class.handle(msg, args);
        }
    }

    public static getCommandList() {
        return this.commandList;
    }
}

interface CommandList {
    onlyDM: boolean,
    class: any,
    param: string,
    desc: string,
    isAdmin: boolean
}

export {CommandHandler, CommandList};
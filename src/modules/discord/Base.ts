import * as DiscordJS from "discord.js";
import {Config} from "../utility/Config";
import {Log} from "../utility/Log";
import {CommandHandler} from "./CommandHandler";
import {MySQL} from "../utility/MySQL";
import {Tables} from "../utility/Database";

class Discord {
    public static active: boolean = false;
    static client: DiscordJS.Client = null;
    private static gameStatus: any = null;
    private static lastStatus: number = 0;

    public static async load() {
        Discord.client = new DiscordJS.Client();
        Discord.client.on('ready', this.readyUp);
        Discord.client.on('message', this.incomingMessage);
        Discord.client.on('messageUpdate', this.updateMessage);
        Discord.client.on('messageDelete', this.deleteMessage);
        Discord.client.on('error', this.error);
        /*Discord.client.on('messageReactionAdd', (reaction, user) => {
            console.log(reaction);
            console.log(reaction.emoji);
        });*/

        return Discord.client.login(Config.botToken);
    }

    private static async readyUp() {
        this.active = true;

        await Discord.client.user.setUsername(Config.botName);
        if (Config.statusTexts.length > 0) {
            await Discord.client.user.setActivity(Config.statusTexts[0][1], {type: Config.statusTexts[0][0]});
            this.gameStatus = setInterval(async () => {
                await Discord.setActivity();
            }, 60000);
        }
        Log.write('Discord', `Connection established`);
        Log.write('Discord', `Logged in as ${Discord.client.user.username}`);
    }

    private static async incomingMessage(msg) {
        if (msg.author.bot) return; // Do not do anything on messages from Bots

        let isDM = (msg.channel.type === 'dm');
        MySQL.pool.query(`INSERT INTO \`${Tables.MESSAGE}\`(\`messageID\`,\`serverID\`,\`channelID\`,\`server\`,\`channel\`,\`author\`,\`authorTag\`,\`message\`,\`time\`) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            msg.id,
            (isDM) ? msg.author.id : msg.guild.id,
            (isDM) ? msg.author.id : msg.channel.id,
            (isDM) ? `DirectMessage (${msg.author.username})` : msg.guild.name,
            (isDM) ? `DirectMessage (${msg.author.username})` : msg.channel.name,
            (isDM) ? msg.author.username : ((msg.member.nickname !== null) ? msg.member.nickname : msg.author.username),
            msg.author.tag,
            msg.content,
            new Date()
        ], (err, res) => {
            if (err) console.error(err);
            msg.attachments.forEach((v, k, m) => {
                MySQL.pool.query(`INSERT INTO \`${Tables.MESSAGE_ATTACHMENT}\`(\`messageID\`,\`attachmentID\`,\`filename\`,\`filesize\`,\`proxy\`,\`url\`) VALUES(?, ?, ?, ?, ?, ?)`, [
                    msg.id,
                    v.id,
                    v.filename,
                    v.filesize,
                    v.proxyURL,
                    v.url
                ], (err) => {
                    if (err) console.error(err);
                });
            });

            MySQL.pool.query(`UPDATE \`${Tables.MESSAGE}\` SET \`attachments\` = ? WHERE \`messageID\` = ?`, [
                msg.attachments.size,
                msg.id
            ], function (err) {
                if (err) console.error(err);
            });
        });

        await CommandHandler.handle(msg);
    }

    private static async updateMessage(oldMsg, newMsg) {
        MySQL.pool.query(`UPDATE \`${Tables.MESSAGE}\` SET \`updatedMessage\` = ? WHERE \`messageID\` = ?`, [
            newMsg.content,
            oldMsg.id
        ], (err) => {
            if (err) console.log(err);
        });
    }

    private static async deleteMessage(msg) {
        MySQL.pool.query(`UPDATE \`${Tables.MESSAGE}\` SET \`deleted\` = 1 WHERE \`messageID\` = ?`, [
            msg.id
        ], (err) => {
            if (err) console.log(err);
        });
    }

    private static async error(err) {
        Log.write('Discord', `${err.name} - ${err.message}`);
    }

    private static async setActivity() {
        this.lastStatus = (this.lastStatus + 1 === Config.statusTexts.length) ? 0 : this.lastStatus + 1;
        await Discord.client.user.setActivity(Config.statusTexts[this.lastStatus][1], {type: Config.statusTexts[this.lastStatus][0]});
    }

    public static async shutdown() {
        Log.write('Discord', `Connection closed`);
        return Discord.client.destroy();
    }
}

export {Discord};
import * as DiscordJS from "discord.js";
import {Discord} from "../discord/Base";
import {MySQL} from "../utility/MySQL";
import {Log} from "../utility/Log";
import {Tables} from "../utility/Database";

class Birthday {
    public static load() {
        Discord.client.on('guildMemberRemove', this.removeMember);
        setTimeout(Birthday.checkBirthday, 4 * 60 * 60 * 1000);
    }

    private static async checkBirthday() {
        const currentDate = new Date();
        MySQL.pool.query(`SELECT \`memberID\`,\`birthday\`,\`b\`.\`serverID\`,\`c\`.\`channelID\` FROM \`${Tables.USER_BIRTHDAY}\` AS \`b\` LEFT JOIN \`${Tables.USER_BIRTHDAY}\` AS \`c\` ON \`b\`.\`serverID\` = \`c\`.\`serverID\` WHERE DAY(\`b\`.\`birthday\`) = ? AND MONTH(\`b\`.\`birthday\`) = ? AND \`b\`.\`lastGreet\` != YEAR(CURDATE())`, [
            currentDate.getDate(),
            (currentDate.getMonth() + 1)
        ], (err, res) => {
            if (err) return;

            res.forEach((v) => {
                if (v.channelID != null) {
                    const guild = Discord.client.guilds.get(v.serverID);
                    if (guild != null) {
                        const channel = <DiscordJS.TextChannel> guild.channels.get(v.channelID);
                        if (channel != null) {
                            const user = guild.members.get(v.memberID);
                            if (user != null) {
                                channel.send(`:birthday: Happy Birthday to <@${user.id}>! :birthday:`).then(() => {
                                    MySQL.pool.query(`UPDATE \`${Tables.USER_BIRTHDAY}\` SET \`lastGreet\` = YEAR(CURDATE()) WHERE \`memberID\` = ? AND \`serverID\` = ?`, [v.memberID, v.serverID]);
                                }).catch(() => {
                                    Log.write('Discord', `Couldn't send message to Discord`);
                                });
                            }
                        }
                    }
                }
            });
        });

        setTimeout(Birthday.checkBirthday, 4 * 60 * 60 * 1000);
    }

    public static async checkMember(member: DiscordJS.User, guild: DiscordJS.Guild) {
        let testResponse = false;
        await new Promise((resolve, reject) => {
            MySQL.pool.query(`SELECT * FROM \`${Tables.USER_BIRTHDAY}\` WHERE \`memberID\` = ? AND \`serverID\` = ?`, [
                member.id,
                guild.id
            ], (err, res) => {
                if (err) {
                    reject(false);
                    return;
                }
                if (res.length > 0) reject(false);
                resolve(true);
            });
        }).then(() => {
            testResponse = false;
        }).catch(() => {
            testResponse = true;
        });
        return testResponse;
    }

    public static async addMember(member: DiscordJS.User, guild: DiscordJS.Guild, birthday: Date) {
        return new Promise((resolve, reject) => {
            MySQL.pool.query(`INSERT INTO \`${Tables.USER_BIRTHDAY}\` (\`memberID\`,\`serverID\`, \`birthday\`) VALUES(?, ?, ?)`, [
                member.id,
                guild.id,
                birthday
            ], (err) => {
                if (err) {
                    reject(false);
                    return;
                }
                resolve(true);
                Log.write('Birthday', `Added User (${member.username}) to the Server ${guild.name}`);
            });
        });
    }

    public static async updateMember(member: DiscordJS.User, guild: DiscordJS.Guild, birthday: Date) {
        return new Promise((resolve, reject) => {
            MySQL.pool.query(`UPDATE \`${Tables.USER_BIRTHDAY}\` SET \`birthday\` = ? WHERE \`memberID\` = ? AND \`serverID\` = ?`, [
                birthday,
                member.id,
                guild.id
            ], (err) => {
                if (err) {
                    reject(false);
                    return;
                }
                resolve(true);
                Log.write('Birthday', `Updated User (${member.username}) from Server ${guild.name}`);
            });
        });
    }

    private static async removeMember(member: DiscordJS.GuildMember) {
        const guild = member.guild;
        MySQL.pool.query(`DELETE FROM \`${Tables.USER_BIRTHDAY}\` WHERE \`memberID\` = ? AND \`serverID\` = ?`, [
            member.user.id,
            guild.id
        ], (err) => {
            if (err) return;
            Log.write('Birthday', `Deleted User (${member.user.username}) from the Server ${guild.name}`);
        });
    }
}

export {Birthday};
import {Log} from "../../utility/Log";
import {Config} from "../../utility/Config";
import {Guild, CategoryChannel, VoiceChannel, ChannelCreationOverwrites} from "discord.js";

class VortexTemple {
    private static VoiceChannels: Map<number, string> = new Map();

    public static async handle(msg, args) {
        if (args.length === 2) {
            if (args[0] === 'start') {
                const raid = parseInt(args[1]);
                if (Number.isInteger(raid)) {
                    if (typeof this.VoiceChannels.get(raid) === 'undefined') {
                        await this.createChannels(msg.guild, raid);
                    } else {
                        msg.reply('I already created channels for this Raid.').catch(() => {
                            Log.write('Discord', `Couldn't send message`);
                        });
                    }
                } else {
                    msg.reply('The correct command syntax is `' + Config.prefix + 'vt [start/stop] [raidNr]`4').catch(() => {
                        Log.write('Discord', `Couldn't send message`);
                    });
                }
            } else if (args[0] === 'stop') {
                const raid = parseInt(args[1]);
                if (Number.isInteger(raid)) {
                    if (typeof this.VoiceChannels.get(raid) !== 'undefined') {
                        await this.deleteChannels(msg.guild, raid);
                    } else {
                        msg.reply('I can\'t delete what isn\'t there').catch(() => {
                            Log.write('Discord', `Couldn't send message`);
                        });
                    }
                } else {
                    msg.reply('The correct command syntax is `' + Config.prefix + 'vt [start/stop] [raidNr]`3').catch(() => {
                        Log.write('Discord', `Couldn't send message`);
                    });
                }
            } else {
                msg.reply('The correct command syntax is `' + Config.prefix + 'vt [start/stop] [raidNr]`2').catch(() => {
                    Log.write('Discord', `Couldn't send message`);
                });
            }
        } else {
            msg.reply('The correct command syntax is `' + Config.prefix + 'vt [start/stop] [raidNr]`1').catch(() => {
                Log.write('Discord', `Couldn't send message`);
            });
        }
    }

    private static async createChannels(guild: Guild, raid: number) {
        const channelPermissions: ChannelCreationOverwrites[] = [
            {id: guild.id, allowed: [], denied: ['CONNECT', 'SPEAK']}
        ];

        Config.voiceRoleIDs.forEach((v) => {
            channelPermissions.push({id: v, allowed: ['CONNECT', 'SPEAK'], denied: []});
        });
        const wait = d => new Promise(r => setTimeout(r, d));

        guild.createChannel(`VT Raid ${raid}`, 'category', channelPermissions).then(async (category: CategoryChannel) => {
            VortexTemple.VoiceChannels.set(raid, category.id);

            guild.createChannel(`General`, 'voice', channelPermissions).then(async (channel: VoiceChannel) => {
                channel.setParent(category).catch(console.log);
                await wait(1000);
                channel.setUserLimit(12).catch(console.log);
            });
            await wait(2000);
            guild.createChannel(`Gruppe 1 (Tank + Keeper)`, 'voice', channelPermissions).then(async (channel: VoiceChannel) => {
                channel.setParent(category).catch(console.log);
                await wait(1000);
                channel.setUserLimit(2).catch(console.log);
            });
            await wait(2000);
            guild.createChannel(`Gruppe 1`, 'voice', channelPermissions).then(async (channel: VoiceChannel) => {
                channel.setParent(category).catch(console.log);
                await wait(1000);
                channel.setUserLimit(4).catch(console.log);
            });
            await wait(2000);
            guild.createChannel(`Gruppe 2`, 'voice', channelPermissions).then(async (channel: VoiceChannel) => {
                channel.setParent(category).catch(console.log);
                await wait(1000);
                channel.setUserLimit(4).catch(console.log);
            });
            await wait(2000);
            guild.createChannel(`Gruppe 2 (Tank + Keeper)`, 'voice', channelPermissions).then(async (channel: VoiceChannel) => {
                channel.setParent(category).catch(console.log);
                await wait(1000);
                channel.setUserLimit(2).catch(console.log);
            });
        });
    }

    private static async deleteChannels(guild: Guild, raid: number) {
        const wait = d => new Promise(r => setTimeout(r, d));
        const raidVoice = VortexTemple.VoiceChannels.get(raid);
        if (typeof raidVoice !== 'undefined') {
            const channel = <CategoryChannel> guild.channels.get(raidVoice);
            if (typeof channel !== 'undefined') {
                const children = channel.children.array();

                for (let i = 0; i < children.length; i++) {
                    await children[i].delete();
                    await wait(1500);
                }

                await wait(1500);

                await channel.delete('VT Raid stopped').catch(console.log);

                VortexTemple.VoiceChannels.delete(raid);
            }
        }
    }
}

export {VortexTemple};
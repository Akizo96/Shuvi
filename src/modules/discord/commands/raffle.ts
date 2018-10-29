import {Message, RichEmbed, TextChannel} from "discord.js";
import {Log} from "../../utility/Log";
import {Discord} from "../Base";
import {RaffleInterface, Raffles} from "../../misc/Raffles";

class Raffle {
    public static async handle(msg, args) {
        let raffle = Raffles.list.get(msg.author.id);
        if (typeof raffle === 'undefined') {
            msg.reply(`Alright! Let's set up your giveaway! First, what server do you want the giveaway in?\nYou can type \`cancel\` at any time to cancel creation.\n\n\`Please type the name of the server\``).catch(() => {
                Log.write('Discord', `Couldn't send message`);
            });

            msg.channel.awaitMessages((m) => m.author.id == msg.author.id, {
                max: 1,
                time: 2 * 60 * 1000,
                errors: ['time']
            }).then(Raffle.server).catch(() => {
                Log.write('Raffle', `Couldn't create raffle`);
            });
        } else {
            msg.reply('There is still an ongoing raffle that you opened. Please wait until it is finished before opening another raffle.').catch(() => {
                Log.write('Discord', `Couldn't send message`);
            });
        }
    }

    public static async server(collection) {
        const msg = collection.first();

        let guild = Discord.client.guilds.find(val => val.name === msg.content);
        if (typeof guild !== 'undefined') {
            Raffles.list.set(msg.author.id, {
                name: '',
                author: msg.author.id,
                endTime: null,
                serverID: guild.id,
                channelID: '',
                thumbnail: '',
                messageID: ''
            });

            msg.reply(`Sweet! The giveaway will be on ${guild.name}! Next, what channel do you want the giveaway in?\n\n\`Please type the name of a channel in your selected server.\``).catch(() => {
                Log.write('Discord', `Couldn't send message`);
            });

            msg.channel.awaitMessages((m) => m.author.id == msg.author.id, {
                max: 1,
                time: 2 * 60 * 1000,
                errors: ['time']
            }).then(Raffle.channel).catch(() => {
                Log.write('Raffle', `Couldn't create raffle`);
            });
        } else {
            msg.reply(`I dont know this server, please retry the creation process.`).catch(() => {
                Log.write('Discord', `Couldn't send message`);
            });
        }
    }

    public static async channel(collection) {
        const msg = collection.first();

        let raffle = Raffles.list.get(msg.author.id);
        let guild = Discord.client.guilds.get(raffle.serverID);
        let channel = guild.channels.find(val => val.name === msg.content);
        if (typeof channel !== 'undefined') {
            raffle.channelID = channel.id;
            Raffles.list.set(msg.author.id, raffle);

            msg.reply(`Neat! The giveaway will be in <#${channel.id}>! Next, how long should the giveaway last?\n\n\`Please enter the duration of the giveaway.\nEnter a duration in minutes and include an M at the end, or days and include a D.\``).catch(() => {
                Log.write('Discord', `Couldn't send message`);
            });

            msg.channel.awaitMessages((m) => m.author.id == msg.author.id, {
                max: 1,
                time: 60 * 1000,
                errors: ['time']
            }).then(Raffle.raffleLength).catch(() => {
                Log.write('Raffle', `Couldn't create raffle`);
            });
        } else {
            msg.reply(`I can't find this channel on ${guild.name}, please retry the creation process.`).catch(() => {
                Log.write('Discord', `Couldn't send message`);
            });
        }
    }

    public static async raffleLength(collection) {
        const msg = collection.first();

        let raffle = Raffles.list.get(msg.author.id);
        let time = parseInt(msg.content);
        let modifier = msg.content.replace(/[0-9]+/, '');

        if (modifier === 'm' || modifier === 'd') {
            if (time > 0) {
                //TODO: endtime calculating
                const currentTime = (new Date()).getTime();

                let endTime;
                if (modifier === 'm') {
                    endTime = new Date(currentTime + time * 60 * 1000);
                    setTimeout(() => {
                        Raffle.endRaffle(msg.author.id);
                    }, time * 60 * 1000);
                } else if (modifier === 'd') {
                    endTime = new Date(currentTime + time * 24 * 60 * 60 * 1000);
                    setTimeout(() => {
                        Raffle.endRaffle(msg.author.id);
                    }, time * 24 * 60 * 60 * 1000);
                }

                raffle.endTime = endTime;
                Raffles.list.set(msg.author.id, raffle);

                msg.reply(`Sweet! This giveaway will last until ${endTime.getDate() + '.' + (1 + endTime.getMonth()) + '.' + endTime.getFullYear() + ' ' + endTime.getHours() + ':' + endTime.getMinutes() + ':' + endTime.getSeconds()}! Now, what do you want to give away?\n\n\`Please enter the giveaway prize.\``).catch(() => {
                    Log.write('Discord', `Couldn't send message`);
                });

                msg.channel.awaitMessages((m) => m.author.id == msg.author.id, {
                    max: 1,
                    time: 2 * 60 * 1000,
                    errors: ['time']
                }).then(Raffle.raffleName).catch(() => {
                    Log.write('Raffle', `Couldn't create raffle`);
                });
            } else {
                msg.reply(`You message is not in the format i need. Please retry.`).catch(() => {
                    Log.write('Discord', `Couldn't send message`);
                });

                msg.channel.awaitMessages((m) => m.author.id == msg.author.id, {
                    max: 1,
                    time: 60 * 1000,
                    errors: ['time']
                }).then(Raffle.raffleLength).catch(() => {
                    Log.write('Raffle', `Couldn't create raffle`);
                });
            }
        } else {
            msg.reply(`You message is not in the format i need. Please retry.`).catch(() => {
                Log.write('Discord', `Couldn't send message`);
            });

            msg.channel.awaitMessages((m) => m.author.id == msg.author.id, {
                max: 1,
                time: 60 * 1000,
                errors: ['time']
            }).then(Raffle.raffleLength).catch(() => {
                Log.write('Raffle', `Couldn't create raffle`);
            });
        }
    }

    public static async raffleName(collection) {
        const msg = collection.first();

        let raffle = Raffles.list.get(msg.author.id);
        raffle.name = msg.content;
        Raffles.list.set(msg.author.id, raffle);

        msg.reply(`Neat! The Item you are giving away is \`${raffle.name}\`! Finally, post an image url for an thumbnail.\n\n\`Please enter the URL to the thumbnail. This will also begin the giveaway.\``).catch(() => {
            Log.write('Discord', `Couldn't send message`);
        });

        msg.channel.awaitMessages((m) => m.author.id == msg.author.id, {
            max: 1,
            time: 2 * 60 * 1000,
            errors: ['time']
        }).then(Raffle.thumbnail).catch(() => {
            Log.write('Raffle', `Couldn't create raffle`);
        });

    }

    public static async thumbnail(collection) {
        const msg = collection.first();

        let raffle = Raffles.list.get(msg.author.id);
        raffle.thumbnail = msg.content;
        Raffles.list.set(msg.author.id, raffle);

        msg.reply(`Done! The giveaway for \`${raffle.name}\` is starting in <#${raffle.channelID}>!`).catch(() => {
            Log.write('Discord', `Couldn't send message`);
        });
        await Raffle.post(msg.author.id);
    }

    public static async post(author) {
        const raffle = Raffles.list.get(author);
        const guild = Discord.client.guilds.get(raffle.serverID);

        const embed = new RichEmbed();
        embed.setTitle(`${raffle.name}`);
        embed.setColor(12517631);
        embed.setThumbnail(raffle.thumbnail);
        embed.setDescription(`**Sponsor:** <@${author}>\n\nReact with :tada: to enter the Giveaway!`);
        embed.setTimestamp(raffle.endTime);
        embed.setFooter('Giveaway ends');

        const channel = <TextChannel> guild.channels.get(raffle.channelID);
        channel.send(embed).then((msg: Message) => {
            raffle.messageID = msg.id;
            Raffles.list.set(author, raffle);
            Raffles.save();
            msg.react('🎉').catch(() => {
                Log.write('Discord', `Couldn't react to the message.`);
            });
        }).catch(() => {
            Log.write('Discord', `Couldn't send message`);
        });
    }

    public static endRaffle(author) {
        const raffle = Raffles.list.get(author);
        let guild = Discord.client.guilds.get(raffle.serverID);
        let channel = <TextChannel> guild.channels.get(raffle.channelID);

        channel.fetchMessage(raffle.messageID).then((msg) => {
            let reaction = msg.reactions.find(val => val.emoji.name === '🎉');
            reaction.fetchUsers(reaction.count).then((users) => {
                users.delete(Discord.client.user.id);
                let winner = users.random();
                if (typeof winner !== 'undefined') {
                    channel.send(`Congratulations <@${winner.id}>! You won the **${raffle.name}**!`).catch(() => {
                        Log.write('Discord', `Couldn't send message`);
                    });
                    
                    Raffles.remove(author);
                }
            });
        });
    }
}

export {Raffle};
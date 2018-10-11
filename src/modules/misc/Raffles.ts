import {MySQL} from "../utility/MySQL";
import {Tables} from "../utility/Database";
import {Raffle} from "../discord/commands/raffle";
import {Log} from "../utility/Log";

class Raffles {
    public static list: Map<string, RaffleInterface> = new Map();

    public static load() {
        MySQL.pool.query(`SELECT * FROM \`${Tables.RAFFLE}\``, (err, res) => {
            if (err) console.error(err);

            res.forEach((v) => {
                let tmp: RaffleInterface = {
                    name: v.name,
                    author: v.authorID,
                    endTime: new Date(parseInt(v.endTime)),
                    serverID: v.serverID,
                    channelID: v.channelID,
                    thumbnail: v.thumbnail,
                    messageID: v.messageID
                };

                Raffles.list.set(v.authorID, tmp);
                let currentTime = (new Date()).getTime();
                
                setTimeout(() => {
                    Raffle.endRaffle(v.authorID);
                }, (v.endTime - currentTime));
            });
            
            Log.write('Raffle', `Loaded ${res.length} Raffles`);
        });
    }

    public static save() {
        MySQL.pool.query(`TRUNCATE \`${Tables.RAFFLE}\``, (err) => {
            if (err) console.log(err);

            Raffles.list.forEach((raffle, authorID) => {
                MySQL.pool.query(`INSERT INTO \`${Tables.RAFFLE}\`(\`authorID\`,\`name\`,\`endTime\`,\`serverID\`,\`channelID\`,\`thumbnail\`,\`messageID\`) VALUES(?,?,?,?,?,?,?)`, [
                    authorID,
                    raffle.name,
                    raffle.endTime.getTime(),
                    raffle.serverID,
                    raffle.channelID,
                    raffle.thumbnail,
                    raffle.messageID
                ], (err) => {
                    if (err) console.log(err);
                })
            });
        });
    }

    public static remove(authorID: string) {
        MySQL.pool.query(`DELETE FROM \`${Tables.RAFFLE}\` WHERE \`authorID\` = ?`, [authorID], (err) => {
            if (err) console.error(err);

            Raffles.list.delete(authorID);
        });
    }
}

interface RaffleInterface {
    name: string;
    author: string,
    endTime: Date,
    serverID: string,
    channelID: string,
    thumbnail: string,
    messageID: string
}

export {Raffles, RaffleInterface};
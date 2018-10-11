import chalk from "chalk";
import * as fs from "fs";
import {Config} from "./Config";
import {MySQL} from "./MySQL";
import {Tables} from "./Database";

class Log {
    private static getTime() {
        const dateTime = new Date();
        let date = dateTime.getDate().toString();
        let month = (dateTime.getMonth() + 1).toString();
        let year = dateTime.getFullYear().toString();
        let hours = dateTime.getHours().toString();
        let min = dateTime.getMinutes().toString();
        let sec = dateTime.getSeconds().toString();

        if (date.length < 2) date = '0' + date;
        if (month.length < 2) month = '0' + month;
        if (hours.length < 2) hours = '0' + hours;
        if (min.length < 2) min = '0' + min;
        if (sec.length < 2) sec = '0' + sec;

        return {
            date: year + '-' + month + '-' + date,
            complete: date + '.' + month + '.' + year + ' - ' + hours + ':' + min + ':' + sec
        };
    }

    private static getClassColorized(dClass: string) {
        let s = dClass.toLowerCase();
        if (s === 'mysql') {
            return chalk.green('MySQL');
        } else if (s === 'twitter') {
            return chalk.cyan('Twitter');
        } else if (s === 'discord') {
            return chalk.blue('Discord');
        } else {
            return chalk.gray(dClass);
        }
    }

    public static write(dClass: string, data: string) {
        let time = this.getTime();
        console.log(`${time.complete} | [${this.getClassColorized(dClass)}] ${data}`);

        if (Config.logMode === 0) {
            fs.appendFile(`${Config.logDirectory}${time.date}.txt`, `${time.complete} | [${dClass}] ${data}\n`, (err) => {
                //do not do anything
            });
        } else if (Config.logMode === 1) {
            MySQL.pool.query(`INSERT INTO \`${Tables.LOG}\` (\`class\`,\`message\`) VALUES(?, ?)`, [
                dClass,
                data
            ], (err, res) => {
                if (err) console.error(err);
            });
        } else if (Config.logMode === 2) {
            fs.appendFile(`${Config.logDirectory}${time.date}.txt`, `${time.complete} | [${dClass}] ${data}\n`, (err) => {
                //do not do anything
            });
            MySQL.pool.query(`INSERT INTO \`${Tables.LOG}\` (\`class\`,\`message\`) VALUES(?, ?)`, [
                dClass,
                data
            ], (err, res) => {
                if (err) console.error(err);
            });
        }
    }

    public static async setup(path: string) {
        //Check if log directory is setup
        if (!fs.existsSync(`${path}logs/`)) {
            fs.mkdirSync(`${path}logs/`);
        }
    }
}

export {Log};
import chalk from "chalk";
import {Config} from "./modules/utility/Config";
import {Log} from "./modules/utility/Log";
import {MySQL} from "./modules/utility/MySQL";
import {Discord} from "./modules/discord/Base";
import {Stream as Twitter} from "./modules/twitter/stream";
import {Birthday} from "./modules/misc/Birthday";
import {Raffles} from "./modules/misc/Raffles";

async function boot() {
    if (Config.botToken === '') {
        console.log(`[${chalk.red('Error')}] Couldn't find a token to login to Discord`);
    }

    // Load Utility
    await Log.setup('./');
    await MySQL.load().catch((err) => {
        Log.write('MySQL', chalk.red('Connection failed'));
        Log.write('MySQL', chalk.red(err.sqlMessage));
        MySQL.active = false;
        shutdown();
    });

    // Load Main Systems
    await Discord.load().catch((err) => {
        Log.write('Discord', chalk.red('Connection failed'));
        Log.write('Discord', chalk.red(err));
        Discord.active = false;
        shutdown();
    });

    Twitter.load().catch((err) => {
        Log.write('Twitter', chalk.red('Connection failed'));
        Log.write('Twitter', chalk.red(err));
        shutdown();
    });
    
    Birthday.load();
    Raffles.load();
}

async function shutdown() {
    if (MySQL.active) {
        await MySQL.shutdown();
    }

    if (Discord.active) {
        await Discord.shutdown();
    }
    process.exit();
}

boot();
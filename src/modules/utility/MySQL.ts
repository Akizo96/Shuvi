import {Config} from "./Config";
import {Log} from "./Log";
import * as mysql from "mysql";

class MySQL {
    public static active: boolean = false;
    public static pool: mysql.Pool = null;

    public static async load() {
        this.pool = mysql.createPool(Config.database);

        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                    return;
                }
                connection.query('SET NAMES utf8mb4;');
                if (connection) connection.release();
                Log.write('MySQL', `Connection established`);

                setInterval(() => {
                    MySQL.ping();
                }, 5000);
                
                this.active = true;
                resolve(true);
            });
        });
    }

    private static ping() {
        this.pool.query('SELECT 1');
    }
    
    public static async shutdown() {
        Log.write('MySQL', `Connection closed`);
        this.pool.end();
    }
}

export {MySQL};
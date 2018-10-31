class Config {
    static botToken: string = ''; // Discord Bot Token
    static botName: string = ''; // Discord Bot Name
    static prefix: string = '.'; // Command Prefix
    static commandChannels: Map<string, string> = new Map([
        // ['*SERVER ID*', '*CHANNEL ID*']
        // The bot only recognizes commands in this channel
    ]);
    static adminChannels: string[] = [
        // '*CHANNEL ID*'
        // if you want a separate channel for bot admins, put the channel ids here
    ];
    static admins: string[] = [
        // '*USER ID*'
        // Discord User IDs which have access to the admin commands
    ];
    static statusTexts: any[][] = [
        ['PLAYING', `Use ${Config.prefix}help`],
        ['PLAYING', 'Blade & Soul'],
        ['WATCHING', 'Anime']
    ];
    static database: any = {
        connectionLimit: 10,
        host: '127.0.0.1',
        port: 3306,
        user: 'shuvi',
        password: '',
        database: 'shuvi',
        charset: 'utf8mb4'
    };
    static twitter: any = {
        active: false,
        consumerKey: '',
        consumerSecret: '',
        tokenKey: '',
        tokenSecret: '',
        users: '', // Twitter User IDs of which the Bot should posts tweets. (http://gettwitterid.com/)
        discordChannels: [
            // '*CHANNEL ID*'
            // channel ids where the bot will post the tweets
        ]
    };
    static voiceRoleIDs: string[] = [
        // '*ROLE ID*'
        // role IDs which will have access to the VT Raid Voice Channels
    ];
    static logDirectory: string = './logs/';
    static logMode: number = 2; // 0 = FileSystem | 1 = MySQL | 2 = Both
    static logMessages: boolean = false; // if true, every message will be logged to MySQL
}

export {Config};
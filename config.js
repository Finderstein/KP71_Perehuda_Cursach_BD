require('dotenv').config();

module.exports = 
{
    ServerPort: 5000,
    DatabaseUrl: "mongodb://localhost:27017/mydb",
    cloudinary:
    {
        cloud_name: "dmne1oxqg",
        api_key: "988532436238333",
        api_secret: "s-vO3Rd6PqyUNr9sWP3l1lDRA9A"
    },
    ServerSalt: "@n1M3_&_M@n$@",
    SecretString: "d0tK@_&_R@n0B3",
    bot_token: process.env[`TELEGRAM_BOT_TOKEN`],
};
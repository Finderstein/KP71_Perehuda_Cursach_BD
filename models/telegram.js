const config = require('../config');
const TelegramBotApi = require('telegram-bot-api');
const User = require('./user');

const telegramBotApi = new TelegramBotApi({
    token: config.bot_token,
    updates: {
        enabled: true  // do message pull
    }
});

telegramBotApi.on('message', onMessage);

function onMessage(message)
{
    processRequest(message)
        .catch(err => telegramBotApi.sendMessage({
            chat_id: message.chat.id,
            text: `Something went wrong. Try again later. Error ${err.toString()}`,
        }));
}

async function processRequest(message)
{
    console.log(message.from.username, message.text);
    let chatUser = await User.getByChatUsername(message.from.username)
    if(chatUser)
    {
        if(message.text === "/start")
        {
            await User.updateChatId(chatUser._id, message.chat.id);
            return telegramBotApi.sendMessage({
                chat_id: message.chat.id,
                text: `Hello ${chatUser.login}!`,
            });
        }
        else if(message.text === "/help")
        {
            return telegramBotApi.sendMessage({
                chat_id: message.chat.id,
                text: `/start - This command will link your telegram account and "Noter" account\n/help - This command will show you all commands that NoterBot have\n/info - This command will show your profile data on "Noter"`,
            });
        }
        else if(message.text === "/info")
        {
            return telegramBotApi.sendMessage({
                chat_id: message.chat.id,
                text: `Username: ${chatUser.login}\nRole: ${chatUser.role}\nFullname: ${chatUser.fullname}\nBioghraphy: ${chatUser.bio}\nLast updated: ${chatUser.registeredAt}`,
            });
        }
        else
            return telegramBotApi.sendMessage({
                chat_id: message.chat.id,
                text: `Maybe you should try to use one of commands?`,
            });
    }
    else
        return telegramBotApi.sendMessage({
            chat_id: message.chat.id,
            text: "Hello! Please add your telegram username to your \"Noter\" account.",
        });
}

module.exports=
{
    async sentNotificationToOneUser(userId, text)
    {
        console.log(text);
        const chatUser = await User.getById(userId)
        if(chatUser.chatId !== '')
            await telegramBotApi.sendMessage({
                chat_id: chatUser.chatId,
                text: text,
            })
    }
}

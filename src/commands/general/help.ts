import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { PrefixCommand } from "../../types";

const command: PrefixCommand = {
  name: "help",
  async execute(message: Message) {
    const embed = new EmbedBuilder()
      .setTitle("Commands")
      .setDescription(
        [
          "**🔧 General**",
          "`$ping`: check bot latency",
          "`$uptime`: show bot uptime",
          "`$help`: show this message",
          "",
          "**🎲 Random**",
          "`$gif`: 🚧 disabled for now",
          "`$8ball <question>`: ask the magic 8-ball",
          "`$jews`: ✡️",
          "`$news [headline] [image(s)]`: generate real news (better than ogisada)",
          "`$caption <text>`: caption an image (attach, reply, or forward)",
          "`$status <text>`: change bot status",
          "`$setprofile`: set the bot's avatar (attach image)",
          "`$changenick <nickname>`: change ogisada's nickname",
          "",
          "**🛠️ Utility**",
          "`$eval <command>`: run a linux shell command in the bot container",
          "`$snipe [number]`: snipe the last deleted message",
          "`$editsnipe [number]`: snipe the last edited message",
          "`$send <@user|id> <message>`: DM a user",
          "`$restart`: restart the bot",
          "`$summary <number>`: summarize the last <number> messages",
          "`$prompt <text>`: ask the AI anything (remembers the last few exchanges per channel)",
          "`$forget`: clear this channel's $prompt/$8ball memory",
          "",
          "**💰 Economy**",
          "`$balance [@user]` (alias `$bal`): check cash, bank, and net worth",
          "`$daily`: claim your daily reward",
          "`$work`: work a job for cash (30s cooldown)",
          "`$slut`: alternate way to work a job for cash (1h cooldown)",
          "`$deposit <amount|all|half>`: move cash into your bank",
          "`$withdraw <amount|all|half>`: move cash out of your bank",
          "`$pay <@user> <amount|all|half>`: send someone cash",
          "`$rob <@user>`: attempt to rob someone's cash",
          "`$crime`: commit a crime for a shot at a big payout, risky (1h cooldown)",
          "`$leaderboard` (alias `$lb`): show the richest players",
          "`$coinflip <amount|all|half> <heads|tails>`: flip a coin for cash",
          "`$slots <amount|all|half>`: spin the slot machine",
          "`$blackjack <amount|all|half>` (alias `$bj`): play a hand of blackjack",
          "",
          "**👑 Owner only**",
          "`$shutdown`: shut down the bot",
          "`$ban [add|remove] <@user|id> [duration]`: ban/unban a user from using the bot (defaults to add, 24h; bans are never permanent)",
          "`$addmoney <@user> <amount> [cash|bank]`: give a user money",
          "`$removemoney <@user> <amount>`: take money from a user's cash",
          "`$setmoney <@user> <amount> [cash|bank]`: set a user's balance",
          "`$cleardebt <@user>`: clear a user's negative cash balance",
          "`$resetcooldown [@user] [daily|work|slut|crime|rob|all]`: clear a cooldown; omit the user to reset it for everyone",
          "`$reseteconomy confirm`: wipe every account back to defaults",
        ].join("\n")
      )
      .setColor(0x5865f2);
    await (message.channel as TextChannel).send({ embeds: [embed] });
  },
};

module.exports = command;
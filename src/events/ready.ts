import { Client, Events, ActivityType } from "discord.js";

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    client.user?.setPresence({
      status: "online",
      activities: [{ name: process.env.BOT_ACTIVITY!, type: ActivityType.Custom }],
    });
    console.log(`Logged in as ${client.user?.tag}`);
  },
};
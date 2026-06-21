import { Events, Interaction } from "discord.js";
import { BotClient } from "../types";

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction: Interaction, client: BotClient) {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      const msg = { content: "An error occurred.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  },
};

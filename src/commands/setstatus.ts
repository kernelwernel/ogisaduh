import { SlashCommandBuilder, ChatInputCommandInteraction, ActivityType } from "discord.js";
import { Command } from "../types";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Change the bot status")
    .addStringOption((o) =>
      o.setName("text").setDescription("Status text").setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName("type")
        .setDescription("Activity type")
        .setRequired(false)
        .addChoices(
          { name: "Playing", value: "Playing" },
          { name: "Watching", value: "Watching" },
          { name: "Listening", value: "Listening" },
          { name: "Competing", value: "Competing" },
          { name: "Custom", value: "Custom" }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const text = interaction.options.getString("text", true);
    const type = (interaction.options.getString("type") ?? "Custom") as keyof typeof ActivityType;
    interaction.client.user?.setActivity(text, { type: ActivityType[type] });
    await interaction.reply({ content: `Status updated.`, ephemeral: true });
  },
};

module.exports = command;

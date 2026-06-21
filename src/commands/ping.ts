import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../types";

const command: Command = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Replies with pong"),
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setDescription(`🏓 **Pong!** - ${Date.now() - interaction.createdTimestamp}ms`)
      .setColor(0x27e462);
    await interaction.reply({ embeds: [embed] });
  },
};

module.exports = command;
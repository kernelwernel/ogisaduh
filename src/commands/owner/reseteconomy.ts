import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { resetEconomy } from "../../utils/economy";

const command: PrefixCommand = {
  name: "reseteconomy",
  async execute(message: Message, args: string[]) {
    if (message.author.id !== process.env.OWNER_ID) return;

    if (args[0]?.toLowerCase() !== "confirm") {
      await message.reply(
        "⚠️ This wipes **every** user's cash, bank, cooldowns, and slot streak — no undo. Run `$reseteconomy confirm` to go through with it."
      );
      return;
    }

    try {
      await resetEconomy();
    } catch (err) {
      console.error("[reseteconomy] failed:", err);
      await message.reply(`❌ Reset failed: \`${err instanceof Error ? err.message : err}\``);
      return;
    }

    await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("💥 Economy Reset")
        .setDescription("Every account has been wiped back to defaults.")
        .setColor(0xff3333)],
    });
  },
};

module.exports = command;

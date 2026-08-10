import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { resetCooldowns, resetCooldownsForAll, COOLDOWN_FIELDS } from "../../utils/economy";

type CooldownField = (typeof COOLDOWN_FIELDS)[number];

// Maps the user-facing command name to the economy field that tracks its cooldown.
// `$slut` shares `lastWork` with `$work`, so resetting "work" clears both.
const ALIASES: Record<string, CooldownField> = {
  daily: "lastDaily",
  work: "lastWork",
  slut: "lastWork",
  crime: "lastCrime",
  rob: "lastRob",
};

const command: PrefixCommand = {
  name: "resetcooldown",
  async execute(message: Message, args: string[]) {
    if (message.author.id !== process.env.OWNER_ID) return;

    const target = message.mentions.users.first();
    // When a user is mentioned, the cooldown name is the arg after it; otherwise it's the first arg.
    const which = (target ? args[1] : args[0])?.toLowerCase();

    let fields: CooldownField[];
    if (!which || which === "all") {
      fields = COOLDOWN_FIELDS;
    } else if (which in ALIASES) {
      fields = [ALIASES[which]];
    } else {
      await message.reply(`Usage: \`$resetcooldown [@user] [${Object.keys(ALIASES).join("|")}|all]\` — omit the user to reset for everyone.`);
      return;
    }

    const label = which && which !== "all" ? `the \`${which}\`` : "all";
    const plural = !which || which === "all" ? "s" : "";

    if (!target) {
      await resetCooldownsForAll(fields);
      await message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("✅ Cooldown Reset")
          .setDescription(`Cleared ${label} cooldown${plural} for **everyone**.`)
          .setColor(0x5865f2)],
      });
      return;
    }

    await resetCooldowns(target.id, fields);

    await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("✅ Cooldown Reset")
        .setDescription(`Cleared ${label} cooldown${plural} for ${target}.`)
        .setColor(0x5865f2)],
    });
  },
};

module.exports = command;

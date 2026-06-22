import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { PrefixCommand, BotClient } from "../types";
import { readdirSync } from "fs";
import { join } from "path";

const command: PrefixCommand = {
  name: "reload",
  async execute(message: Message) {
    const client = message.client as BotClient;
    const embed = new EmbedBuilder()
      .setTitle("🛠 Reload")
      .setDescription("```> Reloading commands...```")
      .setColor(0xff9900);
    const sent = await (message.channel as TextChannel).send({ embeds: [embed] });

    try {
      // clear require cache for all command files
      const dirs = [
        join(__dirname, "..", "commands"),
        join(__dirname, "..", "prefixCommands"),
      ];
      for (const dir of dirs) {
        for (const file of readdirSync(dir).filter(f => f.endsWith(".js") || f.endsWith(".ts"))) {
          delete require.cache[require.resolve(join(dir, file))];
        }
      }

      // re-register slash commands
      client.commands.clear();
      for (const file of readdirSync(dirs[0]).filter(f => f.endsWith(".js") || f.endsWith(".ts"))) {
        const cmd = require(join(dirs[0], file));
        if ("data" in cmd && "execute" in cmd) client.commands.set(cmd.data.name, cmd);
      }

      // re-register prefix commands
      client.prefixCommands.clear();
      for (const file of readdirSync(dirs[1]).filter(f => f.endsWith(".js") || f.endsWith(".ts"))) {
        const cmd: PrefixCommand = require(join(dirs[1], file));
        client.prefixCommands.set(cmd.name, cmd);
      }

      await sent.edit({
        embeds: [
          EmbedBuilder.from(sent.embeds[0])
            .setDescription("```> Commands have been reloaded```")
            .setColor(0x27e462),
        ],
      });
    } catch (error) {
      await sent.edit({
        embeds: [
          EmbedBuilder.from(sent.embeds[0])
            .setDescription(`\`\`\`${error}\`\`\``)
            .setColor(0xff0000),
        ],
      });
      console.error("[reload]", error);
    }
  },
};

module.exports = command;

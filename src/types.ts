import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, ChatInputCommandInteraction, Client, Collection, Message } from "discord.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface PrefixCommand {
  name: string;
  execute(message: Message, args: string[]): Promise<void>;
}

export interface BotClient extends Client {
  commands: Collection<string, Command>;
  prefixCommands: Collection<string, PrefixCommand>;
}

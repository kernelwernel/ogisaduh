import { Client, Collection, Message } from "discord.js";

export interface PrefixCommand {
  name: string;
  aliases?: string[];
  /** Set automatically by the loader from the command's parent folder (e.g. "economy"). */
  category?: string;
  execute(message: Message, args: string[]): Promise<void>;
}

export interface BotClient extends Client {
  prefixCommands: Collection<string, PrefixCommand>;
}

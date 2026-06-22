import { Client, Collection, Message } from "discord.js";

export interface PrefixCommand {
  name: string;
  execute(message: Message, args: string[]): Promise<void>;
}

export interface BotClient extends Client {
  prefixCommands: Collection<string, PrefixCommand>;
}

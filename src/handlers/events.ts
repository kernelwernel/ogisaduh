import { readdirSync } from "fs";
import { join } from "path";
import { BotClient } from "../types";

export async function loadEvents(client: BotClient) {
  const eventsPath = join(__dirname, "..", "events");
  const eventFiles = readdirSync(eventsPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
  for (const file of eventFiles) {
    const event = require(join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args: unknown[]) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args: unknown[]) => event.execute(...args, client));
    }
  }
}

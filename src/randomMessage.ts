import { Client, TextChannel } from "discord.js";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { MAIN_CHANNEL_ID } from "./cli";

const STATE_FILE = join(__dirname, "..", "data", "random_message.json");

// Roughly once a day, with jitter so it doesn't feel like a cron job.
const MIN_INTERVAL_MS = 20 * 60 * 60 * 1000;
const MAX_INTERVAL_MS = 28 * 60 * 60 * 1000;

// Sentence skeletons. Reference a filler list by name with {VARNAME} — every
// occurrence of a given placeholder in a template is filled independently,
// so "{PERSON} TOLD {PERSON} TO..." can pick two different people.
// e.g. TEMPLATES = ["{PERSON} HAS GONE TO {PLACE}"]
const TEMPLATES: string[] = [
];

// One array per variable. Add a new const array here for each {VARNAME} you
// use in TEMPLATES, then wire it into FILLERS below.
const PEOPLE: string[] = [
  "EPSTEIN",
  "I",
  "MARCEL",
  "NULL",
  "KERNEL",
  "THE ISRAELIS",
  "THE JEWS",
  "NETANYAHU",
  "HOT ASIAN MEN",
  "ROSA PARKS",
  "NIGGAS",
  "KANYE WEST",
  "TODDLERS",
  "REPUBLICANS",
  "NAZIS"
];

const ACTIONS: string[] = [
  "RAPED",
  "KILLED",
  "MURDERED",
  "SODOMISED",
  "ASSAULTED",
  "CRUCIFIED",
  "KISSED",
  "PUNCHED",
  "URINATED"
];

const ACTIVITY: string[] = [
  "WATCHED GAY PORN",
  "FUCKED NIGGAS",
  "JACKED OFF",
  "SHOT RETARDS",
  "GAVE BIRTH",
  "GOT NAKED",
  ""
];

const ADJECTIVE: string[] = [
  "BRUTALLY"
];


const OBJECTS: string[] = [
  ""
];

const SHOWS: string[] = [
  "GERMAN DUNGEON PORN"
];

const PLACES: string[] = [
  "A MOSQUE"
];

// Maps each placeholder name used in TEMPLATES (case-sensitive, without the
// braces) to its filler array above. Every {VARNAME} referenced in TEMPLATES
// needs a matching entry here.
const FILLERS: Record<string, string[]> = {
  PERSON: PEOPLE,
  PLACE: PLACES,
  ACTION: ACTIONS,
  OBJECT: OBJECTS
};

function fillTemplate(template: string): string {
  return template.replace(/\{([A-Z0-9_]+)\}/g, (match, name) => {
    const options = FILLERS[name];
    if (!options || options.length === 0) {
      console.error(`[randomMessage] no fillers defined for {${name}}`);
      return match;
    }
    return options[Math.floor(Math.random() * options.length)];
  });
}

function pickMessage(): string | null {
  if (TEMPLATES.length === 0) return null;
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  return fillTemplate(template);
}

function randomInterval(): number {
  return MIN_INTERVAL_MS + Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS));
}

function loadNextSend(): number | null {
  if (!existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8")).nextSend ?? null;
  } catch {
    return null;
  }
}

function saveNextSend(ts: number) {
  writeFileSync(STATE_FILE, JSON.stringify({ nextSend: ts }));
}

async function sendRandomMessage(client: Client) {
  try {
    const text = pickMessage();
    if (!text) {
      console.error("[randomMessage] no templates defined, skipping send");
      return;
    }
    const channel = await client.channels.fetch(MAIN_CHANNEL_ID);
    if (!channel?.isTextBased() || !("send" in channel)) return;
    await (channel as TextChannel).send(text);
  } catch (err) {
    console.error("[randomMessage] failed to send:", err);
  }
}

export function startRandomMessage(client: Client) {
  const schedule = (delayMs: number) => {
    setTimeout(async () => {
      await sendRandomMessage(client);
      const next = Date.now() + randomInterval();
      saveNextSend(next);
      schedule(next - Date.now());
    }, delayMs).unref();
  };

  let nextSend = loadNextSend();
  if (nextSend === null) {
    nextSend = Date.now() + randomInterval();
    saveNextSend(nextSend);
  }
  schedule(Math.max(0, nextSend - Date.now()));
}

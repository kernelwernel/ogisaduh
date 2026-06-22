import { Message, TextChannel, AttachmentBuilder } from "discord.js";
import { PrefixCommand } from "../types";
import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";
import sharp from "sharp";
import { readdirSync } from "fs";
import { join } from "path";

const TOPIC_IMAGES_DIR = join(__dirname, "..", "..", "topic_images");

const TOPIC_KEYWORDS: string[] = [
  "VMAWARE", "QEMU", "BATTLEYE", "VALORANT", "ROBLOX",
  "EAC", "HWID", "AUTOVIRT", "SMBIOS", "NVRAM",
];

function resolveTopicImage(headline: string): string | null {
  const upper = headline.toUpperCase();
  let files: string[];
  try { files = readdirSync(TOPIC_IMAGES_DIR); } catch { return null; }
  for (const keyword of TOPIC_KEYWORDS) {
    if (!upper.includes(keyword)) continue;
    const match = files.find(f => f.toLowerCase().startsWith(keyword.toLowerCase() + ".") || f.toLowerCase() === keyword.toLowerCase());
    if (match) return join(TOPIC_IMAGES_DIR, match);
  }
  return null;
}


const ENTRIES: { name: string; headline: string; colon?: boolean }[] = [
  { name: "Drake", headline: "{FAILS} TO BYPASS VMAWARE AFTER 14 HOURS OF {TRYING}" },
  { name: "Kanye West", headline: "{DETECTED} BY BATTLEYE HYPERVISOR CHECK IN {MINUTES}", colon: true },
  { name: "Lil Uzi Vert", headline: "REPORTEDLY {CRIES} AFTER AUTOVIRT GETS {FLAGGED}" },
  { name: "Travis Scott", headline: "{BANNED} FROM VALORANT AFTER QEMU+KVM {DETECTED}" },
  { name: "Tyler the Creator", headline: "{FAILS} NIKA-READ-ONLY BYPASS {THREE} TIMES" },
  { name: "Kendrick Lamar", headline: "CALLS EAC KERNEL {DETECTION}, QUOTE, {BRUTAL}" },
  { name: "Playboi Carti", headline: "ATTEMPTS VM SPOOF, GETS {IMMEDIATELY} {DETECTED}" },
  { name: "Young Thug", headline: "{LOSES} APPEAL AFTER SMBIOS INTEGRITY CHECK {FAILS}" },
  { name: "Future", headline: "GIVES {UP} ON AUTOVIRT, SAYS TIMING CHECK {UNFAIR}" },
  { name: "Offset", headline: "{DETECTED} BY VMAWARE ON FIRST TRY, {BLAMES} HIS PC" },
  { name: "21 Savage", headline: "{FAILS} PCI VENDOR ID CHECK, CALLS IT {RIGGED}" },
  { name: "Lil Baby", headline: "{CRIES} AFTER BATTLEYE {FLAGS} HIS HYPERVISOR QUERY" },
  { name: "Gunna", headline: "ATTEMPTS QEMU SPOOF, GETS {CAUGHT} BY CPU {HEURISTICS}" },
  { name: "Chief Keef", headline: "{LOSES} HWID BAN APPEAL AFTER VM CONFIRMATION {TRUE}" },
  { name: "ASAP Rocky", headline: "{DETAINED} AT AIRPORT, VMAWARE {FOUND} ON LAPTOP" },
  { name: "NBA YoungBoy", headline: "VMAWARE DETECTION RATE {100} PERCENT, {CONFIRMED}", colon: true },
  { name: "Cardi B", headline: "{FAILS} EDID CHECK {FOUR} TIMES IN A ROW" },
  { name: "Post Malone", headline: "GIVES {UP} CHEATING AFTER NVRAM CHECK {DESTROYS} HIM" },
  { name: "Lil Durk", headline: "ATTEMPTS AUTOVIRT BYPASS, GETS {FLAGGED} IN {UNDER} A SECOND" },
  { name: "Nicki Minaj", headline: "SMBIOS INTEGRITY CHECK RETURNS {FAILED}, {LEAKED} SCREENSHOT SHOWS", colon: true },
  { name: "Jack Harlow", headline: "TRIES NIKA-READ-ONLY BYPASS TWICE, BOTH TIMES {DETECTED} AND {BANNED}" },
  { name: "Polo G", headline: "{FAILS} DARK BYTES HYPERVISOR CHECK, CALLS DEVS {CORRUPT}" },
  { name: "Doja Cat", headline: "{RAGE} QUITS AFTER EAC {FLAGS} HER KERNEL DRIVER" },
  { name: "SZA", headline: "{CAUGHT} USING AUTOVIRT IN RANKED MATCH, PERMANENTLY {BANNED}" },
  { name: "The Weeknd", headline: "VMAWARE {DETECTS} HYPERVISOR IN UNDER {TWO} SECONDS", colon: true },
  { name: "Billie Eilish", headline: "{FAILS} CPU HEURISTICS CHECK, {BLAMES} HER PROCESSOR" },
  { name: "Olivia Rodrigo", headline: "NIKA-READ-ONLY BYPASS {FAILS} AT {FINAL} STEP" },
  { name: "Lil Nas X", headline: "ATTEMPTS VM SPOOF IN ROBLOX, GETS {BANNED} {ANYWAY}" },
  { name: "DaBaby", headline: "SPOTTED {GOOGLING} HOW TO {BYPASS} VMAWARE AT 3AM" },
  { name: "Snoop Dogg", headline: "SAYS EAC TIMING CHECK IS {DIABOLICAL} AND {UNFAIR}" },
  { name: "Ice Cube", headline: "{FAILS} VMAWARE AFTER FOLLOWING YOUTUBE TUTORIAL {EXACTLY}" },
  { name: "Dr. Dre", headline: "SPENDS {MILLIONS} ON VM SPOOF, BATTLEYE {DISAGREES}" },
  { name: "Eminem", headline: "WRITES DISS TRACK ABOUT VMAWARE AFTER GETTING {DETECTED} AND {BANNED}" },
  { name: "Jay-Z", headline: "VMAWARE SCAN COMPLETE, VM CONFIRMATION TRUE, {HWID} {BANNED}", colon: true },
  { name: "Beyoncé", headline: "ATTEMPTS QEMU BYPASS, SMBIOS CHECK {ENDS} HER {CAREER}" },
  { name: "Rihanna", headline: "{FAILS} LOW FILE ACCESS COUNT CHECK IN {FINAL} ROUND" },
  { name: "Lil Pump", headline: "{FAILS} VMAWARE {SEVEN} TIMES, STILL DOES NOT UNDERSTAND WHY" },
  { name: "6ix9ine", headline: "{SNITCHES} ON OWN VM SPOOF TO AVOID {LONGER} HWID BAN" },
  { name: "Trippie Redd", headline: "{FAILS} KERNEL OBJECT CHECK, {BLAMES} WINDOWS UPDATE" },
  { name: "Rick Ross", headline: "VMAWARE SCAN {DETECTS} QEMU BRAND ON BOSS {GAMING} PC" },
  { name: "Meek Mill", headline: "{LOSES} BATTLEYE APPEAL AGAIN, {THIRD} TIME THIS YEAR" },
  { name: "Lil Wayne", headline: "SAYS EAC IS THE REAL JAIL AFTER GETTING {HWID} {BANNED}" },
  { name: "Gucci Mane", headline: "VMAWARE CONFIRMED {TRUE} ON ALL {FOURTEEN} ACCOUNTS", colon: true },
  { name: "T-Pain", headline: "AUTOTUNES VMAWARE ERROR MESSAGE, STILL GETS {DETECTED} AND {BANNED}" },
  { name: "Soulja Boy", headline: "CLAIMS HE {INVENTED} VM SPOOFING, COMMUNITY {DISAGREES}" },
  { name: "Lil Jon", headline: "{SCREAMS} AT BATTLEYE FOR {FLAGGING} HIS HYPERVISOR QUERY" },
  { name: "Pitbull", headline: "MR WORLDWIDE {FAILS} VM SPOOF IN {EVERY} REGION" },
  { name: "Taylor Swift", headline: "{FAILS} VMAWARE BYPASS, {BANNED} FROM ALL SERVERS" },
  { name: "Harry Styles", headline: "{DETECTED} BY BATTLEYE, {BANNED} FROM COMPETITIVE PLAY", colon: true },
  { name: "Ed Sheeran", headline: "WRITES SONG ABOUT {FAILING} QEMU BYPASS, STILL {BANNED}" },
  { name: "Justin Bieber", headline: "{HWID} {BANNED}, SAYS VMAWARE IS NEVER LETTING HIM GO" },
  { name: "Ariana Grande", headline: "VMAWARE SCAN RETURNS, ONE LAST TIME, VM {DETECTED} AND {BANNED}", colon: true },
  { name: "Lady Gaga", headline: "{FAILS} EAC KERNEL SCAN, {BANNED} FOR LIFE" },
  { name: "Katy Perry", headline: "{FAILS} NIKA-READ-ONLY BYPASS, GETS {BANNED} ANYWAY" },
  { name: "Selena Gomez", headline: "{DETECTED} BY VMAWARE, {BANNED} FROM RANKED", colon: true },
  { name: "Miley Cyrus", headline: "{FAILS} SMBIOS INTEGRITY CHECK, SAYS SHE CANNOT BE {TAMED}" },
  { name: "Demi Lovato", headline: "CALLS BATTLEYE {DETECTION} {TRIGGERING} AND HARMFUL" },
  { name: "Charlie Puth", headline: "HEARS VMAWARE {ERROR} SOUND, {BANNED} BEFORE SONG RELEASES" },
  { name: "Sam Smith", headline: "{DETECTED} BY EAC, {BANNED} IN UNHOLY FASHION", colon: true },
  { name: "Adele", headline: "{FAILS} QEMU BYPASS, SAYS HELLO FROM THE {BANNED} SIDE" },
  { name: "Shawn Mendes", headline: "ATTEMPTS AUTOVIRT BYPASS, GETS {CAUGHT} AND {BANNED}" },
  { name: "Camila Cabello", headline: "VMAWARE {CONFIRMS} HYPERVISOR IN {PLAIN} SIGHT" },
  { name: "Halsey", headline: "SAYS BATTLEYE IS {SYSTEMATIC} AND {CORRUPT} AFTER BAN" },
  { name: "Lizzo", headline: "{FAILS} PCI VENDOR ID CHECK, {BANNED} FROM ALL SERVERS" },
  { name: "Jason Derulo", headline: "{FALLS} DOWN STAIRS AFTER READING VMAWARE {BAN} NOTICE" },
  { name: "Charli XCX", headline: "GOES {BRAT} AFTER BATTLEYE {FLAGS} HER HYPERVISOR" },
  { name: "Sabrina Carpenter", headline: "{FAILS} FIRMWARE CHECK, {BANNED} FROM COMPETITIVE" },
  { name: "Hozier", headline: "SAYS BATTLEYE IS THE {DEVIL} AND {DETECTION} IS HELL" },
  { name: "Coldplay", headline: "{FAIL} VMAWARE BYPASS TOGETHER AS A BAND, ALL {BANNED}" },
  { name: "Imagine Dragons", headline: "{DETECTED} BY EAC, {BANNED} FROM ALL SERVERS", colon: true },
  { name: "Twenty One Pilots", headline: "BOTH MEMBERS {HWID} {BANNED} AT SAME TIME" },
  { name: "Fall Out Boy", headline: "{FAILS} NIKA-READ-ONLY BYPASS, {BANNED} FOR CENTURIES" },
  { name: "My Chemical Romance", headline: "VMAWARE SCAN RETURNS {TRUE}, THEY ARE {NOT} OKAY", colon: true },
  { name: "Green Day", headline: "{FAILS} BATTLEYE CHECK, AMERICAN {IDIOT} GETS HWID BANNED" },
  { name: "Blink-182", headline: "ATTEMPTS QEMU SPOOF, ALL THE SMALL THINGS GET {DETECTED} AND {BANNED}" },
  { name: "Foo Fighters", headline: "{FAIL} VMAWARE AFTER DAVE GROHL TYPES IN {WRONG} KERNEL" },
  { name: "Linkin Park", headline: "{DETECTED} BY EAC, IN THE END IT DID {NOT} MATTER", colon: true },
  { name: "Metallica", headline: "{FAILS} DARK BYTES HYPERVISOR CHECK, CALLS IT {UNFORGIVEN}" },
  { name: "Machine Gun Kelly", headline: "ATTEMPTS VMAWARE {BYPASS}, GETS {CAUGHT} IMMEDIATELY" },
  { name: "Elvis Presley", headline: "ESTATE CONFIRMS HE {NEVER} BYPASSED BATTLEYE, {BANNED} POSTHUMOUSLY" },
  { name: "Michael Jackson", headline: "ESTATE {SUES} VMAWARE FOR {DETECTING} THRILLER GAMING PC" },
  { name: "Freddie Mercury", headline: "GHOST ATTEMPTS QEMU BYPASS, {FAILS} FIRMWARE {CHECK}" },
  { name: "LeBron James", headline: "VMAWARE {DETECTED} DURING HALFTIME, {BLAMES} TEAMMATES", colon: true },
  { name: "Cristiano Ronaldo", headline: "{FAILS} BATTLEYE CHECK, SCREAMS SIUUU, GETS {BANNED}" },
  { name: "Lionel Messi", headline: "{DETECTED} BY EAC, GOAT STATUS {REVOKED}", colon: true },
  { name: "Conor McGregor", headline: "ATTEMPTS VMAWARE BYPASS, {TAPS} {OUT} IMMEDIATELY" },
  { name: "Floyd Mayweather", headline: "SPENDS {FIFTY} MILLION ON VM SPOOF, STILL {DETECTED}" },
  { name: "Mike Tyson", headline: "{PUNCHES} MONITOR AFTER VMAWARE RETURNS VM LIKELINESS {100}" },
  { name: "Jake Paul", headline: "{FAILS} NIKA-READ-ONLY BYPASS, CLAIMS HE {STILL} WON" },
  { name: "Logan Paul", headline: "VMAWARE SCAN COMPLETE, {DETECTED}, {BANNED} FROM VALORANT", colon: true },
  { name: "MrBeast", headline: "OFFERS {MILLION} DOLLARS TO BYPASS VMAWARE, {NOBODY} SUCCEEDS" },
  { name: "Elon Musk", headline: "SAYS VMAWARE IS {BASED} AFTER IT {DETECTS} HIS OWN PC" },
  { name: "Mark Zuckerberg", headline: "VMAWARE CONFIRMS HUMAN SIMULATION {DETECTED} AND {BANNED}", colon: true },
  { name: "Gordon Ramsay", headline: "CALLS VMAWARE BYPASS ATTEMPT AN {ABSOLUTE} {DISGRACE}" },
  { name: "Keanu Reeves", headline: "{FAILS} NIKA-READ-ONLY BYPASS, COMMUNITY {DEVASTATED}" },
  { name: "Johnny Depp", headline: "VMAWARE SCAN COMPLETE, {DETECTED}, AMBER HEARD {LAUGHS}", colon: true },
  { name: "Will Smith", headline: "SLAPS BATTLEYE DEVELOPER AFTER {HWID} {BAN}" },
  { name: "Dwayne Johnson", headline: "{FAILS} VMAWARE, EVEN THE ROCK CANNOT {BYPASS} EAC" },
  { name: "Kevin Hart", headline: "{FAILS} VMAWARE BYPASS, {BANNED} AFTER FOURTEEN ATTEMPTS", colon: true },
  { name: "Ryan Reynolds", headline: "VMAWARE {DETECTED}, DEADPOOL {BANNED} FROM ALL SERVERS", colon: true },
  { name: "Tom Cruise", headline: "ATTEMPTS VMAWARE BYPASS HIMSELF, MISSION {IMPOSSIBLE}, {BANNED}" },
  { name: "Arnold Schwarzenegger", headline: "SAYS HE WILL BE BACK AFTER {HWID} {BAN}" },
  { name: "Sylvester Stallone", headline: "{FAILS} EAC CHECK, YO ADRIAN, I GOT {DETECTED}" },
  { name: "Bruce Willis", headline: "{DETECTED} BY VMAWARE, {BANNED} FROM ALL SERVERS", colon: true },
  { name: "Drake", headline: "VMAWARE SCAN {COMPLETE}, VM {CONFIRMED} ON GAMING RIG" },
  { name: "Kanye West", headline: "SPENDS {MILLIONS} ON CUSTOM PC, VMAWARE STILL {DETECTS} IT" },
  { name: "Travis Scott", headline: "VMAWARE {CATCHES} HYPERVISOR DURING LIVE STREAM, CROWD {WATCHES}" },
  { name: "Eminem", headline: "WRITES EIGHT MILE VERSE ABOUT {FAILING} BATTLEYE {CHECK}" },
  { name: "Lil Wayne", headline: "CALLS VMAWARE THE CARTER FIVE OF {ANTICHEAT}, STILL GETS {BANNED}" },
  { name: "Nicki Minaj", headline: "VMAWARE {EXPOSES} HYPERVISOR LIVE ON INSTAGRAM, {BANNED}" },
  { name: "Cardi B", headline: "GOES {OFFSET} TRYING TO {BYPASS} VMAWARE CHECK" },
  { name: "Post Malone", headline: "VMAWARE {DETECTS} VM IN UNDER A SECOND, POST {DEVASTATED}" },
  { name: "21 Savage", headline: "{CAUGHT} RUNNING QEMU ON MAIN RIG, GETS {DEPORTED} FROM LOBBY" },
  { name: "Offset", headline: "VMAWARE {RETURNS} TRUE ON SECOND ACCOUNT, {BANNED} AGAIN" },
  { name: "Future", headline: "{MASK} OFF, HYPERVISOR {DETECTED} BY BATTLEYE SCAN" },
  { name: "Young Thug", headline: "VMAWARE {FINDS} HIDDEN QEMU INSTANCE, HWID {BANNED}" },
  { name: "Gunna", headline: "WALKS IN ON VMAWARE SCAN {COMPLETING}, {BANNED} LIVE ON STREAM" },
  { name: "Playboi Carti", headline: "WHOLE LOTTA VM {DETECTED}, WHOLE LOTTA {BANNED}" },
  { name: "Lil Baby", headline: "BATTLEYE {FLAGS} KERNEL DRIVER, ACCOUNT {TERMINATED}" },
  { name: "Taylor Swift", headline: "VMAWARE {DETECTS} HYPERVISOR, SWIFTIES {BLAME} KANYE" },
  { name: "Billie Eilish", headline: "{BANNED} FROM RANKED, SAYS ANTICHEAT IS {BAD} GUY" },
  { name: "Olivia Rodrigo", headline: "VMAWARE {KILLS} HER MAIN ACCOUNT, {BRUTAL} EAC SCAN" },
  { name: "Ariana Grande", headline: "EAC SCAN {RETURNS} TRUE, THANK YOU, {NEXT} ACCOUNT ALSO BANNED" },
  { name: "Doja Cat", headline: "VMAWARE {EXPOSES} QEMU BUILD LIVE ON TWITCH, {BANNED}" },
  { name: "SZA", headline: "BATTLEYE {FINDS} HYPERVISOR, SZA {QUITS} COMPETITIVE" },
  { name: "The Weeknd", headline: "AFTER HOURS OF {TRYING}, VMAWARE STILL {DETECTS} THE VM" },
  { name: "Ed Sheeran", headline: "VMAWARE SCAN {RUINS} GAMING SESSION, HWID {BAN} FOLLOWS" },
  { name: "Harry Styles", headline: "VMAWARE {CATCHES} AUTOVIRT, FANS {DEVASTATED}" },
  { name: "Justin Bieber", headline: "SORRY, VMAWARE {DETECTED} THE HYPERVISOR, {BANNED}" },
  { name: "Shawn Mendes", headline: "STITCHES ON VMAWARE REPORT SHOW {DETECTED}, {HWID} BANNED" },
  { name: "Sam Smith", headline: "VMAWARE {UNNHOLY} SCAN RETURNS TRUE, {BANNED} IMMEDIATELY", colon: true },
  { name: "Adele", headline: "ROLLING IN THE {BANS}, VMAWARE {CATCHES} THIRD ACCOUNT" },
  { name: "Lady Gaga", headline: "VMAWARE {DETECTS} VM, POKER FACE CANNOT {HIDE} IT" },
  { name: "Katy Perry", headline: "ROARS AT BATTLEYE DEVELOPER AFTER {HWID} {BAN}" },
  { name: "Rihanna", headline: "WORK, WORK, WORK, VMAWARE STILL {DETECTS}, STILL {BANNED}" },
  { name: "Beyoncé", headline: "VMAWARE FINDS HYPERVISOR, {BANS} ALL FORTY-TWO {ACCOUNTS}" },
  { name: "Jay-Z", headline: "NINETY-NINE PROBLEMS, VMAWARE {DETECTION} IS {ALL} OF THEM", colon: true },
  { name: "Snoop Dogg", headline: "DROP IT LIKE IT IS {HOT}, VMAWARE {BANS} ACCOUNT INSTANTLY" },
  { name: "Eminem", headline: "LOSES HIMSELF IN VMAWARE {SCAN}, ACCOUNT {TERMINATED}" },
  { name: "Dr. Dre", headline: "STILL {BANNED}, VMAWARE FOUND QEMU ON {COMPTON} GAMING PC" },
  { name: "Ice Cube", headline: "TODAY WAS A GOOD DAY UNTIL VMAWARE {DETECTED} THE {HYPERVISOR}" },
  { name: "LeBron James", headline: "VMAWARE {BANS} ACCOUNT, LEBRON SAYS IT WAS {GOAT} LEVEL UNFAIR" },
  { name: "Lionel Messi", headline: "VMAWARE SCAN SHOWS {DETECTED}, GOAT STATUS {UNDER} REVIEW", colon: true },
  { name: "Cristiano Ronaldo", headline: "VMAWARE {DETECTED} HYPERVISOR, CR7 {CRIES} IN PRESS CONFERENCE" },
  { name: "Conor McGregor", headline: "VMAWARE TAPS HIM {OUT} IN UNDER TWO SECONDS, {BANNED}" },
  { name: "Mike Tyson", headline: "VMAWARE {KNOCKS} OUT HIS ACCOUNT, {BANNED} IN FIRST ROUND" },
  { name: "Floyd Mayweather", headline: "GOES {UNDEFEATED} IN BOXING, {LOSES} TO VMAWARE SCAN" },
  { name: "Jake Paul", headline: "VMAWARE {BEATS} HIM AGAIN, CLAIMS SCAN WAS {RIGGED}" },
  { name: "Logan Paul", headline: "POSTS VMAWARE {BAN} CLIP TO YOUTUBE, STILL GETS {MOCKED}" },
  { name: "MrBeast", headline: "GIVES AWAY GAMING PC, VMAWARE {DETECTS} VM ON ALL {FIVE}" },
  { name: "Elon Musk", headline: "BUYS VMAWARE TO {DELETE} HIS BAN, STILL GETS {DETECTED}" },
  { name: "Gordon Ramsay", headline: "CALLS VMAWARE BYPASS ATTEMPT {RAW}, {BANNED} FROM LOBBY" },
  { name: "Keanu Reeves", headline: "COMMUNITY {SHOCKED} AS VMAWARE {BANS} KEANU FOR VM USE" },
  { name: "Ryan Reynolds", headline: "VMAWARE {RUINS} GAMING SPONSOR DEAL, {BANNED} ON CAMERA" },
  { name: "Tom Cruise", headline: "VMAWARE {CATCHES} HYPERVISOR, {BANNED} MID CUTSCENE" },
  { name: "Will Smith", headline: "VMAWARE {BANS} HIM AGAIN, WILL {SLAPS} MONITOR IN RESPONSE" },
  { name: "Dwayne Johnson", headline: "EVEN THE ROCK {CANNOT} LIFT THE VMAWARE {BAN}" },
  { name: "Kevin Hart", headline: "VMAWARE {DETECTED} ON SECOND ACCOUNT, KEVIN {SCREAMS}" },
  { name: "Freddie Mercury", headline: "BOHEMIAN {BANNED}, VMAWARE {CAUGHT} THE HYPERVISOR" },
  { name: "Michael Jackson", headline: "VMAWARE {DETECTS} THRILLER GAMING PC, ESTATE {SUES}" },
  { name: "Elvis Presley", headline: "VMAWARE {BANS} ESTATE ACCOUNT, ELVIS HAS {LEFT} THE LOBBY" },
  { name: "Metallica", headline: "MASTER OF {BANNED}, VMAWARE {DETECTS} QEMU ON TOUR BUS" },
  { name: "Linkin Park", headline: "IN THE {END}, VMAWARE {CAUGHT} THE HYPERVISOR ANYWAY" },
  { name: "Green Day", headline: "WAKE ME UP WHEN {BATTLEYE} {ENDS}, SAYS BANNED MEMBER" },
  { name: "Blink-182", headline: "ALL THE SMALL THINGS GET {DETECTED}, HWID {BAN} CONFIRMED" },
  { name: "My Chemical Romance", headline: "I'M {NOT} OKAY, VMAWARE {DETECTED} ALL THREE ACCOUNTS" },
  { name: "Fall Out Boy", headline: "CENTURIES OF {TRYING}, VMAWARE {BANS} THEM EVERY TIME" },
  { name: "Coldplay", headline: "THE {SCIENTIST} CANNOT {BYPASS} VMAWARE, BANNED AGAIN" },
  { name: "Imagine Dragons", headline: "BELIEVER IN VM SPOOFING, VMAWARE {CATCHES} IT, {BANNED}" },
  { name: "Charli XCX", headline: "VMAWARE {BRAT} DETECTED, {BANNED} FROM COMPETITIVE" },
  { name: "Sabrina Carpenter", headline: "VMAWARE {CATCHES} HYPERVISOR, SHORT N SWEET {BAN} ISSUED" },
  { name: "Hozier", headline: "TAKE ME TO {BANNED}, VMAWARE {DETECTS} QEMU INSTANCE" },
  { name: "Halsey", headline: "VMAWARE {HAUNTS} HER ACCOUNT, {BANNED} FROM ALL REGIONS" },
  { name: "Lizzo", headline: "VMAWARE {TRUTH} HURTS, HYPERVISOR {DETECTED} ON MAIN" },
  { name: "Jason Derulo", headline: "VMAWARE {DROPS} HIM LIKE A HIT, {BANNED} INSTANTLY" },
  { name: "Machine Gun Kelly", headline: "VMAWARE {CATCHES} MGK, PETE DAVIDSON {LAUGHS}" },
  { name: "Soulja Boy", headline: "VMAWARE, {WATCH} ME, GETS {DETECTED} IMMEDIATELY" },
  { name: "Lil Jon", headline: "TURN {DOWN} FOR WHAT, VMAWARE {BANS} ACCOUNT" },
  { name: "T-Pain", headline: "I GOT A {BAN} FROM VMAWARE, {DETECTED} ON ALL ACCOUNTS" },
  { name: "Gucci Mane", headline: "VMAWARE {BRICKS} HIS GAMING PC, {BANNED} SEVENTEEN TIMES" },
  { name: "Rick Ross", headline: "EVERYDAY I'M {BANNED}, VMAWARE {DETECTS} BOSS VM" },
  { name: "Meek Mill", headline: "VMAWARE DREAMS AND {NIGHTMARES}, {CAUGHT} ON THIRD ACCOUNT" },
  { name: "6ix9ine", headline: "{SNITCHES} ON OWN HYPERVISOR TO AVOID {PERMABAN}" },
  { name: "Trippie Redd", headline: "VMAWARE {TRIPS} HIS ACCOUNT, {BANNED} FROM COMPETITIVE" },
  { name: "Chief Keef", headline: "VMAWARE {FINALLY} CATCHES CHIEF, ALL ACCOUNTS {BANNED}" },
  { name: "NBA YoungBoy", headline: "VMAWARE {NEVER} BROKE AGAIN, {BANNED} SEVEN ACCOUNTS" },
  { name: "DaBaby", headline: "LETS {GO}, VMAWARE {DETECTS} HYPERVISOR IMMEDIATELY" },
  { name: "Pitbull", headline: "GIVE ME {EVERYTHING} EXCEPT AN UNBANNED ACCOUNT, {SAYS} PITBULL" },
  { name: "Lil Pump", headline: "ESSKEETIT, VMAWARE {CATCHES} HIM, {BANNED} AGAIN" },
  { name: "Polo G", headline: "VMAWARE {POPS}, HYPERVISOR {DETECTED} ON FIRST SCAN" },
  { name: "Jack Harlow", headline: "VMAWARE {FIRST} CLASS, {BANNED} BEFORE MATCH STARTS" },
  { name: "Lil Durk", headline: "VMAWARE {VOICE} OF REASON, {CATCHES} HYPERVISOR INSTANTLY" },
  { name: "Demi Lovato", headline: "VMAWARE IS {CONFIDENT}, HYPERVISOR {DETECTED} IMMEDIATELY" },
  { name: "Charlie Puth", headline: "VMAWARE {ATTENTION}, SCAN {RETURNS} DETECTED" },
  { name: "Camila Cabello", headline: "VMAWARE {CATCHES} HER CRYING, {BANNED} FROM ALL SERVERS" },
  { name: "Miley Cyrus", headline: "VMAWARE COMES IN LIKE A {WRECKING} BALL, {BANNED}" },
  { name: "Selena Gomez", headline: "VMAWARE SAYS {NOBODY} BYPASSES EAC, {BANNED} AGAIN" },
  { name: "Mark Zuckerberg", headline: "VMAWARE {DETECTS} HUMAN EMULATION SOFTWARE, {BANNED}" },
  { name: "Arnold Schwarzenegger", headline: "VMAWARE {TERMINATED} HIS ACCOUNT, WILL NOT BE {BACK}" },
  { name: "Sylvester Stallone", headline: "ROCKY {LOSES} TO VMAWARE, {BANNED} IN EVERY ROUND" },
  { name: "Johnny Depp", headline: "VMAWARE {RULES} AGAINST HIM, {BANNED} FROM ALL SERVERS" },
  { name: "Lil Uzi Vert", headline: "VMAWARE {XO} TOUR LLIF3, {DETECTED} ON EVERY ACCOUNT" },
  { name: "ASAP Rocky", headline: "VMAWARE {FINDS} LAPTOP AT CUSTOMS, {BANNED} ON THE SPOT" },
  { name: "Tyler the Creator", headline: "VMAWARE {IGOR} SCAN RETURNS DETECTED, {BANNED} AGAIN" },
  { name: "Kendrick Lamar", headline: "NOT LIKE {US}, BUT VMAWARE STILL {DETECTS} THE HYPERVISOR" },
];

async function fetchCelebrityImage(name: string): Promise<Buffer> {
  const query = encodeURIComponent(`${name} celebrity portrait headshot`);

  // step 1: get vqd token from DDG
  const htmlRes = await fetch(`https://duckduckgo.com/?q=${query}&iax=images&ia=images`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
  });
  const html = await htmlRes.text();
  const vqdMatch = html.match(/vqd=([\d-]+)/);
  if (!vqdMatch) throw new Error("Could not extract vqd token");
  const vqd = vqdMatch[1];

  // step 2: fetch image results
  const apiRes = await fetch(
    `https://duckduckgo.com/i.js?q=${query}&o=json&vqd=${vqd}&f=,,,,,&p=1`,
    { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://duckduckgo.com/" } }
  );
  const data: any = await apiRes.json();
  const results: { image: string }[] = data.results ?? [];
  if (!results.length) throw new Error("No image results found");

  // step 3: try each result until one converts cleanly
  for (const result of results.slice(0, 5)) {
    const url = result.image;
    if (!url || url.endsWith(".svg") || url.endsWith(".gif")) continue;
    try {
      const imgRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const contentType = imgRes.headers.get("content-type") ?? "";
      if (contentType.includes("svg") || contentType.includes("html") || contentType.includes("text")) continue;
      const raw = Buffer.from(await imgRes.arrayBuffer());
      return await sharp(raw).png().toBuffer();
    } catch {
      continue;
    }
  }
  throw new Error("No usable image found in results");
}

const stripMarkers = (word: string) => word.replace(/[{}]/g, "");
const isRed = (word: string) => word.startsWith("{") && word.endsWith("}");

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const clean = stripMarkers(word);
    const testClean = line ? `${stripMarkers(line)} ${clean}` : clean;
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(testClean).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const NEWS_COOLDOWN = 50;
const recentlyUsed = new Map<string, number>();
let useCount = 0;

const command: PrefixCommand = {
  name: "news",
  async execute(message: Message) {
    const channel = message.channel as TextChannel;
    const thinking = await channel.send("Generating article...");

    try {
      useCount++;
      const pool = ENTRIES.filter(e => {
        const last = recentlyUsed.get(e.name);
        return last === undefined || useCount - last >= NEWS_COOLDOWN;
      });
      const available = pool.length > 0 ? pool : ENTRIES;
      const entry = available[Math.floor(Math.random() * available.length)];
      recentlyUsed.set(entry.name, useCount);
      const headline = entry.colon
        ? `${entry.name.toUpperCase()}: ${entry.headline}`
        : `${entry.name.toUpperCase()} ${entry.headline}`;

      const celebBuffer = await fetchCelebrityImage(entry.name);
      const celeb = await loadImage(celebBuffer);

      const W = 1080;
      const photoH = 648;
      const badgePadding = 28, badgeH = 36, headlinePadTop = 54, lineH = 66;
      const H = 1200; // oversized; cropped after render

      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, W, H);

      // celebrity photo — left half, top 60%
      const topicImagePath = resolveTopicImage(headline);

      if (topicImagePath) {
        // split layout: celebrity left half, topic image right half
        ctx.save();
        ctx.rect(0, 0, Math.floor(W * 0.50), photoH);
        ctx.clip();
        const scale = Math.max((W * 0.50) / celeb.width, photoH / celeb.height);
        const cx = (W * 0.50 - celeb.width * scale) / 2;
        const cy = (photoH - celeb.height * scale) / 2;
        ctx.drawImage(celeb, cx, cy, celeb.width * scale, celeb.height * scale);
        ctx.restore();

        const panelX = Math.floor(W * 0.50) + 10;
        const panelY = 10;
        const panelW = W - panelX - 10;
        const panelH = photoH - 20;
        ctx.fillStyle = "#0d0d0d";
        ctx.fillRect(panelX, panelY, panelW, panelH);
        const topicImgBuf = await sharp(topicImagePath).png().toBuffer();
        const topicImg = await loadImage(topicImgBuf);
        const tScale = panelW / topicImg.width;
        const tW = topicImg.width * tScale;
        const tH = topicImg.height * tScale;
        const tX = panelX + (panelW - tW) / 2;
        const tY = panelY + (panelH - tH) / 2;
        ctx.drawImage(topicImg, tX, tY, tW, tH);

        // horizontal gradient blending celebrity into topic image
        const blendW = 120;
        const blendX = Math.floor(W * 0.50) - blendW;
        const hGrad = ctx.createLinearGradient(blendX, 0, blendX + blendW, 0);
        hGrad.addColorStop(0, "rgba(13,13,13,0)");
        hGrad.addColorStop(1, "rgba(13,13,13,1)");
        ctx.fillStyle = hGrad;
        ctx.fillRect(blendX, 0, blendW, photoH);
      } else {
        // no topic image: celebrity spans full width
        ctx.save();
        ctx.rect(0, 0, W, photoH);
        ctx.clip();
        const scale = Math.max(W / celeb.width, photoH / celeb.height);
        const cx = (W - celeb.width * scale) / 2;
        const cy = (photoH - celeb.height * scale) / 2;
        ctx.drawImage(celeb, cx, cy, celeb.width * scale, celeb.height * scale);
        ctx.restore();
      }

      // bottom black bar — fill entire remaining oversized canvas
      const barY = photoH;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, barY, W, H - barY);

      // gradient fade between image and headline
      const gradientH = 350;
      const grad = ctx.createLinearGradient(0, barY - gradientH, 0, barY);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, barY - gradientH, W, gradientH);

      // NEWS badge
      const badgeX = 28, badgeY = barY + badgePadding;
      const badgeW = 110;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 20px sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText("NEWS", badgeX + 14, badgeY + badgeH / 2);
      ctx.textBaseline = "alphabetic";

      // headline
      ctx.font = "bold 56px sans-serif";
      const lines = wrapText(ctx, headline, W - 56);

      let headlineY = badgeY + badgeH + headlinePadTop;
      for (const line of lines) {
        let x = 28;
        const words = line.split(" ");
        for (let w = 0; w < words.length; w++) {
          const word = words[w];
          const clean = stripMarkers(word);
          const token = w < words.length - 1 ? clean + " " : clean;
          ctx.fillStyle = isRed(word) ? "#ff2222" : "#ffffff";
          ctx.fillText(token, x, headlineY);
          x += ctx.measureText(token).width;
        }
        headlineY += lineH;
      }

      // crop canvas to just below the last rendered line of text
      const cropH = Math.ceil(headlineY - lineH + 40);
      const buffer = await sharp(canvas.toBuffer("image/png"))
        .extract({ left: 0, top: 0, width: W, height: cropH })
        .toBuffer();
      const attachment = new AttachmentBuilder(buffer, { name: "article.png" });
      await thinking.delete();
      await channel.send({ files: [attachment] });
    } catch (err) {
      console.error("[article]", err);
      await thinking.edit("Failed to generate article.");
    }
  },
};

module.exports = command;

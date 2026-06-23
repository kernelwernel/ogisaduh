import { Message, TextChannel, AttachmentBuilder } from "discord.js";
import { PrefixCommand } from "../types";
import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas";
import sharp from "sharp";
import { readdirSync } from "fs";
import { join } from "path";

const TOPIC_IMAGES_DIR = join(__dirname, "..", "..", "topic_images");
const PROFILE_IMG_PATH = join(__dirname, "..", "..", "assets", "profile.png");

const TOPIC_KEYWORDS: string[] = [
  "VMAWARE", "QEMU", "BATTLEYE", "VANGUARD", "FACEIT",
  "RICOCHET", "VAC", "VALORANT", "ROBLOX",
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
  { name: "Kanye West", headline: "{DETECTED} BY BATTLEYE HYPERVISOR CHECK IN {MINUTES}, IMMEDIATELY ANNOUNCES A NEW {RELIGION} AND BLAMES THE {SCAN}", colon: true },
  { name: "Lil Uzi Vert", headline: "REPORTEDLY {CRIES} AFTER AUTOVIRT GETS {FLAGGED}" },
  { name: "Travis Scott", headline: "{CAUGHT} RUNNING QEMU+KVM DURING STREAM, BAN NOTICE {PROJECTED} ONTO STAGE SCREEN BY ACCIDENT" },
  { name: "Tyler the Creator", headline: "{FAILS} NIKA-READ-ONLY BYPASS {THREE} TIMES IN A ROW, TWEETS AT VMAWARE DEVS, GETS {BLOCKED}" },
  { name: "Kendrick Lamar", headline: "DROPS DISS TRACK ON EAC AFTER KERNEL {DETECTION}, CALLS TIMING CHECKS \"{BRUTAL}\" AND {COWARDLY}" },
  { name: "Playboi Carti", headline: "ATTEMPTS VM SPOOF ON STREAM, GETS {IMMEDIATELY} {DETECTED}, ENTIRE CHAT {SCREAMS} IN CAPS LOCK" },
  { name: "Young Thug", headline: "{LOSES} BATTLEYE APPEAL, SUBMITS {SECOND} APPEAL CALLING ANTICHEAT A SNITCH, THIRD APPEAL {ALSO} DENIED" },
  { name: "Future", headline: "GIVES {UP} ON AUTOVIRT, SAYS TIMING CHECK {UNFAIR}" },
  { name: "Offset", headline: "{DETECTED} BY VMAWARE ON FIRST TRY, {BLAMES} HIS PC" },
  { name: "21 Savage", headline: "{FAILS} PCI VENDOR ID CHECK ON STREAM, CALLS VMAWARE DEVS LIVE, DEVS DO NOT {PICK} {UP}" },
  { name: "Lil Baby", headline: "{CRIES} AFTER BATTLEYE {FLAGS} HIS HYPERVISOR QUERY, SUBMITS TEARFUL VIDEO APPEAL, BATTLEYE {RESPONDS} WITH HWID BAN" },
  { name: "Gunna", headline: "ATTEMPTS QEMU SPOOF USING GUIDE FROM A {FOURTEEN} YEAR OLD ON YOUTUBE, CPU HEURISTICS {IMMEDIATELY} DISAGREES" },
  { name: "Chief Keef", headline: "{LOSES} HWID BAN APPEAL, SUBMITS ANOTHER ONE CALLING BATTLEYE A {SNITCH}, ALL FOUR APPEALS {DENIED}" },
  { name: "ASAP Rocky", headline: "{DETAINED} AT AIRPORT, VMAWARE {FOUND} ON LAPTOP" },
  { name: "NBA YoungBoy", headline: "VMAWARE DETECTION RATE {100} PERCENT ACROSS ALL {TWELVE} ACCOUNTS, REPORTEDLY {IMPRESSED} BY THE CONSISTENCY", colon: true },
  { name: "Cardi B", headline: "{FAILS} EDID CHECK {FOUR} TIMES IN A ROW, {BLAMES} OFFSET, SAYS VMAWARE IS {FIXED} AND RIGGED" },
  { name: "Post Malone", headline: "GIVES {UP} CHEATING AFTER NVRAM CHECK {DESTROYS} HIM, SHOWS UP TO ANTICHEAT CONVENTION TO {PERSONALLY} {CONGRATULATE} THE DEVELOPERS" },
  { name: "Lil Durk", headline: "ATTEMPTS AUTOVIRT BYPASS AFTER WATCHING ONE TUTORIAL, {FLAGGED} IN UNDER A SECOND, {BLAMES} THE VIDEO CREATOR" },
  { name: "Nicki Minaj", headline: "SMBIOS INTEGRITY CHECK RETURNS {FAILED}, {LEAKED} SCREENSHOT SHOWS", colon: true },
  { name: "Jack Harlow", headline: "TRIES NIKA-READ-ONLY BYPASS {TWICE} ON STREAM, BOTH TIMES {DETECTED}, CHAT {DONATES} TO ANTICHEAT DEVS IN RESPONSE" },
  { name: "Polo G", headline: "{FAILS} DARK BYTES HYPERVISOR CHECK, RELEASES DISS TRACK CALLING DEVS {CORRUPT}, DEVS RESPOND WITH {ANOTHER} BAN" },
  { name: "Doja Cat", headline: "{RAGE} QUITS AFTER EAC {FLAGS} HER KERNEL DRIVER" },
  { name: "SZA", headline: "{CAUGHT} USING AUTOVIRT IN RANKED MATCH, ARGUES SHE WAS ONLY {TESTING} IT, BANNED {PERMANENTLY} ANYWAY" },
  { name: "The Weeknd", headline: "VMAWARE {DETECTS} HYPERVISOR IN UNDER {TWO} SECONDS, DEVS PUBLICLY {APOLOGIZE} FOR NOT BEING FASTER", colon: true },
  { name: "Billie Eilish", headline: "{FAILS} CPU HEURISTICS CHECK, {BLAMES} HER PROCESSOR, THEN BLAMES THE CABLE, THEN {BLAMES} THE CHAIR" },
  { name: "Olivia Rodrigo", headline: "NIKA-READ-ONLY BYPASS {FAILS} AT {FINAL} STEP AFTER FIVE HOURS, {CRIES} ON STREAM AND WRITES SONG ABOUT IT" },
  { name: "Lil Nas X", headline: "ATTEMPTS VM SPOOF IN ROBLOX, GETS {BANNED} WITHIN MINUTES, RELEASES MUSIC VIDEO SET IN {ANTICHEAT} HELL" },
  { name: "DaBaby", headline: "SPOTTED {GOOGLING} HOW TO {BYPASS} VMAWARE AT 3AM" },
  { name: "Snoop Dogg", headline: "SAYS \"EAC TIMING CHECK IS {DIABOLICAL} AND {UNFAIR}\"" },
  { name: "Ice Cube", headline: "{FAILS} VMAWARE AFTER FOLLOWING YOUTUBE TUTORIAL {EXACTLY}" },
  { name: "Dr. Dre", headline: "SPENDS {MILLIONS} ON CUSTOM VM SPOOF, BATTLEYE {DISAGREES} IN UNDER A SECOND, SNOOP DOGG {LAUGHS}" },
  { name: "Eminem", headline: "WRITES DISS TRACK ABOUT VMAWARE AFTER GETTING {DETECTED} AND {BANNED}" },
  { name: "Jay-Z", headline: "VMAWARE SCAN COMPLETE, VM CONFIRMATION TRUE, {HWID} {BANNED}", colon: true },
  { name: "Beyoncé", headline: "ATTEMPTS QEMU BYPASS, SMBIOS CHECK {ENDS} HER {CAREER}" },
  { name: "Rihanna", headline: "{FAILS} LOW FILE ACCESS COUNT CHECK IN {FINAL} ROUND, SPENDS THREE HOURS GOOGLING WHAT A FILE {ACCESS} IS" },
  { name: "Lil Pump", headline: "{FAILS} VMAWARE {SEVEN} TIMES, STILL DOES NOT UNDERSTAND WHY" },
  { name: "6ix9ine", headline: "{SNITCHES} ON OWN VM SPOOF TO AVOID {LONGER} HWID BAN" },
  { name: "Trippie Redd", headline: "{FAILS} KERNEL OBJECT CHECK LIVE ON DISCORD, {BLAMES} WINDOWS UPDATE AND THEN {BLAMES} HIS DOG" },
  { name: "Rick Ross", headline: "VMAWARE SCAN {DETECTS} QEMU BRAND ON BOSS {GAMING} PC, BLAMES HIS INTERN, INTERN {ALSO} GETS BANNED", colon: true },
  { name: "Meek Mill", headline: "{LOSES} BATTLEYE APPEAL FOR THE {THIRD} TIME THIS YEAR, DRAKE {TWEETS} ABOUT IT" },
  { name: "Lil Wayne", headline: "SAYS \"EAC IS THE REAL JAIL\" AFTER GETTING {HWID} {BANNED}" },
  { name: "Gucci Mane", headline: "VMAWARE CONFIRMED {TRUE} ON ALL {FOURTEEN} ACCOUNTS, IMMEDIATELY ATTEMPTS TO {PURCHASE} A FIFTEENTH", colon: true },
  { name: "T-Pain", headline: "AUTOTUNES VMAWARE ERROR MESSAGE, STILL GETS {DETECTED} AND {BANNED}" },
  { name: "Soulja Boy", headline: "CLAIMS HE {INVENTED} VM SPOOFING, COMMUNITY {DISAGREES}" },
  { name: "Lil Jon", headline: "{SCREAMS} AT BATTLEYE FOR {FLAGGING} HIS HYPERVISOR QUERY" },
  { name: "Pitbull", headline: "MR WORLDWIDE {FAILS} VM SPOOF IN {EVERY} REGION", colon: true },
  { name: "Taylor Swift", headline: "{FAILS} VMAWARE BYPASS IN FRONT OF {FORTY} THOUSAND FANS, SWIFTIES IMMEDIATELY {BLAME} KANYE" },
  { name: "Harry Styles", headline: "{DETECTED} BY BATTLEYE HYPERVISOR SCAN, {BANNED} FROM COMPETITIVE, FANS {MAIL} GLITTER TO DEVS", colon: true },
  { name: "Ed Sheeran", headline: "WRITES SONG ABOUT {FAILING} QEMU BYPASS, BATTLEYE DEVS {ADD} IT TO OFFICE PLAYLIST, STILL {BANNED}" },
  { name: "Justin Bieber", headline: "{HWID} {BANNED}, SAYS \"VMAWARE IS NEVER LETTING HIM {GO}\"" },
  { name: "Ariana Grande", headline: "VMAWARE SCAN RETURNS, \"ONE LAST TIME\", VM {DETECTED} AND {BANNED}", colon: true },
  { name: "Lady Gaga", headline: "{FAILS} EAC KERNEL SCAN THREE SEPARATE TIMES, {BANNED} FOR LIFE, RELEASES STATEMENT CALLING IT {UNJUST}" },
  { name: "Katy Perry", headline: "{FAILS} NIKA-READ-ONLY BYPASS, ATTEMPTS MANUAL OVERRIDE, BOTH {FAIL}, ACCOUNT {PERMANENTLY} TERMINATED" },
  { name: "Selena Gomez", headline: "{DETECTED} BY VMAWARE ON {FIVE} SEPARATE ACCOUNTS, ALL {BANNED} FROM RANKED WITHIN THE SAME HOUR", colon: true },
  { name: "Miley Cyrus", headline: "{FAILS} SMBIOS INTEGRITY CHECK, SAYS \"SHE CANNOT BE {TAMED}\"" },
  { name: "Demi Lovato", headline: "CALLS BATTLEYE {DETECTION} {TRIGGERING} AND HARMFUL" },
  { name: "Charlie Puth", headline: "HEARS VMAWARE {ERROR} SOUND, {BANNED} BEFORE SONG RELEASES" },
  { name: "Sam Smith", headline: "{DETECTED} BY EAC KERNEL SCAN, {BANNED} IN UNHOLY FASHION WITH ALL {SIX} ACCOUNTS TERMINATED AT ONCE", colon: true },
  { name: "Adele", headline: "{FAILS} QEMU BYPASS, SAYS \"HELLO FROM THE {BANNED} SIDE\"" },
  { name: "Shawn Mendes", headline: "ATTEMPTS AUTOVIRT BYPASS USING ONLINE GUIDE, {CAUGHT} IN UNDER A MINUTE AND {PERMANENTLY} BANNED" },
  { name: "Camila Cabello", headline: "VMAWARE {CONFIRMS} HYPERVISOR IN {PLAIN} SIGHT ON STREAM, AUDIENCE {WATCHES} LIVE AS BAN NOTICE APPEARS", colon: true },
  { name: "Halsey", headline: "SAYS \"BATTLEYE IS {SYSTEMATIC} AND {CORRUPT}\" AFTER BAN" },
  { name: "Lizzo", headline: "{FAILS} PCI VENDOR ID CHECK DESPITE CHANGING IT {FOUR} TIMES, PLAYS FLUTE OUTSIDE BATTLEYE HQ IN {PROTEST}" },
  { name: "Jason Derulo", headline: "{FALLS} DOWN STAIRS AFTER READING VMAWARE {BAN} NOTICE" },
  { name: "Charli XCX", headline: "GOES {BRAT} AFTER BATTLEYE {FLAGS} HER HYPERVISOR LIVE ON STREAM, {THROWS} KEYBOARD AND GOES OFFLINE" },
  { name: "Sabrina Carpenter", headline: "{FAILS} FIRMWARE INTEGRITY CHECK WITH ALL SPOOFS {ACTIVE}, {BANNED} FROM COMPETITIVE WITH NO APPEAL" },
  { name: "Hozier", headline: "SAYS \"BATTLEYE IS THE {DEVIL} AND {DETECTION} IS HELL\"" },
  { name: "Coldplay", headline: "{FAIL} VMAWARE BYPASS TOGETHER AS A BAND, RELEASE CONCEPT ALBUM ABOUT BEING {DETECTED}, STILL ALL {BANNED}" },
  { name: "Imagine Dragons", headline: "{DETECTED} BY EAC TIMING CHECK ON FIRST BOOT, {BANNED} FROM ALL SERVERS, RELEASES ANTHEM ABOUT {INJUSTICE}", colon: true },
  { name: "Twenty One Pilots", headline: "BOTH MEMBERS {HWID} {BANNED} AT SAME TIME DURING LIVE TOURNAMENT STREAM, CROWD {GOES} COMPLETELY SILENT" },
  { name: "Fall Out Boy", headline: "{FAILS} NIKA-READ-ONLY BYPASS, {BANNED} FOR \"CENTURIES\"" },
  { name: "My Chemical Romance", headline: "VMAWARE SCAN RETURNS {TRUE}, \"THEY ARE {NOT} OKAY\"", colon: true },
  { name: "Green Day", headline: "{FAILS} BATTLEYE CHECK, \"AMERICAN {IDIOT}\" GETS HWID BANNED" },
  { name: "Blink-182", headline: "ATTEMPTS QEMU SPOOF, \"ALL THE SMALL THINGS\" GET {DETECTED} AND {BANNED}" },
  { name: "Foo Fighters", headline: "{FAIL} VMAWARE AFTER DAVE GROHL TYPES IN {WRONG} KERNEL" },
  { name: "Linkin Park", headline: "{DETECTED} BY EAC, \"IN THE END\" IT DID {NOT} MATTER", colon: true },
  { name: "Metallica", headline: "{FAILS} DARK BYTES HYPERVISOR CHECK, CALLS IT \"{UNFORGIVEN}\"" },
  { name: "Machine Gun Kelly", headline: "ATTEMPTS VMAWARE {BYPASS} WHILE PUBLICLY FEUDING WITH EMINEM, GETS {CAUGHT} IMMEDIATELY, EMINEM {LAUGHS}" },
  { name: "Elvis Presley", headline: "ESTATE CONFIRMS HE {NEVER} BYPASSED BATTLEYE, {BANNED} POSTHUMOUSLY" },
  { name: "Michael Jackson", headline: "ESTATE {SUES} VMAWARE FOR {DETECTING} THRILLER GAMING PC" },
  { name: "Freddie Mercury", headline: "GHOST ATTEMPTS QEMU BYPASS FROM BEYOND THE GRAVE, {FAILS} FIRMWARE CHECK, ENTIRE ESTATE {DEVASTATED}" },
  { name: "LeBron James", headline: "VMAWARE {DETECTED} DURING HALFTIME, {BLAMES} TEAMMATES", colon: true },
  { name: "Cristiano Ronaldo", headline: "{FAILS} BATTLEYE CHECK, SCREAMS \"SIUUU\", GETS {BANNED}" },
  { name: "Lionel Messi", headline: "{DETECTED} BY EAC DURING WORLD CUP CELEBRATION STREAM, GOAT STATUS {REVOKED}, RONALDO {LAUGHS} IN RESPONSE", colon: true },
  { name: "Conor McGregor", headline: "ATTEMPTS VMAWARE BYPASS AT 4AM WHILE DRUNK, {TAPS} {OUT} IN UNDER THIRTY SECONDS, POSTS ABOUT IT ANYWAY" },
  { name: "Floyd Mayweather", headline: "SPENDS {FIFTY} MILLION ON VM SPOOF, STILL {DETECTED} IN UNDER A SECOND, CELEBRATES {UNDEFEATED} RECORD ANYWAY" },
  { name: "Mike Tyson", headline: "{PUNCHES} MONITOR AFTER VMAWARE RETURNS VM LIKELINESS {100}" },
  { name: "Jake Paul", headline: "{FAILS} NIKA-READ-ONLY BYPASS, CLAIMS HE {STILL} WON" },
  { name: "Logan Paul", headline: "VMAWARE {DETECTS} HYPERVISOR, CHALLENGES DEVELOPER TO A {BOXING} MATCH, DEVELOPER {DECLINES}", colon: true },
  { name: "MrBeast", headline: "OFFERS {MILLION} DOLLARS TO BYPASS VMAWARE, {NOBODY} SUCCEEDS" },
  { name: "Elon Musk", headline: "SAYS \"VMAWARE IS {BASED}\" AFTER IT {DETECTS} HIS OWN PC" },
  { name: "Mark Zuckerberg", headline: "VMAWARE CONFIRMS HUMAN SIMULATION {DETECTED} AND {BANNED}", colon: true },
  { name: "Gordon Ramsay", headline: "CALLS VMAWARE BYPASS ATTEMPT \"AN {ABSOLUTE} {DISGRACE}\"" },
  { name: "Keanu Reeves", headline: "{FAILS} NIKA-READ-ONLY BYPASS FOR THE FIRST TIME IN HIS LIFE, COMMUNITY {DEVASTATED}, PETITIONS {CIRCULATE}" },
  { name: "Johnny Depp", headline: "VMAWARE SCAN COMPLETE, {DETECTED}, AMBER HEARD {LAUGHS}", colon: true },
  { name: "Will Smith", headline: "SLAPS BATTLEYE DEVELOPER AT ANTICHEAT AWARDS CEREMONY AFTER {HWID} {BAN}, REFUSES TO {APOLOGIZE} OR LEAVE" },
  { name: "Dwayne Johnson", headline: "{FAILS} VMAWARE, EVEN THE ROCK CANNOT {BYPASS} EAC", colon: true },
  { name: "Kevin Hart", headline: "{FAILS} VMAWARE BYPASS AFTER FOURTEEN {ATTEMPTS}, MAKES COMEDY SPECIAL ABOUT IT, STILL {CANNOT} BYPASS EAC", colon: true },
  { name: "Ryan Reynolds", headline: "VMAWARE {DETECTED}, MAKES ENTIRE AD CAMPAIGN ABOUT GETTING {BANNED}, STILL {CANNOT} BYPASS EAC", colon: true },
  { name: "Tom Cruise", headline: "ATTEMPTS VMAWARE BYPASS HIMSELF, \"MISSION {IMPOSSIBLE}\", {BANNED}" },
  { name: "Arnold Schwarzenegger", headline: "SAYS \"HE WILL BE {BACK}\" AFTER {HWID} {BAN}, RETURNS ON {SEVEN} ALTERNATE ACCOUNTS, ALL IMMEDIATELY {BANNED}" },
  { name: "Sylvester Stallone", headline: "{FAILS} EAC CHECK, \"YO ADRIAN, I GOT {DETECTED}\"" },
  { name: "Bruce Willis", headline: "{DETECTED} BY VMAWARE SCAN ON FIRST TRY, {BANNED} FROM ALL SERVERS WHILE STILL {LOADING} INTO FIRST GAME", colon: true },
  // VANGUARD entries
  { name: "Drake", headline: "VANGUARD SCAN {COMPLETE}, VM {CONFIRMED} ON GAMING RIG", colon: true },
  { name: "Travis Scott", headline: "VANGUARD {CATCHES} HYPERVISOR DURING LIVE STREAM, CROWD {WATCHES}", colon: true },
  { name: "Nicki Minaj", headline: "VANGUARD {EXPOSES} HYPERVISOR LIVE ON INSTAGRAM, {BANNED}", colon: true },
  { name: "Post Malone", headline: "VANGUARD {DETECTS} VM IN UNDER A SECOND, COMPLETELY {DEVASTATED}", colon: true },
  { name: "Young Thug", headline: "VANGUARD {FINDS} HIDDEN QEMU INSTANCE INSIDE RECORDING STUDIO PC, ENTIRE {LABEL} GETS {HWID} BANNED", colon: true },
  { name: "Taylor Swift", headline: "VANGUARD {DETECTS} HYPERVISOR, SWIFTIES {BLAME} KANYE", colon: true },
  { name: "The Weeknd", headline: "AFTER HOURS OF {TRYING}, VANGUARD STILL {DETECTS} THE VM" },
  { name: "Harry Styles", headline: "VANGUARD {CATCHES} AUTOVIRT DURING SOLD-OUT TOURNAMENT STREAM, FANS {DEVASTATED}, ENTIRE DISCORD {MELTS} DOWN", colon: true },
  { name: "Adele", headline: "\"ROLLING IN THE {BANS}\", VANGUARD {CATCHES} THIRD ACCOUNT" },
  { name: "Beyoncé", headline: "VANGUARD FINDS HYPERVISOR, {BANS} ALL FORTY-TWO {ACCOUNTS}", colon: true },
  { name: "Snoop Dogg", headline: "\"DROP IT LIKE IT IS {HOT}\", VANGUARD {BANS} ACCOUNT INSTANTLY" },
  { name: "LeBron James", headline: "VANGUARD {BANS} ACCOUNT, SAYS IT WAS {GOAT} LEVEL UNFAIR", colon: true },
  { name: "Conor McGregor", headline: "VANGUARD TAPS HIM {OUT} IN UNDER TWO SECONDS, {BANNED}", colon: true },
  { name: "Floyd Mayweather", headline: "GOES {UNDEFEATED} IN BOXING, {LOSES} TO VANGUARD SCAN" },
  { name: "MrBeast", headline: "GIVES AWAY GAMING PC, VANGUARD {DETECTS} VM ON ALL {FIVE}" },
  { name: "Gordon Ramsay", headline: "CALLS VANGUARD BYPASS ATTEMPT \"{RAW}\", {BANNED} FROM LOBBY" },
  { name: "Tom Cruise", headline: "VANGUARD {CATCHES} HYPERVISOR DURING RANKED MATCH, {BANNED} MID CUTSCENE IN FRONT OF THE {ENTIRE} LOBBY", colon: true },
  { name: "Freddie Mercury", headline: "\"BOHEMIAN {BANNED}\", VANGUARD {CAUGHT} THE HYPERVISOR" },
  { name: "Metallica", headline: "\"MASTER OF {BANNED}\", VANGUARD {DETECTS} QEMU ON TOUR BUS" },
  { name: "My Chemical Romance", headline: "\"I'M {NOT} OKAY\", VANGUARD {DETECTED} ALL THREE ACCOUNTS" },
  { name: "Charli XCX", headline: "VANGUARD \"{BRAT}\" {DETECTED} AND ACCOUNT {BANNED}, POSTS TWENTY-TWEET UNHINGED RESPONSE CALLING DEVS {LOSERS}", colon: true },
  { name: "Hozier", headline: "\"TAKE ME TO {BANNED}\", VANGUARD {DETECTS} QEMU INSTANCE" },
  { name: "Lil Jon", headline: "\"TURN {DOWN} FOR WHAT\", VANGUARD {BANS} ACCOUNT ANYWAY, RESPONDS BY {SCREAMING} AT SUPPORT FOR TWO HOURS" },
  { name: "Rick Ross", headline: "\"EVERYDAY I'M {BANNED}\", VANGUARD {DETECTS} BOSS VM" },
  { name: "Lil Pump", headline: "VANGUARD {CATCHES} HIM FOR THE {FOURTH} TIME THIS MONTH, STILL HAS NO IDEA WHAT A HYPERVISOR IS", colon: true },
  { name: "Demi Lovato", headline: "VANGUARD IS {MERCILESS}, HYPERVISOR {DETECTED} IMMEDIATELY", colon: true },
  { name: "Miley Cyrus", headline: "VANGUARD COMES IN LIKE A \"{WRECKING} BALL\", {BANNED}", colon: true },
  { name: "Arnold Schwarzenegger", headline: "VANGUARD {TERMINATED} HIS ACCOUNT, \"WILL NOT BE {BACK}\"", colon: true },
  { name: "Lil Uzi Vert", headline: "VANGUARD \"{XO} TOUR LLIF3\", {DETECTED} ON EVERY ACCOUNT", colon: true },
  { name: "Kendrick Lamar", headline: "\"NOT LIKE {US}\", BUT VANGUARD STILL {DETECTS} THE HYPERVISOR" },

  // FACEIT entries
  { name: "Kanye West", headline: "SPENDS {MILLIONS} ON CUSTOM PC, FACEIT STILL {DETECTS} IT" },
  { name: "Eminem", headline: "WRITES EIGHT MILE VERSE ABOUT {FAILING} FACEIT {CHECK}" },
  { name: "Lil Wayne", headline: "CALLS FACEIT \"THE CARTER FIVE OF {ANTICHEAT}\", STILL GETS {BANNED}" },
  { name: "Offset", headline: "{CAUGHT} BY FACEIT WITH HYPERVISOR RUNNING ON SECOND ACCOUNT, {BANNED} IMMEDIATELY, THIRD ACCOUNT {PENDING}" },
  { name: "Playboi Carti", headline: "\"WHOLE LOTTA VM {DETECTED}\", FACEIT SAYS \"WHOLE LOTTA {BANNED}\"" },
  { name: "Olivia Rodrigo", headline: "FACEIT {KILLS} HER MAIN ACCOUNT IN A {BRUTAL} SCAN, SECOND ACCOUNT {BANNED} THREE MINUTES LATER SAME DAY", colon: true },
  { name: "Doja Cat", headline: "FACEIT {EXPOSES} QEMU BUILD LIVE ON TWITCH, {BANNED}", colon: true },
  { name: "Ed Sheeran", headline: "FACEIT SCAN {RUINS} GAMING SESSION, ACCUSES OPPONENT OF {CHEATING}, GETS {HWID} BANNED INSTEAD", colon: true },
  { name: "Justin Bieber", headline: "\"SORRY\", FACEIT {DETECTED} THE HYPERVISOR, {BANNED}" },
  { name: "Lady Gaga", headline: "FACEIT {DETECTS} VM, \"POKER FACE\" CANNOT {HIDE} IT", colon: true },
  { name: "Rihanna", headline: "\"WORK, WORK, WORK\", FACEIT STILL {DETECTS}, STILL {BANNED}" },
  { name: "Jay-Z", headline: "\"NINETY-NINE PROBLEMS\", FACEIT {DETECTION} IS {ALL} OF THEM", colon: true },
  { name: "Eminem", headline: "\"LOSES HIMSELF\" IN FACEIT {SCAN}, ACCOUNT {TERMINATED}" },
  { name: "Lionel Messi", headline: "FACEIT SCAN SHOWS {DETECTED}, GOAT STATUS {UNDER} REVIEW", colon: true },
  { name: "Jake Paul", headline: "FACEIT {BEATS} HIM AGAIN, CLAIMS SCAN WAS {RIGGED}", colon: true },
  { name: "Elon Musk", headline: "BUYS FACEIT TO {DELETE} HIS BAN, STILL GETS {DETECTED}" },
  { name: "Keanu Reeves", headline: "{BANNED} BY FACEIT FOR VM USE, FANS BUILD {MEMORIAL} OUTSIDE ANTICHEAT HEADQUARTERS, DEVS {CONFUSED}" },
  { name: "Will Smith", headline: "FACEIT {BANS} HIM AGAIN, {SLAPS} MONITOR IN RESPONSE", colon: true },
  { name: "Michael Jackson", headline: "FACEIT {DETECTS} THRILLER GAMING PC, ESTATE {SUES}", colon: true },
  { name: "Green Day", headline: "\"WAKE ME UP WHEN {FACEIT} {ENDS}\", SAYS BANNED MEMBER" },
  { name: "Fall Out Boy", headline: "\"CENTURIES\" OF {TRYING}, FACEIT {BANS} THEM EVERY TIME" },
  { name: "Sabrina Carpenter", headline: "FACEIT {CATCHES} HYPERVISOR, \"SHORT N SWEET\" {BAN} ISSUED", colon: true },
  { name: "Lizzo", headline: "FACEIT \"{TRUTH} HURTS\", HYPERVISOR {DETECTED} ON MAIN", colon: true },
  { name: "Machine Gun Kelly", headline: "FACEIT {CATCHES} MGK ON MAIN AND SMURF ACCOUNT, PETE DAVIDSON {LAUGHS}, MEGAN FOX {FILES} DIVORCE PAPERS", colon: true },
  { name: "Gucci Mane", headline: "FACEIT {BRICKS} HIS GAMING PC, {BANNED} SEVENTEEN TIMES", colon: true },
  { name: "Trippie Redd", headline: "FACEIT {TRIPS} HIS ACCOUNT, {BANNED} FROM COMPETITIVE", colon: true },
  { name: "Jack Harlow", headline: "ATTEMPTS TO BUY \"{FIRST} CLASS\" ANTICHEAT BYPASS, FACEIT {DETECTS} IT IMMEDIATELY, {BANNED} BEFORE MATCH STARTS", colon: true },
  { name: "Charlie Puth", headline: "FACEIT \"{ATTENTION}\", SCAN {RETURNS} DETECTED IMMEDIATELY, PULLS LAPTOP OUT MID-CONCERT TO CHECK {BAN} NOTICE", colon: true },
  { name: "Sylvester Stallone", headline: "ROCKY {LOSES} TO FACEIT, {BANNED} IN EVERY ROUND" },
  { name: "Tyler the Creator", headline: "FACEIT \"{IGOR}\" SCAN RETURNS DETECTED, {BANNED} AGAIN", colon: true },

  // RICOCHET entries
  { name: "Cardi B", headline: "GOES {OFFSET} TRYING TO {BYPASS} RICOCHET CHECK, CALLS ANTICHEAT HELPDESK AND {THREATENS} LEGAL ACTION LIVE" },
  { name: "Future", headline: "\"{MASK} OFF\", HYPERVISOR {DETECTED} BY RICOCHET SCAN" },
  { name: "Gunna", headline: "WALKS IN ON RICOCHET SCAN {COMPLETING}, {BANNED} LIVE ON STREAM" },
  { name: "Billie Eilish", headline: "{BANNED} FROM RANKED, SAYS RICOCHET IS \"{BAD} GUY\"" },
  { name: "SZA", headline: "RICOCHET {FINDS} HYPERVISOR IMMEDIATELY ON FIRST SCAN, {QUITS} COMPETITIVE AND {DELETES} ALL GAMING ACCOUNTS", colon: true },
  { name: "Shawn Mendes", headline: "\"STITCHES\" ON RICOCHET REPORT SHOW {DETECTED}, {HWID} BANNED" },
  { name: "Katy Perry", headline: "{ROARS} AT RICOCHET DEVELOPER DURING PRESS CONFERENCE AFTER {HWID} {BAN} ON ALL THREE ACCOUNTS SIMULTANEOUSLY" },
  { name: "Dr. Dre", headline: "STILL {BANNED}, RICOCHET FOUND QEMU ON {COMPTON} GAMING PC" },
  { name: "Cristiano Ronaldo", headline: "RICOCHET {DETECTED} HYPERVISOR, CR7 {CRIES} IN PRESS CONFERENCE", colon: true },
  { name: "Mike Tyson", headline: "RICOCHET {KNOCKS} OUT HIS ACCOUNT, {BANNED} IN FIRST ROUND", colon: true },
  { name: "Logan Paul", headline: "POSTS RICOCHET {BAN} CLIP TO YOUTUBE, STILL GETS {MOCKED}" },
  { name: "Ryan Reynolds", headline: "RICOCHET {RUINS} GAMING SPONSOR DEAL, {BANNED} ON CAMERA", colon: true },
  { name: "Dwayne Johnson", headline: "{BODY} {SLAMS} GAMING RIG AFTER RICOCHET BANS ALL ACCOUNTS, VOWS TO FIGHT DEVELOPERS IN THE {SQUARED} CIRCLE" },
  { name: "Elvis Presley", headline: "RICOCHET {BANS} ESTATE ACCOUNT, ELVIS HAS {LEFT} THE LOBBY", colon: true },
  { name: "Linkin Park", headline: "\"IN THE {END}\", RICOCHET {CAUGHT} THE HYPERVISOR ANYWAY" },
  { name: "Coldplay", headline: "\"THE {SCIENTIST}\" CANNOT {BYPASS} RICOCHET, BANNED AGAIN" },
  { name: "Halsey", headline: "RICOCHET {HAUNTS} HER ACCOUNT, {BANNED} FROM ALL REGIONS", colon: true },
  { name: "Jason Derulo", headline: "RICOCHET {DROPS} HIM LIKE A HIT, {BANNED} INSTANTLY", colon: true },
  { name: "Meek Mill", headline: "RICOCHET \"DREAMS AND {NIGHTMARES}\", {CAUGHT} ON THIRD ACCOUNT", colon: true },
  { name: "Chief Keef", headline: "RICOCHET {FINALLY} CATCHES CHIEF, ALL ACCOUNTS {BANNED}", colon: true },
  { name: "Polo G", headline: "RICOCHET {POPS} OFF AND {CATCHES} HYPERVISOR ON FIRST SCAN, ALL FOURTEEN ACCOUNTS {TERMINATED} WITHOUT WARNING", colon: true },
  { name: "Camila Cabello", headline: "RICOCHET {CATCHES} HER CRYING, {BANNED} FROM ALL SERVERS", colon: true },
  { name: "Mark Zuckerberg", headline: "RICOCHET {DETECTS} HUMAN EMULATION SOFTWARE, {BANNED}", colon: true },
  { name: "Johnny Depp", headline: "RICOCHET {RULES} AGAINST HIM FOR THE FIFTH TIME, {BANNED} FROM ALL SERVERS, AMBER HEARD {CELEBRATES} ON TWITTER", colon: true },

  // VAC entries
  { name: "21 Savage", headline: "{CAUGHT} RUNNING QEMU ON MAIN RIG, VAC {WAVE} HITS LOBBY" },
  { name: "Lil Baby", headline: "VAC {WAVE} HITS, ACCOUNT {TERMINATED} WITH NO APPEAL", colon: true },
  { name: "Ariana Grande", headline: "VAC SCAN {RETURNS} TRUE, \"THANK YOU, {NEXT}\", ACCOUNT ALSO BANNED", colon: true },
  { name: "Sam Smith", headline: "VAC {WAVE} ROLLS OUT, {BANNED} IN UNHOLY FASHION", colon: true },
  { name: "Ice Cube", headline: "\"TODAY WAS A GOOD DAY\" UNTIL VAC {DETECTED} THE {HYPERVISOR}" },
  { name: "Kevin Hart", headline: "VAC {WAVE} DETECTED ON SECOND ACCOUNT IN ONE WEEK, {SCREAMS} AT MONITOR FOR TWENTY MINUTES ON STREAM", colon: true },
  { name: "Blink-182", headline: "\"ALL THE SMALL THINGS\" GET {DETECTED}, VAC {WAVE} CONFIRMED" },
  { name: "Imagine Dragons", headline: "\"BELIEVER\" IN VM SPOOFING FOR {SEVEN} YEARS STRAIGHT, VAC {WAVE} COMES OUT OF NOWHERE AND {CATCHES} EVERYTHING" },
  { name: "Soulja Boy", headline: "VAC {WAVE}, \"{WATCH} ME\", GETS {DETECTED} IMMEDIATELY", colon: true },
  { name: "T-Pain", headline: "\"I GOT A {BAN}\" FROM VAC {WAVE}, {DETECTED} ON ALL ACCOUNTS" },
  { name: "NBA YoungBoy", headline: "VAC {WAVE}, \"{NEVER} BROKE AGAIN\", {BANNED} SEVEN ACCOUNTS", colon: true },
  { name: "DaBaby", headline: "\"LETS {GO}\", VAC {WAVE} DETECTS HYPERVISOR IMMEDIATELY" },
  { name: "Pitbull", headline: "\"GIVE ME {EVERYTHING}\" EXCEPT A VAC {WAVE}, STATEMENT {IGNORED} BY DEVS, ALL NINE ACCOUNTS {BANNED} ANYWAY", colon: true },
  { name: "Lil Durk", headline: "VAC {WAVE} OF REASON, {CATCHES} HYPERVISOR INSTANTLY", colon: true },
  { name: "Selena Gomez", headline: "VAC {WAVE} SAYS {NOBODY} BYPASSES IT, {BANNED} AGAIN", colon: true },
  { name: "ASAP Rocky", headline: "VAC {WAVE} {FINDS} LAPTOP AT CUSTOMS, {BANNED} ON THE SPOT", colon: true },
  { name: "6ix9ine", headline: "{SNITCHES} ON OWN HYPERVISOR TO AVOID VAC {PERMABAN}" },
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

      // profile watermark — top-left corner, circular, semi-transparent
      try {
        const profileBuf = await sharp(PROFILE_IMG_PATH).png().toBuffer();
        const profileImg = await loadImage(profileBuf);
        const wmSize = 80;
        const wmX = 18, wmY = 18;
        ctx.save();
        ctx.beginPath();
        ctx.arc(wmX + wmSize / 2, wmY + wmSize / 2, wmSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(profileImg, wmX, wmY, wmSize, wmSize);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(wmX + wmSize / 2, wmY + wmSize / 2, wmSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.stroke();
      } catch { /* skip watermark if image unavailable */ }

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

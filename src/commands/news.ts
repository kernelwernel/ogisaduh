import { Message, TextChannel, AttachmentBuilder } from "discord.js";
import { PrefixCommand } from "../types";
import sharp from "sharp";
import { join } from "path";
import { Worker } from "worker_threads";
import { readFileSync, writeFileSync } from "fs";

const TOPIC_IMAGES_DIR = join(__dirname, "..", "..", "topic_images");
const PROFILE_IMG_PATH = join(__dirname, "..", "..", "assets", "profile.png");

function spawnRenderWorker(data: {
  headline: string;
  celebBuffer: Buffer;
  topicImagesDir: string;
  profileImgPath: string;
  topicBuffer?: Buffer;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const isTS = __filename.endsWith(".ts");
    const workerPath = isTS
      ? join(__dirname, "../workers/newsRender.ts")
      : join(__dirname, "../workers/newsRender.js");
    const worker = new Worker(workerPath, {
      workerData: data,
      execArgv: isTS ? ["-r", "ts-node/register"] : [],
      stderr: true,
    });
    worker.stderr?.on("data", (d: Buffer) => {
      const s = d.toString();
      if (!s.includes("Fontconfig")) console.error("[worker stderr]", s.trim());
    });
    let settled = false;
    const settle = (fn: () => void) => { if (!settled) { settled = true; fn(); } };
    worker.on("message", (msg: { buf?: Buffer; error?: string }) => {
      settle(() => {
        if (msg.error) reject(new Error(msg.error));
        else resolve(Buffer.from(msg.buf!));
      });
    });
    worker.on("error", (err) => { console.error("[worker error]", err); settle(() => reject(err)); });
    worker.on("exit", code => {
      if (code !== 0) console.error(`[worker] exited with code ${code}`);
      settle(() => reject(new Error(`Render worker exited with code ${code} without sending result`)));
    });
  });
}


const ENTRIES: { name: string; headline: string; colon?: boolean }[] = [
  { name: "Drake", headline: "{FAILS} TO BYPASS VMAWARE AFTER {14} HOURS OF TRYING" },
  { name: "Kanye West", headline: "{DETECTED} BY BATTLEYE HYPERVISOR CHECK IN {MINUTES}, IMMEDIATELY ANNOUNCES A NEW {RELIGION} AND BLAMES THE {SCAN}", colon: true },
  { name: "Lil Uzi Vert", headline: "REPORTEDLY {CRIES} AFTER AUTOVIRT GETS {FLAGGED}" },
  { name: "Travis Scott", headline: "{CAUGHT} RUNNING QEMU+KVM DURING STREAM, BAN NOTICE {PROJECTED} ONTO STAGE SCREEN BY ACCIDENT" },
  { name: "Tyler the Creator", headline: "{FAILS} NIKA-READ-ONLY BYPASS THREE TIMES IN A ROW, {TWEETS} AT VMAWARE DEVS, GETS {BLOCKED}" },
  { name: "Kendrick Lamar", headline: "DROPS DISS TRACK ON EAC AFTER KERNEL {DETECTION}, CALLS TIMING CHECKS \"{BRUTAL}\" AND {COWARDLY}" },
  { name: "Playboi Carti", headline: "ATTEMPTS VM SPOOF ON STREAM, GETS {DETECTED} IMMEDIATELY, ENTIRE CHAT {SCREAMS} IN CAPS LOCK" },
  { name: "Young Thug", headline: "{LOSES} BATTLEYE APPEAL, SUBMITS SECOND APPEAL CALLING ANTICHEAT A {SNITCH}, THIRD APPEAL {DENIED}" },
  { name: "Future", headline: "GIVES {UP} ON AUTOVIRT, SAYS TIMING CHECK {UNFAIR}" },
  { name: "Offset", headline: "{DETECTED} BY VMAWARE ON FIRST TRY, {BLAMES} HIS PC" },
  { name: "21 Savage", headline: "{FAILS} PCI VENDOR ID CHECK ON STREAM, CALLS VMAWARE DEVS LIVE, DEVS DO NOT {PICK} {UP}" },
  { name: "Lil Baby", headline: "{CRIES} AFTER BATTLEYE {FLAGS} HIS HYPERVISOR QUERY, SUBMITS TEARFUL VIDEO APPEAL, BATTLEYE {RESPONDS} WITH HWID BAN" },
  { name: "Gunna", headline: "ATTEMPTS QEMU SPOOF USING GUIDE FROM A {FOURTEEN} YEAR OLD ON YOUTUBE, CPU HEURISTICS IMMEDIATELY {DISAGREES}" },
  { name: "Chief Keef", headline: "{LOSES} HWID BAN APPEAL, SUBMITS ANOTHER ONE CALLING BATTLEYE A {SNITCH}, ALL FOUR APPEALS {DENIED}" },
  { name: "ASAP Rocky", headline: "{DETAINED} AT AIRPORT, VMAWARE {FOUND} ON LAPTOP" },
  { name: "NBA YoungBoy", headline: "VMAWARE DETECTION RATE {100} PERCENT ACROSS ALL {TWELVE} ACCOUNTS, REPORTEDLY {IMPRESSED} BY THE CONSISTENCY", colon: true },
  { name: "Cardi B", headline: "{FAILS} EDID CHECK {FOUR} TIMES IN A ROW, {BLAMES} OFFSET, SAYS VMAWARE IS {FIXED} AND RIGGED" },
  { name: "Post Malone", headline: "{GIVES} UP CHEATING AFTER NVRAM CHECK {DESTROYS} HIM, SHOWS UP TO ANTICHEAT CONVENTION TO PERSONALLY {CONGRATULATE} THE DEVELOPERS" },
  { name: "Lil Durk", headline: "ATTEMPTS AUTOVIRT BYPASS AFTER WATCHING ONE TUTORIAL, {FLAGGED} IN UNDER A SECOND, {BLAMES} THE VIDEO CREATOR" },
  { name: "Nicki Minaj", headline: "SMBIOS INTEGRITY CHECK RETURNS {FAILED}, {LEAKED} SCREENSHOT SHOWS", colon: true },
  { name: "Jack Harlow", headline: "TRIES NIKA-READ-ONLY BYPASS {TWICE} ON STREAM, BOTH TIMES {DETECTED}, CHAT {DONATES} TO ANTICHEAT DEVS IN RESPONSE" },
  { name: "Polo G", headline: "{FAILS} DARK BYTES HYPERVISOR CHECK, RELEASES DISS TRACK CALLING DEVS {CORRUPT}, DEVS RESPOND WITH ANOTHER {BAN}" },
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
  { name: "Jay-Z", headline: "VMAWARE SCAN COMPLETE, VM CONFIRMATION {TRUE}, HWID {BANNED}", colon: true },
  { name: "Beyoncé", headline: "ATTEMPTS QEMU BYPASS, SMBIOS CHECK {ENDS} HER {CAREER}" },
  { name: "Rihanna", headline: "{FAILS} LOW FILE ACCESS COUNT CHECK IN {FINAL} ROUND, SPENDS THREE HOURS {GOOGLING} WHAT A FILE ACCESS IS" },
  { name: "Lil Pump", headline: "{FAILS} VMAWARE {SEVEN} TIMES, STILL DOES NOT UNDERSTAND WHY" },
  { name: "6ix9ine", headline: "{SNITCHES} ON OWN VM SPOOF TO AVOID {LONGER} HWID BAN" },
  { name: "Trippie Redd", headline: "ROBLOX {BANS} ALL FIVE ACCOUNTS DURING ADOPT ME SESSION, {BLAMES} WINDOWS UPDATE AND THEN {BLAMES} HIS DOG" },
  { name: "Rick Ross", headline: "VMAWARE SCAN {DETECTS} QEMU BRAND ON BOSS GAMING PC, BLAMES HIS {INTERN}, INTERN ALSO GETS {BANNED}", colon: true },
  { name: "Meek Mill", headline: "{LOSES} BATTLEYE APPEAL FOR THE {THIRD} TIME THIS YEAR, DRAKE {TWEETS} ABOUT IT" },
  { name: "Lil Wayne", headline: "SAYS \"EAC IS THE REAL JAIL\" AFTER GETTING {HWID} {BANNED}" },
  { name: "Gucci Mane", headline: "VMAWARE CONFIRMED {TRUE} ON ALL {FOURTEEN} ACCOUNTS, IMMEDIATELY ATTEMPTS TO PURCHASE A {FIFTEENTH}", colon: true },
  { name: "T-Pain", headline: "AUTOTUNES ROBLOX {BAN} NOTICE, STILL GETS {DETECTED} AND {BANNED}" },
  { name: "Soulja Boy", headline: "CLAIMS HE {INVENTED} ROBLOX {EXPLOITING}, COMMUNITY POSTS {PROOF} HE DIDN'T" },
  { name: "Lil Jon", headline: "{SCREAMS} AT ROBLOX SUPPORT FOR {BANNING} HIS EXECUTOR SCRIPT, SUPPORT {CLOSES} TICKET" },
  { name: "Pitbull", headline: "MR WORLDWIDE {FAILS} VM SPOOF IN {EVERY} REGION", colon: true },
  { name: "Taylor Swift", headline: "{FAILS} VMAWARE BYPASS IN FRONT OF {FORTY} THOUSAND FANS, SWIFTIES IMMEDIATELY {BLAME} KANYE" },
  { name: "Harry Styles", headline: "{DETECTED} BY BATTLEYE HYPERVISOR SCAN, {BANNED} FROM COMPETITIVE, FANS MAIL {GLITTER} TO DEVS", colon: true },
  { name: "Ed Sheeran", headline: "WRITES SONG ABOUT {FAILING} QEMU BYPASS, BATTLEYE DEVS {ADD} IT TO OFFICE PLAYLIST, STILL {BANNED}" },
  { name: "Justin Bieber", headline: "HWID {BANNED}, SAYS \"VMAWARE IS NEVER LETTING HIM {GO}\"" },
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
  { name: "Twenty One Pilots", headline: "BOTH MEMBERS HWID {BANNED} AT SAME TIME DURING LIVE TOURNAMENT STREAM, CROWD GOES COMPLETELY {SILENT}" },
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
  { name: "Freddie Mercury", headline: "GHOST ATTEMPTS ROBLOX {EXPLOIT} FROM BEYOND THE GRAVE, {DETECTED} IMMEDIATELY, ENTIRE ESTATE {DEVASTATED}" },
  { name: "LeBron James", headline: "VMAWARE {DETECTED} DURING HALFTIME, {BLAMES} TEAMMATES", colon: true },
  { name: "Cristiano Ronaldo", headline: "{FAILS} BATTLEYE CHECK, SCREAMS \"SIUUU\", GETS {BANNED}" },
  { name: "Lionel Messi", headline: "{DETECTED} BY EAC DURING WORLD CUP CELEBRATION STREAM, GOAT STATUS {REVOKED}, RONALDO {LAUGHS} IN RESPONSE", colon: true },
  { name: "Conor McGregor", headline: "ATTEMPTS VMAWARE BYPASS AT 4AM WHILE DRUNK, {TAPS} OUT IN UNDER THIRTY SECONDS, POSTS ABOUT IT {ANYWAY}" },
  { name: "Floyd Mayweather", headline: "SPENDS {FIFTY} MILLION ON VM SPOOF, STILL {DETECTED} IN UNDER A SECOND, CELEBRATES {UNDEFEATED} RECORD ANYWAY" },
  { name: "Mike Tyson", headline: "{PUNCHES} MONITOR AFTER VMAWARE RETURNS VM LIKELINESS {100}" },
  { name: "Jake Paul", headline: "ROBLOX {BANS} EXPLOIT ACCOUNT, {CLAIMS} HE STILL {WON}" },
  { name: "Logan Paul", headline: "VMAWARE {DETECTS} HYPERVISOR, CHALLENGES DEVELOPER TO A {BOXING} MATCH, DEVELOPER {DECLINES}", colon: true },
  { name: "MrBeast", headline: "OFFERS {MILLION} DOLLARS TO BYPASS VMAWARE, {NOBODY} SUCCEEDS" },
  { name: "Elon Musk", headline: "SAYS \"VMAWARE IS {BASED}\" AFTER IT {DETECTS} HIS OWN PC" },
  { name: "Mark Zuckerberg", headline: "VMAWARE CONFIRMS HUMAN SIMULATION {DETECTED} AND {BANNED}", colon: true },
  { name: "Gordon Ramsay", headline: "CALLS VMAWARE BYPASS ATTEMPT \"AN {ABSOLUTE} {DISGRACE}\"" },
  { name: "Keanu Reeves", headline: "{FAILS} NIKA-READ-ONLY BYPASS FOR THE FIRST TIME IN HIS LIFE, COMMUNITY {DEVASTATED}, PETITIONS {CIRCULATE}" },
  { name: "Johnny Depp", headline: "VMAWARE SCAN COMPLETE, {DETECTED}, AMBER HEARD {LAUGHS}", colon: true },
  { name: "Will Smith", headline: "{SLAPS} BATTLEYE DEVELOPER AT ANTICHEAT AWARDS CEREMONY AFTER HWID {BAN}, REFUSES TO {APOLOGIZE} OR LEAVE" },
  { name: "Dwayne Johnson", headline: "{FAILS} VMAWARE, EVEN THE ROCK CANNOT {BYPASS} EAC", colon: true },
  { name: "Kevin Hart", headline: "{FAILS} VMAWARE BYPASS AFTER FOURTEEN {ATTEMPTS}, MAKES COMEDY SPECIAL ABOUT IT, STILL {CANNOT} BYPASS EAC", colon: true },
  { name: "Ryan Reynolds", headline: "VMAWARE {DETECTED}, MAKES ENTIRE AD CAMPAIGN ABOUT GETTING {BANNED}, STILL {CANNOT} BYPASS EAC", colon: true },
  { name: "Tom Cruise", headline: "ATTEMPTS VMAWARE BYPASS HIMSELF, \"MISSION {IMPOSSIBLE}\", {BANNED}" },
  { name: "Arnold Schwarzenegger", headline: "SAYS \"HE WILL BE {BACK}\" AFTER HWID {BAN}, RETURNS ON {SEVEN} ALTERNATE ACCOUNTS, ALL IMMEDIATELY {BANNED}" },
  { name: "Sylvester Stallone", headline: "{FAILS} EAC CHECK, \"YO ADRIAN, I GOT {DETECTED}\"" },
  { name: "Bruce Willis", headline: "{DETECTED} BY VMAWARE SCAN ON FIRST TRY, {BANNED} FROM ALL SERVERS WHILE STILL {LOADING} INTO FIRST GAME", colon: true },
  // VANGUARD entries
  { name: "Drake", headline: "VANGUARD SCAN {COMPLETE}, VM {CONFIRMED} ON GAMING RIG", colon: true },
  { name: "Travis Scott", headline: "VANGUARD {CATCHES} HYPERVISOR DURING {LIVE} STREAM, CROWD WATCHES", colon: true },
  { name: "Nicki Minaj", headline: "VANGUARD {EXPOSES} HYPERVISOR LIVE ON INSTAGRAM, {BANNED}", colon: true },
  { name: "Post Malone", headline: "VANGUARD {DETECTS} VM IN UNDER A SECOND, COMPLETELY {DEVASTATED}", colon: true },
  { name: "Young Thug", headline: "VANGUARD {FINDS} HIDDEN QEMU INSTANCE INSIDE RECORDING STUDIO PC, ENTIRE {LABEL} GETS HWID {BANNED}", colon: true },
  { name: "Taylor Swift", headline: "VANGUARD {DETECTS} HYPERVISOR, SWIFTIES {BLAME} KANYE", colon: true },
  { name: "The Weeknd", headline: "AFTER {HOURS} OF TRYING, VANGUARD STILL {DETECTS} THE VM" },
  { name: "Harry Styles", headline: "VANGUARD {CATCHES} AUTOVIRT DURING SOLD-OUT TOURNAMENT STREAM, FANS {DEVASTATED}, ENTIRE DISCORD {MELTS} DOWN", colon: true },
  { name: "Adele", headline: "\"ROLLING IN THE {BANS}\", VANGUARD {CATCHES} THIRD ACCOUNT" },
  { name: "Beyoncé", headline: "VANGUARD FINDS HYPERVISOR, {BANS} ALL FORTY-TWO {ACCOUNTS}", colon: true },
  { name: "Snoop Dogg", headline: "\"DROP IT LIKE IT IS {HOT}\", VANGUARD {BANS} ACCOUNT INSTANTLY" },
  { name: "LeBron James", headline: "VANGUARD {BANS} ACCOUNT, SAYS IT WAS {GOAT} LEVEL UNFAIR", colon: true },
  { name: "Conor McGregor", headline: "VANGUARD {TAPS} HIM OUT IN UNDER TWO SECONDS, {BANNED}", colon: true },
  { name: "Floyd Mayweather", headline: "GOES {UNDEFEATED} IN BOXING, {LOSES} TO VANGUARD SCAN" },
  { name: "MrBeast", headline: "GIVES AWAY ROBLOX ACCOUNT, ALL FIVE {BANNED} FOR {EXPLOITING} BEFORE WINNERS EVEN {CLAIM} THEM" },
  { name: "Gordon Ramsay", headline: "CALLS ROBLOX EXECUTOR SCRIPT \"ABSOLUTELY {RAW}\", {BANNED} FROM LOBBY IMMEDIATELY" },
  { name: "Tom Cruise", headline: "VANGUARD {CATCHES} HYPERVISOR DURING RANKED MATCH, {BANNED} MID CUTSCENE IN FRONT OF THE ENTIRE {LOBBY}", colon: true },
  { name: "Freddie Mercury", headline: "\"BOHEMIAN {BANNED}\", VANGUARD {CAUGHT} THE HYPERVISOR" },
  { name: "Metallica", headline: "\"MASTER OF {BANNED}\", VANGUARD {DETECTS} QEMU ON TOUR BUS" },
  { name: "My Chemical Romance", headline: "\"I'M {NOT} OKAY\", VANGUARD {DETECTED} ALL THREE ACCOUNTS" },
  { name: "Charli XCX", headline: "VANGUARD \"{BRAT}\" {DETECTED} AND ACCOUNT {BANNED}, POSTS TWENTY-TWEET UNHINGED RESPONSE CALLING DEVS {LOSERS}", colon: true },
  { name: "Hozier", headline: "\"TAKE ME TO {BANNED}\", VANGUARD {DETECTS} QEMU INSTANCE" },
  { name: "Lil Jon", headline: "\"TURN {DOWN} FOR WHAT\", VANGUARD {BANS} ACCOUNT ANYWAY, RESPONDS BY {SCREAMING} AT SUPPORT FOR TWO HOURS" },
  { name: "Rick Ross", headline: "ROBLOX {CATCHES} BOSS EXECUTOR SCRIPT, BLAMES {INTERN}, INTERN ALSO GETS {BANNED}" },
  { name: "Lil Pump", headline: "ROBLOX {CATCHES} HIM FOR THE {FOURTH} TIME THIS MONTH, STILL HAS NO IDEA WHAT AN EXECUTOR IS", colon: true },
  { name: "Demi Lovato", headline: "ROBLOX IS {MERCILESS}, EXPLOIT SCRIPT {DETECTED} IMMEDIATELY", colon: true },
  { name: "Miley Cyrus", headline: "VANGUARD COMES IN LIKE A \"{WRECKING} BALL\", {BANNED}", colon: true },
  { name: "Arnold Schwarzenegger", headline: "VANGUARD {TERMINATED} HIS ACCOUNT, \"WILL NOT BE {BACK}\"", colon: true },
  { name: "Lil Uzi Vert", headline: "VANGUARD {DETECTS} VM ON ALL ACCOUNTS, {CRIES} FOR SEVENTEEN HOURS STRAIGHT", colon: true },
  { name: "Kendrick Lamar", headline: "\"NOT LIKE {US}\", BUT VANGUARD STILL {DETECTS} THE HYPERVISOR" },

  // FACEIT entries
  { name: "Kanye West", headline: "SPENDS {MILLIONS} ON CUSTOM PC, MHYPROT {BSODS} IT ON FIRST {LAUNCH}" },
  { name: "Eminem", headline: "WRITES EIGHT MILE {VERSE} ABOUT {FAILING} FACEIT CHECK" },
  { name: "Lil Wayne", headline: "CALLS FACEIT \"THE CARTER FIVE OF {ANTICHEAT}\", STILL GETS {BANNED}" },
  { name: "Offset", headline: "{CAUGHT} BY FACEIT WITH HYPERVISOR RUNNING ON SECOND ACCOUNT, {BANNED} IMMEDIATELY, THIRD ACCOUNT {PENDING}" },
  { name: "Playboi Carti", headline: "\"WHOLE LOTTA VM {DETECTED}\", FACEIT SAYS \"WHOLE LOTTA {BANNED}\"" },
  { name: "Olivia Rodrigo", headline: "MHYPROT {BSODS} PC MID RANKED MATCH, COMES BACK ON LAPTOP, {BSODS} THAT {TOO}", colon: true },
  { name: "Doja Cat", headline: "FACEIT {CATCHES} AUTOVIRT DURING RANKED, {BLAMES} CHAT, CHAT {DISAGREES}", colon: true },
  { name: "Ed Sheeran", headline: "FACEIT SCAN {RUINS} GAMING SESSION, ACCUSES OPPONENT OF {CHEATING}, GETS HWID {BANNED} INSTEAD", colon: true },
  { name: "Justin Bieber", headline: "FACEIT {BANS} ACCOUNT BEFORE MATCH EVEN {LOADS}", colon: true },
  { name: "Lady Gaga", headline: "FACEIT SCAN {COMPLETE}, VM {CONFIRMED}, HWID {BANNED}", colon: true },
  { name: "Rihanna", headline: "\"WORK, WORK, WORK\", FACEIT STILL {DETECTS}, STILL {BANNED}" },
  { name: "Jay-Z", headline: "\"NINETY-NINE {PROBLEMS}\", FACEIT {DETECTION} IS ALL OF THEM", colon: true },
  { name: "Eminem", headline: "FACEIT {DETECTS} VM ON THIRD ACCOUNT, THIRD DISS TRACK INCOMING, DEVS {UNBOTHERED}" },
  { name: "Lionel Messi", headline: "FACEIT SCAN SHOWS {DETECTED}, GOAT STATUS UNDER {REVIEW}", colon: true },
  { name: "Jake Paul", headline: "FACEIT {CATCHES} HYPERVISOR MID STREAM, {CLAIMS} IT WAS A HACKER, CHAT {DISAGREES}", colon: true },
  { name: "Elon Musk", headline: "BUYS GENSHIN COMPANY TO {FIX} MHYPROT, PC {BSODS} DURING THE ACQUISITION ANNOUNCEMENT" },
  { name: "Keanu Reeves", headline: "{BANNED} BY FACEIT FOR VM USE, FANS BUILD {MEMORIAL} OUTSIDE ANTICHEAT HEADQUARTERS, DEVS {CONFUSED}" },
  { name: "Will Smith", headline: "FACEIT {BANS} HIM AGAIN, {SLAPS} MONITOR IN RESPONSE", colon: true },
  { name: "Michael Jackson", headline: "MHYPROT {BSODS} THRILLER GAMING PC, ESTATE {SUES}", colon: true },
  { name: "Green Day", headline: "\"WAKE ME UP WHEN {FACEIT} {ENDS}\", SAYS BANNED MEMBER" },
  { name: "Fall Out Boy", headline: "FACEIT {BANS} ENTIRE BAND SIMULTANEOUSLY, RELEASES STATEMENT, STATEMENT {IGNORED}" },
  { name: "Sabrina Carpenter", headline: "FACEIT {CATCHES} HYPERVISOR, \"SHORT N SWEET\" {BAN} ISSUED", colon: true },
  { name: "Lizzo", headline: "ROBLOX {BANS} MAIN ACCOUNT MID TOWER OF HELL RUN, FILES {FORMAL} COMPLAINT, COMPLAINT {DENIED}", colon: true },
  { name: "Machine Gun Kelly", headline: "FACEIT {CATCHES} MGK ON MAIN AND SMURF ACCOUNT, PETE DAVIDSON {LAUGHS}, MEGAN FOX {FILES} DIVORCE PAPERS", colon: true },
  { name: "Gucci Mane", headline: "ROBLOX {BRICKS} HIS GAMING ACCOUNT, {BANNED} SEVENTEEN TIMES", colon: true },
  { name: "Trippie Redd", headline: "ROBLOX {TRIPS} HIS ACCOUNT DURING JAILBREAK SESSION, {BANNED} FROM ALL SERVERS", colon: true },
  { name: "Jack Harlow", headline: "ATTEMPTS TO BUY \"{FIRST} CLASS\" ANTICHEAT BYPASS, FACEIT {DETECTS} IT IMMEDIATELY, {BANNED} BEFORE MATCH STARTS", colon: true },
  { name: "Charlie Puth", headline: "ROBLOX EXPLOIT {DETECTED} IMMEDIATELY, PULLS LAPTOP OUT MID-CONCERT TO CHECK {BAN} NOTICE, CROWD {WATCHES}", colon: true },
  { name: "Sylvester Stallone", headline: "FACEIT {WINS}, STALLONE CLAIMS HE {LET} IT WIN, FACEIT DEVS {DISAGREE}", colon: true },
  { name: "Tyler the Creator", headline: "ROBLOX {CATCHES} EXECUTOR SCRIPT ON THIRD ACCOUNT, {BANNED} AGAIN, {TWEETS} AT DEVS, GETS {BLOCKED}", colon: true },

  // RICOCHET entries
  { name: "Cardi B", headline: "GOES {OFFSET} TRYING TO {BYPASS} RICOCHET CHECK, CALLS ANTICHEAT HELPDESK AND {THREATENS} LEGAL ACTION LIVE" },
  { name: "Future", headline: "RICOCHET {DETECTS} VM IMMEDIATELY, {CLAIMS} IT WAS A SETUP, RICOCHET {DISAGREES}" },
  { name: "Gunna", headline: "RICOCHET {CATCHES} QEMU INSTANCE LIVE ON STREAM, WALKS AWAY FROM PC MID-{GAME}, {NEVER} COMES BACK" },
  { name: "Billie Eilish", headline: "{BANNED} FROM RANKED, SAYS RICOCHET IS \"{BAD} GUY\"" },
  { name: "SZA", headline: "RICOCHET {BANS} ACCOUNT ON FIRST BOOT, {QUITS} GAMING AND {DELETES} ALL ACCOUNTS", colon: true },
  { name: "Shawn Mendes", headline: "\"STITCHES\" ON RICOCHET REPORT SHOW {DETECTED}, HWID {BANNED}" },
  { name: "Katy Perry", headline: "{ROARS} AT RICOCHET DEVELOPER DURING PRESS CONFERENCE AFTER HWID {BAN} ON {ALL} THREE ACCOUNTS SIMULTANEOUSLY" },
  { name: "Dr. Dre", headline: "STILL {BANNED}, RICOCHET FOUND QEMU ON {COMPTON} GAMING PC" },
  { name: "Cristiano Ronaldo", headline: "MHYPROT {BSODS} PC, CR7 {CRIES} IN PRESS CONFERENCE", colon: true },
  { name: "Mike Tyson", headline: "MHYPROT {BSODS} PC, {PUNCHES} MONITOR BEFORE IT FINISHES REBOOTING", colon: true },
  { name: "Logan Paul", headline: "RICOCHET {CATCHES} HYPERVISOR, CHALLENGES DEVELOPER TO A {BOXING} MATCH, DEVELOPER {DECLINES}" },
  { name: "Ryan Reynolds", headline: "RICOCHET {BANS} ACCOUNT DURING GAMING SPONSOR SHOOT, {RUINS} ENTIRE CAMPAIGN", colon: true },
  { name: "Dwayne Johnson", headline: "BODY {SLAMS} GAMING RIG AFTER RICOCHET {BANS} ALL ACCOUNTS, VOWS TO FIGHT DEVELOPERS IN THE {SQUARED} CIRCLE" },
  { name: "Elvis Presley", headline: "RICOCHET {BANS} ESTATE ACCOUNT, ESTATE {SUES}, SUIT {DISMISSED}", colon: true },
  { name: "Linkin Park", headline: "\"IN THE {END}\", RICOCHET {CAUGHT} THE HYPERVISOR ANYWAY" },
  { name: "Coldplay", headline: "ROBLOX {CATCHES} ENTIRE BAND SCRIPTING SIMULTANEOUSLY, ALL ACCOUNTS {TERMINATED}, RELEASES STATEMENT CALLING IT {UNJUST}" },
  { name: "Halsey", headline: "RICOCHET {BANS} ACCOUNT TWICE IN ONE SESSION, {NEVER} RETURNS TO RANKED", colon: true },
  { name: "Jason Derulo", headline: "RICOCHET {DROPS} HIM LIKE A HIT, {BANNED} INSTANTLY", colon: true },
  { name: "Meek Mill", headline: "ROBLOX {CATCHES} EXPLOIT ON THIRD ACCOUNT, DRAKE {TWEETS} ABOUT IT", colon: true },
  { name: "Chief Keef", headline: "ROBLOX {FINALLY} CATCHES CHIEF SCRIPTING IN JAILBREAK, ALL ACCOUNTS {BANNED}", colon: true },
  { name: "Polo G", headline: "ROBLOX {POPS} OFF AND {CATCHES} EXPLOIT ON FIRST SCAN, ALL FOURTEEN ACCOUNTS {TERMINATED} WITHOUT WARNING", colon: true },
  { name: "Camila Cabello", headline: "ROBLOX {CATCHES} HER SCRIPTING IN BROOKHAVEN, {BANNED} FROM ALL SERVERS", colon: true },
  { name: "Mark Zuckerberg", headline: "RICOCHET {DETECTS} HUMAN EMULATION SOFTWARE, {BANNED}", colon: true },
  { name: "Johnny Depp", headline: "MHYPROT {BSODS} PC FOR THE FIFTH TIME, SYSTEM RESTORE {FAILS}, AMBER HEARD {CELEBRATES} ON TWITTER", colon: true },

  // VAC entries
  { name: "21 Savage", headline: "NOT EVEN {CHEATING}, MHYPROT {BSODS} BARE METAL RIG WITHOUT {WARNING}" },
  { name: "Lil Baby", headline: "VAC {WAVE} HITS, ACCOUNT {TERMINATED} WITH NO APPEAL", colon: true },
  { name: "Ariana Grande", headline: "VAC {WAVE} HITS MAIN ACCOUNT, BUYS NEW PC, {WAVE} {HITS} THAT TOO", colon: true },
  { name: "Sam Smith", headline: "VAC {WAVE} HITS, ACCOUNT {TERMINATED} BEFORE FIRST MATCH EVEN {STARTS}", colon: true },
  { name: "Ice Cube", headline: "VAC {WAVE} DESTROYS MAIN ACCOUNT, {CLAIMS} HE WAS JUST {SPECTATING}" },
  { name: "Kevin Hart", headline: "MHYPROT {BSODS} PC FOR THE SECOND TIME IN ONE WEEK, {SCREAMS} AT MONITOR FOR TWENTY MINUTES ON STREAM", colon: true },
  { name: "Blink-182", headline: "ROBLOX ANTICHEAT {CATCHES} ENTIRE BAND MID-SESSION, ALL ACCOUNTS {BANNED}, RELEASES SONG ABOUT IT, STILL {BANNED}" },
  { name: "Imagine Dragons", headline: "ROBLOX {BANS} ENTIRE BAND SIMULTANEOUSLY DURING LIVE TOURNAMENT STREAM, CROWD GOES COMPLETELY {SILENT}" },
  { name: "Soulja Boy", headline: "VAC {WAVE}, \"{WATCH} ME\", GETS {DETECTED} IMMEDIATELY", colon: true },
  { name: "T-Pain", headline: "VAC {WAVE} CONFIRMED ON THIRD ACCOUNT, DEVS SEND PERSONAL {CONGRATULATIONS} ON THE {CONSISTENCY}" },
  { name: "NBA YoungBoy", headline: "VAC {WAVE} HITS BACKUP ACCOUNT, ALL {SEVENTEEN} ACCOUNTS NOW BANNED", colon: true },
  { name: "DaBaby", headline: "\"LETS {GO}\", VAC {WAVE} DETECTS HYPERVISOR IMMEDIATELY" },
  { name: "Pitbull", headline: "\"GIVE ME {EVERYTHING}\" EXCEPT A VAC {WAVE}, STATEMENT {IGNORED} BY DEVS, ALL NINE ACCOUNTS {BANNED} ANYWAY", colon: true },
  { name: "Lil Durk", headline: "ROBLOX {BANS} EXECUTOR ATTEMPT IN UNDER A SECOND, {CAUGHT} INSTANTLY", colon: true },
  { name: "Selena Gomez", headline: "ROBLOX SAYS {NOBODY} BYPASSES ITS ANTICHEAT, PROVES IT BY {BANNING} ALL FIVE {ACCOUNTS}", colon: true },
  { name: "ASAP Rocky", headline: "VAC {WAVE} {FINDS} LAPTOP AT CUSTOMS, {BANNED} ON THE SPOT", colon: true },
  { name: "6ix9ine", headline: "{SNITCHES} ON OWN VM SPOOF TO AVOID VAC {WAVE}, GETS HWID {BANNED} ANYWAY" },
  { name: "Nicki Minaj", headline: "PLAYS GENSHIN ON BARE METAL, MHYPROT {BSODS} PC WITHOUT WARNING, WASN'T EVEN {CHEATING}", colon: true },
];

async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 8000): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ac.signal }); } finally { clearTimeout(timer); }
}

async function fetchCelebrityImage(name: string): Promise<Buffer> {
  const query = encodeURIComponent(`${name} celebrity portrait headshot`);

  const htmlRes = await fetchWithTimeout(
    `https://duckduckgo.com/?q=${query}&iax=images&ia=images`,
    { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" } }
  );
  const html = await htmlRes.text();
  const vqdMatch = html.match(/vqd=([\d-]+)/);
  if (!vqdMatch) throw new Error("Could not extract vqd token");
  const vqd = vqdMatch[1];

  const apiRes = await fetchWithTimeout(
    `https://duckduckgo.com/i.js?q=${query}&o=json&vqd=${vqd}&f=,,,,,&p=1`,
    { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://duckduckgo.com/" } }
  );
  const data: any = await apiRes.json();
  const results: { image: string }[] = data.results ?? [];
  if (!results.length) throw new Error("No image results found");

  for (const result of results.slice(0, 5)) {
    const url = result.image;
    if (!url || url.endsWith(".svg") || url.endsWith(".gif")) continue;
    try {
      const imgRes = await fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0" } });
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

const HISTORY_SIZE = 50;
const HISTORY_PATH = join(__dirname, "..", "..", "data", "news_history.json");

let activeWorkers = 0;
const MAX_WORKERS = 2;

function loadHistory(): string[] {
  try { return JSON.parse(readFileSync(HISTORY_PATH, "utf8")); } catch { return []; }
}

function saveHistory(history: string[]): void {
  try { writeFileSync(HISTORY_PATH, JSON.stringify(history)); } catch {}
}

let recentHistory: string[] = loadHistory();

async function fetchAttachmentBuffer(url: string): Promise<Buffer> {
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const raw = Buffer.from(await res.arrayBuffer());
  return sharp(raw).png().toBuffer();
}

const command: PrefixCommand = {
  name: "news",
  async execute(message: Message, args: string[]) {
    const channel = message.channel as TextChannel;
    if (activeWorkers >= MAX_WORKERS) {
      await message.reply("Too many articles generating at once, try again in a moment.");
      return;
    }

    const customHeadline = args.join(" ").trim() || null;
    const imageAttachments = [...message.attachments.values()].filter(a =>
      a.contentType?.startsWith("image/") ?? false
    );
    const imageAttachment = imageAttachments[0] ?? null;
    const topicAttachment = imageAttachments[1] ?? null;
    const isCustom = !!(customHeadline || imageAttachment);

    const thinking = await channel.send("Generating article...");

    try {
      activeWorkers++;

      let headline: string;
      let celebBuffer: Buffer;
      let topicBuffer: Buffer | undefined;

      if (isCustom) {
        headline = customHeadline ?? "";
        celebBuffer = imageAttachment
          ? await fetchAttachmentBuffer(imageAttachment.url)
          : await fetchCelebrityImage(
              ENTRIES[Math.floor(Math.random() * ENTRIES.length)].name
            );
        if (topicAttachment) topicBuffer = await fetchAttachmentBuffer(topicAttachment.url);
      } else {
        const pool = ENTRIES.filter(e => !recentHistory.includes(e.name));
        const available = pool.length > 0 ? pool : ENTRIES;
        const entry = available[Math.floor(Math.random() * available.length)];
        recentHistory.push(entry.name);
        if (recentHistory.length > HISTORY_SIZE) recentHistory = recentHistory.slice(-HISTORY_SIZE);
        saveHistory(recentHistory);
        headline = entry.colon
          ? `${entry.name.toUpperCase()}: ${entry.headline}`
          : `${entry.name.toUpperCase()} ${entry.headline}`;
        celebBuffer = await fetchCelebrityImage(entry.name);
      }

      const buffer = await spawnRenderWorker({
        headline,
        celebBuffer,
        topicImagesDir: TOPIC_IMAGES_DIR,
        profileImgPath: PROFILE_IMG_PATH,
        topicBuffer,
      });

      const attachment = new AttachmentBuilder(buffer, { name: "article.png" });
      await channel.send({ files: [attachment] });
      await thinking.delete();
    } catch (err) {
      console.error("[article]", err);
      try { await thinking.edit("Failed to generate article."); } catch {}
    } finally {
      activeWorkers--;
    }
  },
};

module.exports = command;

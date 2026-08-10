import {
  Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ComponentType, TextChannel,
} from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, addCash, removeCash, parseAmount, formatCurrency } from "../../utils/economy";

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUITS = ["♠", "♥", "♦", "♣"];
const TIME_LIMIT_MS = 60_000;

interface Card { rank: string; suit: string; value: number }

function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const value = rank === "A" ? 11 : ["J", "Q", "K"].includes(rank) ? 10 : parseInt(rank, 10);
      deck.push({ rank, suit, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function handValue(cards: Card[]): number {
  let total = cards.reduce((sum, c) => sum + c.value, 0);
  let aces = cards.filter(c => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

function formatHand(cards: Card[]): string {
  return cards.map(c => `\`${c.rank}${c.suit}\``).join(" ");
}

function buttons(disabled: boolean) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("hit").setLabel("Hit").setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId("stand").setLabel("Stand").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
  );
}

const command: PrefixCommand = {
  name: "blackjack",
  aliases: ["bj"],
  async execute(message: Message, args: string[]) {
    const acc = await getAccount(message.author.id);
    const bet = parseAmount(args[0], acc.cash);
    if (bet === null) {
      await message.reply("Usage: `$blackjack <amount|all|half>`");
      return;
    }
    if (bet > acc.cash) {
      await message.reply(`⚠️ You only have ${formatCurrency(acc.cash)} in cash.`);
      return;
    }

    await removeCash(message.author.id, bet);

    const deck = freshDeck();
    const draw = () => deck.pop()!;
    const player = [draw(), draw()];
    const dealer = [draw(), draw()];

    const buildEmbed = (opts: { reveal: boolean; status?: string; color?: number }) => {
      const playerVal = handValue(player);
      const embed = new EmbedBuilder()
        .setTitle("🃏 Blackjack")
        .addFields(
          { name: `${message.author.username}'s Hand (${playerVal})`, value: formatHand(player) },
          opts.reveal
            ? { name: `Dealer's Hand (${handValue(dealer)})`, value: formatHand(dealer) }
            : { name: "Dealer's Hand", value: `\`${dealer[0].rank}${dealer[0].suit}\` \`??\`` },
        )
        .setFooter({ text: `Bet: ${formatCurrency(bet)}` })
        .setColor(opts.color ?? 0x5865f2);
      if (opts.status) embed.setDescription(opts.status);
      return embed;
    };

    // Settles the round: multiplier of bet returned to the player (0 = loss, 1 = push, 2 = win, 2.5 = blackjack).
    const settle = async (multiplier: number, status: string, color: number) => {
      let finalStatus = status;
      try {
        if (multiplier > 0) await addCash(message.author.id, Math.floor(bet * multiplier));
      } catch (err) {
        console.error("[blackjack] payout failed", err);
        finalStatus = `${status}\n⚠️ Payout failed to save — contact an admin if your balance looks wrong.`;
      }
      await sent.edit({ embeds: [buildEmbed({ reveal: true, status: finalStatus, color })], components: [buttons(true)] });
    };

    const playerBJ = isBlackjack(player);
    const dealerBJ = isBlackjack(dealer);

    const sent = await (message.channel as TextChannel).send({
      embeds: [buildEmbed({ reveal: playerBJ || dealerBJ })],
      components: [buttons(playerBJ || dealerBJ)],
    });

    if (playerBJ || dealerBJ) {
      if (playerBJ && dealerBJ) await settle(1, "🤝 Both have blackjack — push. Bet returned.", 0xffaa00);
      else if (playerBJ) await settle(2.5, "🂡 Blackjack! You win 2.5x your bet.", 0x57f287);
      else await settle(0, "💥 Dealer has blackjack. You lose.", 0xff3333);
      return;
    }

    let standing = false;
    while (!standing) {
      let interaction;
      try {
        interaction = await sent.awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: (i) => i.user.id === message.author.id,
          time: TIME_LIMIT_MS,
        });
      } catch {
        await settle(1, "⌛ You took too long — bet returned.", 0xffaa00);
        return;
      }

      if (interaction.customId === "hit") {
        player.push(draw());
        const val = handValue(player);
        if (val > 21) {
          await interaction.update({ embeds: [buildEmbed({ reveal: true, status: "💥 Bust! You lose.", color: 0xff3333 })], components: [buttons(true)] });
          return;
        }
        await interaction.update({ embeds: [buildEmbed({ reveal: false })], components: [buttons(false)] });
      } else {
        standing = true;
        await interaction.update({ embeds: [buildEmbed({ reveal: true, status: "Dealer is playing..." })], components: [buttons(true)] });
      }
    }

    while (handValue(dealer) < 17) {
      dealer.push(draw());
    }

    const playerVal = handValue(player);
    const dealerVal = handValue(dealer);

    if (dealerVal > 21 || playerVal > dealerVal) {
      await settle(2, "🎉 You win!", 0x57f287);
    } else if (playerVal === dealerVal) {
      await settle(1, "🤝 Push — bet returned.", 0xffaa00);
    } else {
      await settle(0, "💥 Dealer wins.", 0xff3333);
    }
  },
};

module.exports = command;

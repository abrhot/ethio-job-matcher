import { getBot } from "../src/lib/telegram/bot";

async function main() {
  const bot = getBot();
  if (!bot) {
    console.error("Set TELEGRAM_BOT_TOKEN before starting the bot.");
    process.exit(1);
  }
  await bot.start({
    onStart: (me) => {
      console.log(`Sera bot @${me.username} is polling.`);
    },
  });
}

void main();

const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Configuration
const token = process.env.BOT_API_KEY; // Telegram bot token
const chatId = process.env.CHAT_ID; // Telegram chat ID
const priceThreshold = 100; // Target price
const checkInterval = 60000; // Check every 60 seconds

// Initialize Telegram bot
const bot = new TelegramBot(token, { polling: true });

// Store for coin IDs
let coinIds = [];

// Command to add a coin to the tracking list
bot.onText(/\/addcoin (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const coinId = match[1].trim(); // Coin ID from the command

  if (!coinIds.includes(coinId)) {
    coinIds.push(coinId);
    bot.sendMessage(chatId, `Coin ID ${coinId} added to the tracking list.`);
  } else {
    bot.sendMessage(chatId, `Coin ID ${coinId} is already in the tracking list.`);
  }
});

// Command to list all tracked coins
bot.onText(/\/listcoins/, (msg) => {
  const chatId = msg.chat.id;
  if (coinIds.length > 0) {
    bot.sendMessage(chatId, `Tracking the following coins: ${coinIds.join(', ')}`);
  } else {
    bot.sendMessage(chatId, `No coins are being tracked.`);
  }
});

// Function to check price for all tracked coins
const checkPrices = async () => {
  for (const coinId of coinIds) {
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
      const currentPrice = response.data[coinId].usd;
      console.log(`Current price of ${coinId}: $${currentPrice}`);
      
      if (currentPrice <= priceThreshold) {
        const message = `Price alert! ${coinId.toUpperCase()} has hit $${currentPrice}. It's time to buy!`;
        await bot.sendMessage(chatId, message);
        console.log('Alert sent:', message);
      }
    } catch (error) {
      console.error(`Error fetching price for ${coinId}:`, error);
    }
  }
};

// Periodically check prices
setInterval(checkPrices, checkInterval);

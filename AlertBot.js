const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// Configuration
const token = 'YOUR_TELEGRAM_BOT_TOKEN'; // Replace with your Telegram bot token
const chatId = 'YOUR_CHAT_ID'; // Replace with your Telegram chat ID
const coinId = 'solana'; // Replace with the specific Solana coin ID (e.g., 'solana')
const priceThreshold = 100; // Replace with your target price

// Initialize Telegram bot
const bot = new TelegramBot(token, { polling: true });

// Function to check price
const checkPrice = async () => {
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
    console.error('Error fetching price:', error);
  }
};

// Periodically check the price (e.g., every minute)
setInterval(checkPrice, 60000); // Check every 60 seconds
    
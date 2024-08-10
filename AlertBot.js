const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Configuration
const token = process.env.BOT_API_KEY; // Telegram bot token
const chatId = process.env.CHAT_ID; // Telegram chat ID
const priceThreshold = 0.1; // Target price
const checkInterval = 60000; // Check every 60 seconds

// Initialize Telegram bot
const bot = new TelegramBot(token, { polling: true });

console.log('Bot is polling for updates...');

// Store for coin addresses
let coinAddresses = [];
let awaitingUserInput = false;

// Command to start interaction
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Use /addcoin to add a coin to the tracking list.');
});

// Command to add a coin to the tracking list
bot.onText(/\/addcoin/, (msg) => {
  const chatId = msg.chat.id;
  
  // Prompt user for coin address
  awaitingUserInput = true;
  bot.sendMessage(chatId, 'Please send me the coin address you want to add to the tracking list.');
});

// Handle user messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (awaitingUserInput) {
    // Add the coin address to the list
    const coinAddress = text.trim();
    
    if (!coinAddresses.includes(coinAddress)) {
      coinAddresses.push(coinAddress);
      bot.sendMessage(chatId, `Coin address ${coinAddress} added to the tracking list.`);
    } else {
      bot.sendMessage(chatId, `Coin address ${coinAddress} is already in the tracking list.`);
    }
    
    // Reset the input prompt flag
    awaitingUserInput = false;
  }
});

// Command to list all tracked coins
bot.onText(/\/listcoins/, (msg) => {
  const chatId = msg.chat.id;
  if (coinAddresses.length > 0) {
    bot.sendMessage(chatId, `Tracking the following coins: ${coinAddresses.join(', ')}`);
  } else {
    bot.sendMessage(chatId, `No coins are being tracked.`);
  }
});

// Function to check price for all tracked coins
const checkPrices = async () => {
  console.log('Checking prices...');
  for (const coinAddress of coinAddresses) {
    try {
      const response = await axios.get(`https://api.dexscreener.com/latest/dex/pairs/solana/${coinAddress}`);
      
      // Log the entire response for debugging
      console.log(`API response for ${coinAddress}:`, response.data);
      
      // Extract priceUsd from the response
      const priceUsd = response.data.pair.priceUsd;
      
      if (priceUsd !== undefined) {
        console.log(`Current price of ${coinAddress}: $${priceUsd}`);
        
        if (priceUsd <= priceThreshold) {
          const message = `Price alert! The coin at address ${coinAddress} has hit $${priceUsd}. It's time to buy!`;
          await bot.sendMessage(chatId, message);
          console.log('Alert sent:', message);
        }
      } else {
        console.error(`Price for ${coinAddress} is not available.`);
      }
    } catch (error) {
      console.error(`Error fetching price for ${coinAddress}:`, error);
    }
  }
};

// Periodically check prices
setInterval(checkPrices, checkInterval);

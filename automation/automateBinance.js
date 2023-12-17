require('dotenv').config();
const axios = require("axios").default;

const { 
    MINIMUM_PRICE, 
    PSID, 
    PAGE_ID, 
    CHECK_INTERVAL, 
    ACCESS_TOKEN 
} = process.env;
const MIN_PRICE = parseFloat(MINIMUM_PRICE);

const msToMinutesConverter = (ms) => parseFloat(ms / 1000 / 60).toFixed(2);

const performTask = (result) => {
    // Calculate interval period based on the result value
    let intervalPeriod;
    const basePrice = 1.008;
    if (result >= basePrice && result <= 1.025) {
        intervalPeriod = (result - basePrice) * 20000; // 20 seconds base interval
        intervalPeriod = parseInt(intervalPeriod * 1000) //convert the second into milisecond and parse as int
    } else {
        console.error('Invalid result value. It should be between 1.011 and 1.025.');
        return;
    }
    console.log(`Checking updates again after %s minutes`, msToMinutesConverter(intervalPeriod));
    // Schedule the execution of another function after the calculated interval
    setTimeout(() => {
        // Call the other function here
        currentP2Pprices();
    }, intervalPeriod);
}

const currentP2Pprices = async() => {
    const reqUri = `https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search`;
    const payload = {
        "proMerchantAds": false,
        "page": 1,
        "rows": 3,
        "payTypes": [
            "Wise"
        ],
        "countries": [],
        "publisherType": "merchant",
        "tradeType": "BUY",
        "asset": "USDT",
        "fiat": "USD",
        "merchantCheck": true
    }
    const getUpdates =  await axios.post(reqUri, payload);
    let getmarketPrices = getUpdates.data.data.map(item => item.adv.price);
    const firstPrice = parseFloat(getmarketPrices[0]);
    getmarketPrices = getmarketPrices.join(',');
    // if minimum price is higher or equal to first price
    if (MIN_PRICE >= firstPrice) {
        await sendMessageToFbUser(getmarketPrices)
    }
    console.log('marketPrices:', getmarketPrices); // price example: 1.015
    performTask(firstPrice);
}

const sendMessageToFbUser = async(currentLowestPrice) => {
    const reqUri = `https://graph.facebook.com/${GRAPH_VERSION}/${PAGE_ID}/messages`;
    
    const messageBody = `Lowest price for first 3 advertisers: ${currentLowestPrice}`;
    const payload = {
        "messaging_type": "RESPONSE",
        "recipient": {
            "id": PSID
        },
        "message": {
            "text": messageBody
        }
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
    }

    const getUpdates =  await axios.post(reqUri, payload, { headers });
    console.log(`SendMessageToFbUser`, getUpdates.data);
}

// const checkIntervalMinute = CHECK_INTERVAL || 3;
// cron.schedule(`*/20 * * * * *`, currentP2Pprices);
try {
    currentP2Pprices();
} catch (error) {
    console.log(`err checkingPrices`, error);
}

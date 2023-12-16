require('dotenv').config();
const cron = require('node-cron');
const axios = require("axios").default;

const { 
    MINIMUM_PRICE, 
    PSID, 
    PAGE_ID, 
    CHECK_INTERVAL, 
    ACCESS_TOKEN 
} = process.env;
const MIN_PRICE = parseFloat(MINIMUM_PRICE);

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
const checkIntervalMinute = CHECK_INTERVAL || 3;
cron.schedule(`*/20 * * * * *`, () => {
    try {
        currentP2Pprices();
    } catch (error) {
        console.log(`error from scheduled`, error);
    }
});

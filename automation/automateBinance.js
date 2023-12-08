require('dotenv').config();
const cron = require('node-cron');
const axios = require("axios").default;

const MINIMUM_PRICE = parseFloat(1.011);
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
    if (MINIMUM_PRICE >= firstPrice) {
        await sendMessageToFbUser(getmarketPrices)
    }
    console.log('marketPrices:', getmarketPrices); // price example: 1.015
}

const sendMessageToFbUser = async(currentLowestPrice) => {
    const page_id = `102770435320525`;
    const reqUri = `https://graph.facebook.com/v18.0/${page_id}/messages`;
    
    const messageBody = `Lowest price for first 3 advertisers: ${currentLowestPrice}`;
    const PSID = "6988520177867851"; // page scoped user ID
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
        'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
    }

    const getUpdates =  await axios.post(reqUri, payload, { headers });
    console.log(`SendMessageToFbUser`, getUpdates.data);
}

cron.schedule('* * * * *', currentP2Pprices);
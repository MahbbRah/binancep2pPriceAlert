require('dotenv').config();
const axios = require("axios").default;

const { 
    MINIMUM_PRICE, 
    PSID, 
    PAGE_ID, 
    // CHECK_INTERVAL, 
    ACCESS_TOKEN,
    GRAPH_VERSION
} = process.env;
const MIN_PRICE = parseFloat(MINIMUM_PRICE);

const msToMinutesConverter = (ms) => parseFloat(ms / 1000 / 60).toFixed(2);
const isNegative = (num) => {
    if (Math.sign(num) === -1) {
        return true;
    }
    return false;
}
const basePrice = 1.010;
let previousPriceTick;
const performTask = (result) => {
    // Calculate interval period based on the result value; and set a default one as 20s
    let intervalPeriod = (result - basePrice) * 12000; // 20 seconds base interval
    intervalPeriod = parseInt(intervalPeriod * 1000) //convert the second into milisecond and parse as int
    
    // if the intervalPeriod is negative then set a default interval; default 20s
    if(isNegative(intervalPeriod)) intervalPeriod = 20000;
    
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
            "BANK"
        ],
        "countries": [],
        "publisherType": "merchant",
        "tradeType": "BUY",
        "asset": "USDT",
        "fiat": "USD",
        "merchantCheck": true
    }
    const getUpdates =  await axios.post(reqUri, payload);
    if (!getUpdates.data.data.length) {
        console.log(`No listing available at this moment`);
        performTask(1.035); // just added a dummy price to make the system running with scheduler, know this i not the right fix
        return;
    }
    let getmarketPrices = getUpdates.data.data.map(item => item.adv.price);
    const firstPrice = parseFloat(getmarketPrices[0]);
    // const firstPrice = MIN_PRICE;
    getmarketPrices = getmarketPrices.join(',');
    // if minimum price is higher or equal to first price
    if (MIN_PRICE >= firstPrice) {
        if(firstPrice !== previousPriceTick) {
            const psidUsers = JSON.parse(PSID);
            for (let index = 0; index < psidUsers.length; index++) {
                const psidUserId = psidUsers[index];
                await sendMessageToFbUser(getmarketPrices, psidUserId)
            }
        } else {
            console.log(`skipped sending messenger as the price didn't change`);
        }
            
    }
    previousPriceTick = firstPrice;
    console.log('marketPrices:', getmarketPrices); // price example: 1.015
    performTask(firstPrice);
}

const sendMessageToFbUser = async(currentLowestPrice, userID) => {
    const reqUri = `https://graph.facebook.com/${GRAPH_VERSION}/${PAGE_ID}/messages`;
    
    const messageBody = `Lowest price for first 3 advertisers: ${currentLowestPrice}`;
    const payload = {
        "messaging_type": "MESSAGE_TAG",
        "tag": "ACCOUNT_UPDATE",
        "recipient": {
            "id": userID
        },
        "message": {
            "text": messageBody
        }
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
    }

    try {
        const getUpdates = await axios.post(reqUri, payload, { headers });
        console.log(`sentMessageResponse`, getUpdates.data);
    } catch (error) {
        console.log(`error sending message`, error.response.data);
    }
}

// const checkIntervalMinute = CHECK_INTERVAL || 3;
// cron.schedule(`*/20 * * * * *`, currentP2Pprices);
try {
    currentP2Pprices();
    // const psidUsers = JSON.parse(PSID);
    // for (let index = 0; index < psidUsers.length; index++) {
    //     const psidUserId = psidUsers[index];
    //     sendMessageToFbUser(MIN_PRICE, psidUserId)
    // }
} catch (error) {
    console.log(`err checkingPrices`, error);
    // if error something then retry from here with a timeout
    const retryAfter = 90000;
    console.log(`Retrying after %s`, retryAfter);
    setTimeout(() => {
        currentP2Pprices();
    }, retryAfter);
}

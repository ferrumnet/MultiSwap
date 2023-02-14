const axios = require('axios');

async function getCudosPrice() {
    console.log(1)
    try {
        response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=CUDOS', {
            headers: {
                'X-CMC_PRO_API_KEY': process.env.CMC_API,
            },
        });
        
        return response.data.data.CUDOS[0].quote.USD.price
    } catch (ex) {
        response = null;
        // error
        console.log(ex);
        reject(ex);
    }
};

module.exports = getCudosPrice;
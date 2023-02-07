const axios = require('axios');

async function getCudosPrice() {
    console.log(1)
    try {
        response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=CUDOS', {
            headers: {
                'X-CMC_PRO_API_KEY': 'c2291e1d-03b2-480e-acb5-13305225d447',
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
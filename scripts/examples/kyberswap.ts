import axios from "axios";
import { ethers } from "ethers";

const headers = {
    'x-client-id': 'ferrum'
};

// Define main function
async function main() {
    const provider = new ethers.JsonRpcProvider('https://scroll-mainnet.chainstacklabs.com');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0!, provider);
    const recipient = '0x944Eedc570EaB4e6a918C8869007d5506AB9cc24';

    const fromToken = '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4';
    const toToken = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

    const amount = Math.round(Math.random() * 1000);
    const decimals = 6;
    const amountIn = (BigInt(amount) * BigInt(1 * 10 ** decimals)).toString();
    const targetPathConfig = {
        headers,
        params: {
            tokenIn: fromToken,
            tokenOut: toToken,
            amountIn,
            source: 'ferrum'
        }
    };

    let { data } = await axios.get(
        `https://aggregator-api.kyberswap.com/scroll/api/v1/routes`,
        targetPathConfig
    );

    console.log("AmountInUSD: " + data.data.routeSummary.amountInUsd);

    const requestBody = {
        routeSummary: data.data.routeSummary,
        wallet: wallet.address,
        recipient,
        slippageTolerance: 200, // in bps, 200 = 2%
        source: 'ferrum'
    };

    data = await axios.post(
        `https://aggregator-api.kyberswap.com/scroll/api/v1/route/build`,
        requestBody,
        { headers }
    );
    console.log("AmountOutUSD: " + data.data.data.amountOutUsd); // data.data.data for the calldata only
}

const numSwaps = 15; // max limit currently. 30 reqs per 10 second. Each swap has 2 reqs.





(async () => {
    const startTime = Date.now();
    const promises: Promise<void>[] = [];

    for (let i = 0; i < numSwaps; i++) {
        console.log(`\nQueueing call ${i + 1}...`);
        promises.push(
            main()
                .then(() => {
                    console.log(`Call ${i + 1} succeeded.`);
                })
                .catch((error) => {
                    console.error(`Error during call ${i + 1}:`, error);
                })
        );
    }

    await Promise.all(promises);

    const endTime = Date.now();
    console.log(`Cumulative time elapsed: ${(endTime - startTime) / 1000} seconds`);
    
    process.exit(0);
})();

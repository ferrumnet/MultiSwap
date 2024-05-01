import axios from "axios";
import { ethers } from "ethers";


async function main() {
    const provider = new ethers.JsonRpcProvider('https://scroll-mainnet.chainstacklabs.com')
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY0!, provider)
    const recipient = '0x944Eedc570EaB4e6a918C8869007d5506AB9cc24'

    const fromToken = '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4'
    const toToken = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    const amount = 5000000 // in normal base unit, not decimals
    const decimals = 6
    const amountIn = (BigInt(amount) * BigInt(1 * 10 ** decimals)).toString()

    const targetPathConfig = {
        params: {
            tokenIn: fromToken,
            tokenOut: toToken,
            amountIn
        }
    };

    console.log(`\nCalling Get Swap Route...`)
    let {data} = await axios.get(
        `https://aggregator-api.kyberswap.com/scroll/api/v1/routes`,
        targetPathConfig
    )

    console.log(data.data.routeSummary.route)

    const requestBody = {
        routeSummary: data.data.routeSummary,
        wallet,
        recipient,
        slippageTolerance: 200 // in bps, 200 = 2%
    }
        
    console.log(`\nCalling Build Swap Route...`)
    data = await axios.post(
        `https://aggregator-api.kyberswap.com/scroll/api/v1/route/build`,
        requestBody
    );
    console.log(data.data) // data.data.data for the calldata only
};


main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});

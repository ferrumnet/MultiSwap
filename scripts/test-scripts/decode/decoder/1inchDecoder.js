const ethers = require('ethers');

    const selectorUnoswap = '0xf78dc253';
    const selectorUniswapV3Swap = '0xbc80f1a8';
    const selectorSwap = '0x12aa3caf';
    const selectorFillOrderTo = '0xe5d7bde6';
    const selectorFillOrderRFQTo = '0x5a099843';


async function swapHelperForOneInch(oneInchData) {

   const functionSelector = oneInchData.slice(0, 10);
   let func;

   switch (functionSelector) {
       case selectorUnoswap:
           func = 0;
           console.log("UnoSwap function with ENUM", func);
           break;
       case selectorUniswapV3Swap:
           func = 1;
           console.log("UniSwapV3Swap function with ENUM", func);
           break;
       case selectorSwap:
           func = 2;
           console.log("Swap function with ENUM", func);
           break;
       case selectorFillOrderTo:
           func = 3;
           console.log("FillOrderTo function with ENUM", func);
           break;
       case selectorFillOrderRFQTo:
           func = 4;
           console.log("FillOrderRFQTo function with ENUM", func);
           break;
       default:
           throw new Error("Unknown function selector");
   }

   return func;
}

function removeSelector(oneInchData) {
    // Assuming the selector is always 4 bytes (8 characters)
    const slicedOneInchData = '0x' + oneInchData.slice(10);
    return slicedOneInchData;
}

const oneInchData = "0x12aa3caf000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd090000000000000000000000001af3f329e8be154074d8769d1ffa4ee058b1dbc30000000000000000000000008ac76a51cc950d9822d68b83fe1ad97b32cd580d000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000b5d1e1ff700cfc0c687f1fc99284e94ab0ef63e50000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000dbd2a0fcefe0cc50000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008100000000000000000000000000000000000000000000000000000000006302a00000000000000000000000000000000000000000000000000dbd2a0fcefe0cc5ee63c1e581a47aca4dd3537d09e2b812aeee3bc7124921858a1af3f329e8be154074d8769d1ffa4ee058b1dbc31111111254eeb25477b68fb85ed929f73a9605820000000000000000000000000000000000000000000000000000000000000077d4f1b0";

// const oneInchData = "0xbc80f1a8000000000000000000000000b5d1e1ff700cfc0c687f1fc99284e94ab0ef63e500000000000000000000000000000000000000000000000000000000000186a0000000000000000000000000000000000000000000000000033bf99bea351d680000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000057784919375274e60a49b6a0a0ae787de40e52b18b1ccac8"

async function checkSwapFunction() {
    console.log('\n')
    await swapHelperForOneInch(oneInchData);
    const pureOneInchData = removeSelector(oneInchData);
    console.log('-----------------------------------------------------------------------------')
    console.log('OneInchData without function signature / selector is generated:\n \n',pureOneInchData);
    console.log('----------------------------------------------------------------------------- \n')

}

checkSwapFunction();


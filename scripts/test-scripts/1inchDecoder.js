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

const oneInchData = "0xf78dc253000000000000000000000000b14fc4078c4c3b1d9ccade2a0ab70f3e5f209f58000000000000000000000000a719b8ab7ea7af0ddb4358719a34631bb79d15dc0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000ef78d0509735db00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000200000000000000003b74a46062c5804f61046a237f575c102d0659c8f888ff5f80000000000000003b7c4580a34337690711ce3f265f56ebd545dda00d7c040577d4f1b0";

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


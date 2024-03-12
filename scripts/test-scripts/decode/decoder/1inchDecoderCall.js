const ethers = require('ethers');
// Example ABI of the 1inchSwap contract

  const OneInchDecoder = require('./1inchDecoderLibrary.js'); // Adjust the path to 1inchDecoder script

  async function swapHelperForOneInch(oneInchData) {

   const functionSelector = oneInchData.slice(0, 10);
   let func;

   switch (functionSelector) {
       case OneInchDecoder.selectorUnoswap:
           func = 0;
           break;
       case OneInchDecoder.selectorUniswapV3Swap:
           func = 1;
           break;
       case OneInchDecoder.selectorSwap:
           func = 2;
           break;
       case OneInchDecoder.selectorFillOrderTo:
           func = 3;
           break;
       case OneInchDecoder.selectorFillOrderRFQTo:
           func = 4;
           break;
       default:
           throw new Error("Unknown function selector");
   }

   return func;
}
 
 const oneInchData = "";

async function main() {
   const funcValue = await swapHelperForOneInch(to, srcToken, amountIn, amountOut, oneInchData);
   console.log(`Function ENUM is: ${funcValue}`);
}

main();


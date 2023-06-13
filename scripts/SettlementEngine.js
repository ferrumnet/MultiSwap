async function calculateSlippage(expectedOutputAmount, slippageTolerance) {
   try {

      console.error("Slippage Initiated");

      //  // Get estimated output amount with the router contract
      //  const amountsOut = await routerContract.getAmountsOut(tradeAmount, [tokenA, tokenB]);

      //  // Extract the output amount
      //  const expectedOutputAmount = amountsOut[1]; // Index 1 represents the output amount of Token B

      // Calculate slippage tolerance
      const slippageAmount = expectedOutputAmount.mul(slippageTolerance).div(100);
      const minimumOutputAmount = expectedOutputAmount.sub(slippageAmount);

      // Log the results
      console.log('Expected Output Amount:', expectedOutputAmount); // Assuming Token B has 18 decimal places
      console.log('Minimum Output Amount (with Slippage):', minimumOutputAmount);

      // Perform the trade using the calculated minimum output amount
      // ... (Code to execute the trade)
      return minimumOutputAmount

   } catch (error) {
      console.error('Error:', error);
   }
}
module.exports = calculateSlippage;

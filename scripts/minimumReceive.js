const tokenAbi = require("../artifacts/contracts/token/Token.sol/Token.json");
const { networks, goerliUsdt, goerliUsdc } = require("../Network");

async function getMinimumReceivedAmount(
    chainId,
    inputAmount,
    path
){
    const network = networks[chainId];
    const path0TOkenContract = new ethers.Contract(
        path[0],
        tokenAbi.abi,
        network.provider
      );
    //convert to wei
    const sourceTokenDecimal = await path0TOkenContract.decimals();
    const amount = (inputAmount * 10 ** Number(sourceTokenDecimal)).toString();
    //get minimum amounts out
    const amounts = await network.dexContract.getAmountsOut(amount, path);
    const amountsOut = amounts[amounts.length - 1];
    return amountsOut;
}

getMinimumReceivedAmount(5, 22, [goerliUsdc, goerliUsdt]).then(console.log);

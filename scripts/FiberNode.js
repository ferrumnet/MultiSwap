const tokenAbi = require("../artifacts/contracts/token/Token.sol/Token.json");
const {
  goerliUsdt,
  bscUsdt,
  networks,
  bscAave,
  goerliCudos,
  goerliAave,
  goerliUsdc,
  bscCake,
  goerliAda,
} = require("../Network");

async function sourceFACCheck(sourceNetwork, tokenAddress, amount) {
  const sourceTokenContract = new ethers.Contract(
    tokenAddress,
    tokenAbi.abi,
    sourceNetwork.provider
  );
  const isSourceTokenFoundryAsset =
    await sourceNetwork.fundManagerContract.isFoundryAsset(tokenAddress);
  const sourceFoundryAssetLiquidity = await sourceTokenContract.balanceOf(
    sourceNetwork.fundManager
  );
  if (
    isSourceTokenFoundryAsset === true &&
    Number(sourceFoundryAssetLiquidity) > Number(amount)
  ) {
    return true;
  } else {
    return false;
  }
}

//check the requested token exist on the Source network Fund Manager
async function targetFACCheck(targetNetwork, tokenAddress, amount) {
  const targetTokenContract = new ethers.Contract(
    tokenAddress,
    tokenAbi.abi,
    targetNetwork.provider
  );
  const isTargetTokenFoundryAsset =
    await targetNetwork.fundManagerContract.isFoundryAsset(tokenAddress);
  const targetFoundryAssetLiquidity = await targetTokenContract.balanceOf(
    targetNetwork.fundManagerContract.address
  );
  if (
    isTargetTokenFoundryAsset === true &&
    Number(targetFoundryAssetLiquidity) > Number(amount)
  ) {
    return true;
  } else {
    return false;
  }
}

//check source toke is foundry asset
async function isSourceRefineryAsset(sourceNetwork, tokenAddress, amount) {
  try {
    const isTokenFoundryAsset = await sourceFACCheck(
      sourceNetwork,
      tokenAddress,
      amount
    );

    let path = [tokenAddress, sourceNetwork.foundryTokenAddress];
    const amounts = await sourceNetwork.dexContract.getAmountsOut(amount, path);
    const amountsOut = amounts[1];
    if (isTokenFoundryAsset == false && Number(amountsOut) > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

//check source toke is foundry asset
async function isTargetRefineryAsset(targetNetwork, tokenAddress, amount) {
  try {
    const isTokenFoundryAsset = await targetFACCheck(
      targetNetwork,
      tokenAddress,
      amount
    );

    let path = [targetNetwork.foundryTokenAddress, tokenAddress];
    const amounts = await targetNetwork.dexContract.getAmountsOut(amount, path);
    const amountsOut = amounts[1];
    if (isTokenFoundryAsset == false && Number(amountsOut) > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

async function categoriseSwapAssets(
  sourceChainId,
  sourcetokenAddress,
  targetChainId,
  targetTokenAddress,
  inputAmount
) {
  // mapping source and target networs (go to Network.js file)
  const sourceNetwork = networks[sourceChainId];
  const targetNetwork = networks[targetChainId];
  // source token contract
  const sourceTokenContract = new ethers.Contract(
    sourcetokenAddress,
    tokenAbi.abi,
    sourceNetwork.provider
  );
  //convert to wei
  const sourceTokenDecimal = await sourceTokenContract.decimals();
  const amount = (inputAmount * 10 ** Number(sourceTokenDecimal)).toString();
  
  //check source token type
  let sourceAssetType;
  let sourceBridgeAmount;

  const isSourceTokenFoundryAsset = await sourceFACCheck(
    sourceNetwork,
    sourcetokenAddress,
    amount
  );
  const isSourceTokenRefineryAsset = await isSourceRefineryAsset(
    sourceNetwork,
    sourcetokenAddress,
    amount
  );

  if (isSourceTokenFoundryAsset) {
    sourceAssetType = "Foundry";
    sourceBridgeAmount = amount;
  } else if (!isSourceTokenFoundryAsset && isSourceTokenRefineryAsset) {
    sourceAssetType = "Refinery";
    // get bridge foundry amount afeter swap refinery to foundry
    let path = [sourcetokenAddress, sourceNetwork.foundryTokenAddress];
    const amounts = await sourceNetwork.dexContract.getAmountsOut(amount, path);
    const amountsOut = amounts[1];
    sourceBridgeAmount = amountsOut;
  } else if (!isSourceTokenFoundryAsset && !isSourceTokenRefineryAsset) {
    sourceAssetType = "Ionic";
    // get bridge foundry amount after swap ionic to foundry
    let path = [
      sourcetokenAddress,
      sourceNetwork.weth,
      sourceNetwork.foundryTokenAddress,
    ];
    const amounts = await sourceNetwork.dexContract.getAmountsOut(amount, path);
    const amountsOut = amounts[amounts.length - 1];
    sourceBridgeAmount = amountsOut;
  }

  //check target token type
  let targetAssetType;

  const isTargetTokenFoundryAsset = await targetFACCheck(
    targetNetwork,
    targetTokenAddress,
    sourceBridgeAmount
  );
  const isTargetTokenRefineryAsset = await isTargetRefineryAsset(
    targetNetwork,
    targetTokenAddress,
    sourceBridgeAmount
  );
  if (isTargetTokenFoundryAsset) {
    targetAssetType = "Foundry";
  } else if (!isTargetTokenFoundryAsset && isTargetTokenRefineryAsset) {
    targetAssetType = "Refinery";
  } else if (!isTargetTokenFoundryAsset && !isTargetTokenRefineryAsset) {
    targetAssetType = "Ionic";
  }

  return {
    sourceAssetType,
    targetAssetType,
  };
}

categoriseSwapAssets(5, goerliAda, 97, bscAave, 12).then(console.log);



async function estimateGas(provider, signer, contract, functionName, inputsArray){
    const encodedFunction = contract.connect(signer).interface.encodeFunctionData(functionName, inputsArray);
    const gas = await provider.estimateGas({
        to: contract.address,
        data: encodedFunction
    })
    return gas;
}

module.exports = {
    estimateGas
}
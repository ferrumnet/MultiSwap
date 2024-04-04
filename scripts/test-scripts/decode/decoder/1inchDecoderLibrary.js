const ethers = require('ethers');

const OneInchDecoder = {
  decodeUnoswap: function (data) {
    const decodedData = ethers.utils.defaultAbiCoder.decode(
      ['address', 'address', 'uint256', 'uint256', 'uint256[]'],
      data
    );

    return {
      recipient: decodedData[0],
      srcToken: decodedData[1],
      amount: decodedData[2],
      minReturn: decodedData[3],
      pools: decodedData[4],
    };
  },

  decodeUniswapV3Swap: function (data) {
    const decodedData = ethers.utils.defaultAbiCoder.decode(
      ['address', 'uint256', 'uint256', 'uint256[]'],
      data
    );

    return {
      recipient: decodedData[0],
      amount: decodedData[1],
      minReturn: decodedData[2],
      pools: decodedData[3],
    };
  },

  decodeSwap: function (data) {
    const decodedData = ethers.utils.defaultAbiCoder.decode(
      [
        'address',
        'tuple(address,address,address,address,uint256,uint256,uint256)',
        'bytes',
        'bytes',
      ],
      data
    );

    return {
      executor: decodedData[0],
      desc: decodedData[1],
      permit: decodedData[2],
      swapData: decodedData[3],
    };
  },

  decodeFillOrderTo: function (data) {
    const decodedData = ethers.utils.defaultAbiCoder.decode(
      [
        'tuple(uint256,address,address,address,address,address,uint256,uint256,uint256,bytes)',
        'bytes',
        'bytes',
        'uint256',
        'uint256',
        'uint256',
        'address',
      ],
      data
    );

    return {
      order: decodedData[0],
      signature: decodedData[1],
      interaction: decodedData[2],
      makingAmount: decodedData[3],
      takingAmount: decodedData[4],
      skipPermitAndThresholdAmount: decodedData[5],
      target: decodedData[6],
    };
  },

  decodeFillOrderRFQTo: function (data) {
    const decodedData = ethers.utils.defaultAbiCoder.decode(
      [
        'tuple(uint256,address,address,address,address,uint256,uint256)',
        'bytes',
        'uint256',
        'address',
      ],
      data
    );

    return {
      order: decodedData[0],
      signature: decodedData[1],
      flagsAndAmount: decodedData[2],
      target: decodedData[3],
    };
  },

  // Add constant selectors if needed
  selectorUnoswap: '0xf78dc253',
  selectorUniswapV3Swap: '0xbc80f1a8',
  selectorSwap: '0x12aa3caf',
  selectorFillOrderTo: '0xe5d7bde6',
  selectorFillOrderRFQTo: '0x5a099843',
};

module.exports = OneInchDecoder;

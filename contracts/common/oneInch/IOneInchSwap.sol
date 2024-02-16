// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IOneInchSwap {  
    struct SwapDescription {
        IERC20 srcToken;
        IERC20 dstToken;
        address payable srcReceiver;
        address payable dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
    }

    struct Order {
        uint256 salt;
        address makerAsset; // targetToken
        address takerAsset; // foundryToken
        address maker;
        address receiver;   
        address allowedSender;  // equals to Zero address on public orders
        uint256 makingAmount;
        uint256 takingAmount; 
        uint256 offsets;
        bytes interactions; // concat(makerAssetData, takerAssetData, getMakingAmount, getTakingAmount, predicate, permit, preIntercation, postInteraction)
    }

    // Define external functions that will be available for interaction
    
    // fillOrderTo function
    function fillOrderTo(
        Order calldata order_,
        bytes calldata signature,
        bytes calldata interaction,
        uint256 makingAmount,
        uint256 takingAmount,  // destinationAmountIn
        uint256 skipPermitAndThresholdAmount,
        address target  // receiverAddress
    ) external payable returns(uint256 actualMakingAmount, uint256 actualTakingAmount, bytes32 orderHash);
    
    // uniswapV3SwapTo function
    function uniswapV3SwapTo(
        address payable recipient,
        uint256 amount,
        uint256 minReturn,
        uint256[] calldata pools
    ) external payable returns(uint256 returnAmount);

    // unoswapTo function
    function unoswapTo(
        address payable recipient,
        address srcToken,
        uint256 amount,
        uint256 minReturn,
        uint256[] calldata pools
    ) external payable returns(uint256 returnAmount);

    // swap function
    function swap(
        address executor,
        SwapDescription calldata desc,
        bytes calldata permit,
        bytes calldata data
    ) external payable returns (uint256 returnAmount, uint256 spentAmount);
}

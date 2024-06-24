// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IStargate, Ticket } from "@stargatefinance/stg-evm-v2/src/interfaces/IStargate.sol";
import { MessagingFee, OFTReceipt, SendParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ILayerZeroComposer } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroComposer.sol";
import { OFTComposeMsgCodec } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/libs/OFTComposeMsgCodec.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract StargateComposer is Ownable, ILayerZeroComposer {
    using OptionsBuilder for bytes;
    using SafeERC20 for IERC20;
    IStargate public stargate; // stargate usdc pool contract
    IERC20 public usdc; // usdc contract address
    address public endpoint; // endpoint contract of layer zero
    uint256 public bounds;

    event ReceivedMessage(uint256 amount, bytes someMessage);

    function initConfig(address _stargate, address _usdc, address _endpoint) external onlyOwner {
        require(_stargate != address(0), "Stargate pool address cannot be zero");
        require(_endpoint != address(0), "Stargate endpoint address cannot be zero");
        require(_usdc != address(0), "USDC address cannot be zero");
        stargate = IStargate(_stargate);
        usdc = IERC20(_usdc);
        endpoint = _endpoint;
    }

    function setBounds(uint256 _bounds) external onlyOwner {
        require(_bounds >= 0, "The amount bounds shouldn't be a non-zero value");
        bounds = _bounds;
    }

    function lzCompose(
        address _from,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external override payable {
        require(_from == address(stargate), "!stargate");
        require(msg.sender == endpoint, "!endpoint");

        uint256 amountLD = OFTComposeMsgCodec.amountLD(_message);
        bytes memory _composeMessage = OFTComposeMsgCodec.composeMsg(_message);

        // Decode the _composeMessage to get the function selector and parameters
        (address payee, uint256 amount) = abi.decode(_composeMessage, (address, uint256));

        // Calculate the lower and upper bounds for amountLD
        uint256 lowerBound = (amount * (1000 - bounds)) / 1000;
        uint256 upperBound = (amount * (1000 + bounds)) / 1000;
        
        // Check if amountLD falls within the bounds
        require(amountLD >= lowerBound && amountLD <= upperBound, "AmountLD is outside acceptable bounds");

        // Call the withdrawUSDC function on this contract
        uint256 withdrawnAmount = withdrawUSDC(payee, amountLD);
        require(withdrawnAmount == amountLD, "Failed to withdraw the expected amount");

        emit ReceivedMessage(amountLD, _composeMessage);
    }

    function withdrawUSDC(
        address payee,
        uint256 amount
    ) private returns (uint256) {
        usdc.safeTransfer(payee, amount);
        return amount;
    }

    function swapUSDC(
        uint32 _dstEid,
        uint256 _amount,
        address _composer,
        bytes memory _composeMsg,
        address _sourceAddress 
    ) external payable {
        uint256 valueToSend;
        SendParam memory sendParam;
        MessagingFee memory messagingFee;

        (valueToSend, sendParam, messagingFee) = prepareTakeTaxi(_dstEid, _amount, _composer, _composeMsg);

        usdc.approve(address(stargate), _amount);

        stargate.sendToken{ value: valueToSend }(sendParam, messagingFee, _sourceAddress);
    }
    
    function prepareTakeTaxi(
        uint32 _dstEid,
        uint256 _amount,
        address _composer,
        bytes memory _composeMsg
    ) public view returns (uint256 valueToSend, SendParam memory sendParam, MessagingFee memory messagingFee) {
        bytes memory extraOptions = _composeMsg.length > 0
            ? OptionsBuilder.newOptions().addExecutorLzComposeOption(0, 200_000, 0) // compose gas limit
            : bytes("");

        sendParam = SendParam({
            dstEid: _dstEid,
            to: addressToBytes32(_composer),
            amountLD: _amount,
            minAmountLD: _amount,
            extraOptions: extraOptions,
            composeMsg: _composeMsg,
            oftCmd: ""
        });

        (, , OFTReceipt memory receipt) = stargate.quoteOFT(sendParam);
        sendParam.minAmountLD = receipt.amountReceivedLD;

        messagingFee = stargate.quoteSend(sendParam, false);
        valueToSend = messagingFee.nativeFee;

        if (stargate.token() == address(0x0)) {
            valueToSend += sendParam.amountLD;
        }
    }

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
}

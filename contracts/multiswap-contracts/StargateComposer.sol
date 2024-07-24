// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IStargate, Ticket } from "@stargatefinance/stg-evm-v2/src/interfaces/IStargate.sol";
import { MessagingFee, OFTReceipt, SendParam } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ILayerZeroComposer } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroComposer.sol";
import { OFTComposeMsgCodec } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/libs/OFTComposeMsgCodec.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../common/SafeAmount.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract StargateComposer is Ownable, ILayerZeroComposer {
    using OptionsBuilder for bytes;
    using SafeERC20 for IERC20;
    IStargate public stargate; // stargate usdc pool contract
    IERC20 public usdc; // usdc contract address
    address public endpoint; // endpoint contract of layer zero

    event ReceivedMessage(uint256 amount, uint256 amountOut, bytes someMessage);

    function initConfig(address _stargate, address _usdc, address _endpoint) external onlyOwner {
        require(_stargate != address(0), "Stargate pool address cannot be zero");
        require(_endpoint != address(0), "Stargate endpoint address cannot be zero");
        require(_usdc != address(0), "USDC address cannot be zero");
        stargate = IStargate(_stargate);
        usdc = IERC20(_usdc);
        endpoint = _endpoint;
    }

    function setEndpoint(address _endpoint) external onlyOwner {
        require(_endpoint != address(0), "Stargate endpoint address cannot be zero");
        endpoint = _endpoint;
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

        // Decode the _composeMessage to get the receiver address
        address payee = abi.decode(_composeMessage, (address));

        // Call the withdrawUSDC function on this contract
        uint256 withdrawnAmount = withdrawUSDC(payee, amountLD);
        emit ReceivedMessage(amountLD, withdrawnAmount, _composeMessage);
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

        require(msg.value >= valueToSend, "Insufficient gas sent with the transaction");

        if(msg.value > valueToSend) {
            uint256 gas = msg.value - valueToSend;
            // Transfer the remaining gas fee to the user wallet
            SafeAmount.safeTransferETH(_sourceAddress, gas);
        }

        usdc.approve(address(stargate), _amount);
        stargate.sendToken{ value: valueToSend }(sendParam, messagingFee, _sourceAddress);
    }
    
    function prepareTakeTaxi(
        uint32 _dstEid,
        uint256 _amount,
        address _composer,
        bytes memory _composeMsg
    ) public view returns (uint256 valueToSend, SendParam memory sendParam, MessagingFee memory messagingFee) {
        bytes memory extraOptions = OptionsBuilder.newOptions().addExecutorLzComposeOption(0, 200_000, 0); // compose gas limit
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

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

    /**
     @dev Initializes the configuration of the StargateComposer contract
     @param _stargate Address of the Stargate pool contract
     @param _usdc Address of the USDC token contract
     @param _endpoint Address of the LayerZero endpoint contract
    */
    function initConfig(address _stargate, address _usdc, address _endpoint) external onlyOwner {
        require(_stargate != address(0), "Stargate pool address cannot be zero");
        require(_endpoint != address(0), "Stargate endpoint address cannot be zero");
        require(_usdc != address(0), "USDC address cannot be zero");
        stargate = IStargate(_stargate);
        usdc = IERC20(_usdc);
        endpoint = _endpoint;
    }

    /**
     @dev Sets the endpoint address
     @param _endpoint Address of the LayerZero endpoint contract
    */
    function setEndpoint(address _endpoint) external onlyOwner {
        require(_endpoint != address(0), "Stargate endpoint address cannot be zero");
        endpoint = _endpoint;
    }

    /**
     @dev Composes a LayerZero message to utilise the funds received from Stargate,
          decode the payee address and to send the tokens to payee. 
     @param _from The sender's address
     @param _guid The unique identifier for the message
     @param _message The message to be sent
     @param _executor The address of the executor
     @param _extraData Additional data for the message
    */
    function lzCompose(
        address _from,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external override payable {
        require(_from == address(stargate), "!stargate");
        require(msg.sender == endpoint, "!endpoint");

        // Receives the amountLD, amount of tokens swapped in
        uint256 amountLD = OFTComposeMsgCodec.amountLD(_message);
        bytes memory _composeMessage = OFTComposeMsgCodec.composeMsg(_message);
        
        // Decode the _composeMessage to get the receiver address
        address payee = abi.decode(_composeMessage, (address));

        // Call the withdrawUSDC function on this contract
        uint256 withdrawnAmount = withdrawUSDC(payee, amountLD);
        emit ReceivedMessage(amountLD, withdrawnAmount, _composeMessage);
    }

    /**
     @dev Withdraws USDC to a specified address
     @param payee The address to receive the USDC
     @param amount The amount of USDC to be transferred
     @return The amount of USDC withdrawn
    */
    function withdrawUSDC(
        address payee,
        uint256 amount
    ) private returns (uint256) {
        usdc.safeTransfer(payee, amount);
        return amount;
    }

    /**
     @dev Swaps USDC tokens to a specified destination
     @param _dstEid The destination endpoint ID
     @param _amount The amount of USDC to be swapped
     @param _composer The address of the composer contract
     @param _composeMsg The compose message
     @param _sourceAddress The address of the source sender
    */
    function swapUSDC(
        uint32 _dstEid,
        uint256 _amount,
        address _composer,
        bytes memory _composeMsg,
        address _sourceAddress 
    ) internal {
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

    /**
     @dev Prepares the parameters for taking a taxi (sending tokens)
     @param _dstEid The destination endpoint ID
     @param _amount The amount of USDC to be sent
     @param _composer The address of the composer contract
     @param _composeMsg The compose message
     @return valueToSend The value to be sent
     @return sendParam The parameters for sending tokens
     @return messagingFee The messaging fee for the transaction
    */
    function prepareTakeTaxi(
        uint32 _dstEid,
        uint256 _amount,
        address _composer,
        bytes memory _composeMsg
    ) public view returns (uint256 valueToSend, SendParam memory sendParam, MessagingFee memory messagingFee) {
        // Create extra options for the transaction with a compose gas limit of 200,000
        bytes memory extraOptions = OptionsBuilder.newOptions().addExecutorLzComposeOption(0, 200_000, 0);

        // Initialize the SendParam struct with provided and calculated values
        sendParam = SendParam({
            dstEid: _dstEid,
            to: addressToBytes32(_composer),
            amountLD: _amount,
            minAmountLD: _amount,
            extraOptions: extraOptions,
            composeMsg: _composeMsg,
            oftCmd: ""
        });

        // Get a quote for the OFT transaction using the send parameters
        (, , OFTReceipt memory receipt) = stargate.quoteOFT(sendParam);

        // Update the minimum amount to be received with the quoted amount from the receipt
        sendParam.minAmountLD = receipt.amountReceivedLD;

        // Get a quote for the messaging fee using the send parameters
        messagingFee = stargate.quoteSend(sendParam, false);

        // Set the value to be sent as the native fee for messaging
        valueToSend = messagingFee.nativeFee;
        
        // If the stargate token address is zero, add the amount to be sent to the valueToSend
        if (stargate.token() == address(0x0)) {
            valueToSend += sendParam.amountLD;
        }
    }

    /**
     @dev Converts an address to a bytes32 representation
     @param _addr The address to be converted
     @return The bytes32 representation of the address
    */
    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
}

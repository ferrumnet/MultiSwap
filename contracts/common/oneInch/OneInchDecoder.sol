pragma solidity ^0.8.2;

library OneInchDecoder {
struct SwapDescription {
        address srcToken;
        address dstToken;
        address payable srcReceiver;
        address payable dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
    }
    // Define the function signatures
    bytes4 public constant selectorUnoswap =
        bytes4(
            keccak256("unoswapTo(address,address,uint256,uint256,uint256[])")
        );
    bytes4 public constant selectorUniswapV3Swap =
        bytes4(keccak256("uniswapV3SwapTo(address,uint256,uint256,uint256[])"));
    bytes4 public constant selectorSwap =
        bytes4(
            keccak256(
                "swap(address,(address,address,address,address,uint256,uint256,uint256),bytes,bytes)"
            )
        );

    // Function to identify which function is being called
    function identifyFunction(bytes memory data)
        public
        pure
        returns (string memory)
    {
        require(data.length >= 4, "Data too short for valid call");

        // Extract the first 4 bytes from data
        bytes4 receivedSelector;
        assembly {
            // Extract the first 4 bytes directly from the data
            // Assuming 'data' starts with the 4-byte function selector
            receivedSelector := mload(add(data, 32))
        }

        if (receivedSelector == selectorUnoswap) {
            return "decodeUnoswap";
        } else if (receivedSelector == selectorUniswapV3Swap) {
            return "decodeUniswapV3Swap";
        } else if (receivedSelector == selectorSwap) {
            return "decodeSwap";
        } else {
            return "Unknown function";
        }
    }

    function decodeUnoswap(bytes memory data)
        public
        pure
        returns (
            address payable recipient,
        address srcToken,
            uint256 amount,
            uint256 minReturn,
            uint256[] memory pools

        )
    {
        require(data.length >= 4, "Data too short");

        // Skip the first 4 bytes (function signature)
        bytes memory params = slice(data, 4, data.length - 4);

        // Decode the parameters
        (recipient, srcToken, amount, minReturn, pools) = abi.decode(
            params,
            (address, address, uint256, uint256, uint256[])
        );
    }

    function decodeUniswapV3Swap(bytes memory data)
        public
        pure
        returns (
            address payable recipient,
            uint256 amount,
            uint256 minReturn,
        uint256[] memory pools
        )
    {
                require(data.length >= 4, "Data too short");

        // Skip the first 4 bytes (function signature)
        bytes memory params = slice(data, 4, data.length - 4);

        // Decode the parameters
        (recipient, amount, minReturn, pools) = abi.decode(
            params,
            (address, uint256, uint256, uint256[])
        );
    }

    function decodeSwap(bytes memory data)
        public
        pure
        returns (
            address executor,
            SwapDescription memory desc,
            bytes memory permit,
            bytes memory swapData
        )
    {
        require(data.length >= 4, "Data too short");

        // Skip the first 4 bytes (function signature)
        bytes memory params = slice(data, 4, data.length - 4);

        // Decode the parameters
        (executor, desc, permit, swapData) = abi.decode(
            params,
            (address, SwapDescription, bytes, bytes)
        );
    }

    function decodeSwap2(bytes memory data)
        public
        pure
        returns (
            address payable recipient,
            uint256 amount,
            uint256 minReturn
        )
    {
        require(data.length >= 4, "Data too short");

        // Decode the parameters, skipping the first 4 bytes
        (, SwapDescription memory desc, , ) = decodeSwap(data);

        // Return only the values of the SwapDescription
        return (desc.dstReceiver, desc.amount, desc.minReturnAmount);
    }

    // Helper function to slice bytes array
    function slice(
        bytes memory data,
        uint256 start,
        uint256 length
    ) internal pure returns (bytes memory) {
        bytes memory part = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            part[i] = data[i + start];
        }
        return part;
    }

    // function decodedInputs(bytes memory data)
    //     public
    //     pure
    //     returns (
    //         address payable recipient,
    //         uint256 amount,
    //         uint256 minReturn,
    //     uint256[] memory pools
    //     )
    // {
    //     require(data.length >= 4, "Data too short for valid call");

    //     // Extract the first 4 bytes from data
    //     bytes4 receivedSelector;
    //     assembly {
    //         // Extract the first 4 bytes directly from the data
    //         // Assuming 'data' starts with the 4-byte function selector
    //         receivedSelector := mload(add(data, 32))
    //     }

    //     if (receivedSelector == selectorUnoswap) {
    //         // Call decodeUnoswap and return its values
    //         (recipient, amount, minReturn, pools) = decodeUnoswap(data);
    //     } else if (receivedSelector == selectorUniswapV3Swap) {
    //         // Call decodeUniswapV3Swap and return its values
    //         (recipient, amount, minReturn, pools) = decodeUniswapV3Swap(data);
    //     } else if (receivedSelector == selectorSwap) {
    //         (recipient, amount, minReturn) = decodeSwap2(data);

    //     }
        // Assuming decodeSwap is not needed as per your comment
        // else {
        //     revert("Unknown function selector");
        // }
        // Implicitly returns recipient, amount, minReturn
    // }
}

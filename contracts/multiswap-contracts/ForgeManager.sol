// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "./FundManager.sol";

contract ForgeFundManager is FundManager {
    constructor() {
    }
    // Override and revert the 'addSigner' function
    function addSigner(address _signer) external onlyOwner override {
        revert("Not Supported");
    }
    // Override and revert the 'removeSigner' function
    function removeSigner(address _signer) external onlyOwner override {
        revert("Not Supported");
    }
    // Override and revert the 'allowTarget' function
    function allowTarget(address token, uint256 chainId, address targetToken) external onlyAdmin override {
        revert("Not Supported");
    }
    // Override and revert the 'nonEvmAllowTarget' function
    function nonEvmAllowTarget(address token, string memory chainId, string memory targetToken) external onlyAdmin override {
        revert("Not Supported");
    }
    // Override and revert the 'disallowTarget' function
    function disallowTarget(address token, uint256 chainId) external onlyAdmin override {
        revert("Not Supported");
    }
    // Override and revert the 'nonEvmDisallowTarget' function
    function nonEvmDisallowTarget(address token, string memory chainId) external onlyAdmin override {
        revert("Not Supported");
    }
    // Override and revert the 'removeFoundryAsset' function
    function removeFoundryAsset(address token) external onlyAdmin override {
        revert("Not Supported");
    }
    // Override and revert the 'swapToAddress' function
    function swapToAddress(address token, uint256 amount, uint256 targetNetwork, address targetAddress) external onlyRouter override returns (uint256) {
        revert("Not Supported");
    }
    // Override and revert the 'nonEvmSwapToAddress' function
    function nonEvmSwapToAddress(address token, uint256 amount, string memory targetNetwork, string memory targetToken, string memory targetAddress) external onlyRouter override returns (uint256) {
        revert("Not Supported");
    }

    // Override and bypass the signer verification
    function withdrawSigned(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes memory signature
    ) external override onlyRouter returns (uint256) {
        require(token != address(0), "FM: bad token");
        require(payee != address(0), "FM: bad payee");
        require(salt != 0, "FM: bad salt");
        require(amount != 0, "FM: bad amount");
        require(block.timestamp < expiry, "FM: signature timed out");
        require(expiry < block.timestamp + WEEK, "FM: expiry too far");
        bytes32 message =  keccak256(
                abi.encode(WITHDRAW_SIGNED_METHOD, token, payee, amount, salt, expiry)
            );
        address _signer = signerUnique(message, signature);
        
        // require(signers[_signer], "FM: Invalid signer");
        // require(!usedSalt[salt], "FM: salt already used");
        usedSalt[salt] = true;
        TokenReceivable.sendToken(token, payee, amount);
        emit TransferBySignature(_signer, payee, token, amount);
        return amount;
    }
    
    // Override and bypass the signer verification
    function withdrawSignedOneInch(
        address to,
        uint256 amountIn,
        uint256 amountOut,
        address foundryToken,
        address targetToken,
        bytes memory oneInchData,
        bytes32 salt,
        uint256 expiry,
        bytes memory signature
    ) external override onlyRouter returns (uint256) {
        require(targetToken != address(0), "FM: bad token");
        require(foundryToken != address(0), "FM: bad token");
        require(to != address(0), "FM: bad payee");
        require(salt != 0, "FM: bad salt");
        require(amountIn != 0, "FM: bad amount");
        require(amountOut != 0, "FM: bad amount");
        require(block.timestamp < expiry, "FM: signature timed out");
        require(expiry < block.timestamp + WEEK, "FM: expiry too far");

        bytes32 message =  keccak256(
                abi.encode(
                    WITHDRAW_SIGNED_ONEINCH__METHOD,
                    to,
                    amountIn,
                    amountOut,
                    foundryToken,
                    targetToken,
                    oneInchData,
                    salt,
                    expiry
                )
            );
        address _signer = signerUnique(message, signature);
        // require(signers[_signer], "FM: Invalid signer");
        // require(!usedSalt[salt], "FM: salt already used");
        usedSalt[salt] = true;
        TokenReceivable.sendToken(foundryToken, router, amountIn);
        emit TransferBySignature(_signer, router, foundryToken, amountIn);
        return amountIn;
    }

    // Override and revert the 'withdrawSignedVerify' function
    function withdrawSignedVerify(
        address token,
        address payee,
        uint256 amount,
        bytes32 salt,
        uint256 expiry,
        bytes calldata signature
    ) external view override returns (bytes32, address) {
        revert("Not Supported");
    }

    // Override and revert the 'withdrawSignedOneInchVerify' function
    function withdrawSignedOneInchVerify(
        address to,
        uint256 amountIn,
        uint256 amountOut,
        address foundryToken,
        address targetToken,
        bytes memory oneInchData,
        bytes32 salt,
        uint256 expiry,
        bytes calldata signature
    ) external view override returns (bytes32, address) {
        revert("Not Supported");
    }

    // Override and revert the 'removeLiquidityIfPossible' function
    function removeLiquidityIfPossible(address token, uint256 amount)
        external override
        returns (uint256)
    {
        revert("Not Supported");
    }

    // Override and revert the 'liquidity' function
    function liquidity(address token, address liquidityAdder)
        external
        view override
        returns (uint256)
    {
        revert("Not Supported");
    }
}

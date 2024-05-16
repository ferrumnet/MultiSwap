# FiberRouter Contract Documentation

## Overview
The `FiberRouter` is an essential component of the Ferrum Network, designed to facilitate advanced token operations such as cross-chain and intra-chain / omnichain swaps. It integrates functionality for handling token exchanges, fee distribution, and interchain transactions, all within a robust and secure framework.

## Import Dependencies
- **Ownable**: Provides mechanisms for owner-only access control which is essential for administrative actions.
- **IInterchainTokenStandard**: Interface for handling operations across different blockchain tokens, enabling standardized cross-chain functionalities.
- **InterchainTokenExecutable**: Base contract for executing cross-chain token operations, ensuring compatibility and functionality across networks.
- **TokenReceivable**: Allows the contract to accept incoming token transfers, facilitating token swaps and fees collection.
- **SafeAmount**: Ensures safe mathematical operations, preventing overflows and underflows during token calculations.
- **IWETH**: Interface for the Wrapped Ether contract, enabling operations with Ether as if it were an ERC20 token.

## Constants
- **NATIVE_CURRENCY**: Represents the native blockchain currency in a tokenized form to standardize handling of different asset types across the contract.
  - Address: `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`

## State Variables
- **weth**: Stores the address of the Wrapped Ether contract, which is used to handle ETH transactions like regular token transfers.
- **fundManager**: Points to the fund management contract responsible for orchestrating non-CCTP (Cross-Chain Trading Protocol) swaps.
- **cctpFundManager**: Designates the manager for CCTP swaps, handling the logistics of cross-chain operations.
- **gasWallet**: Payable address used specifically for managing gas expenditures during transaction processing.

## Structs
- **SwapCrossData**: Holds data necessary for executing cross-chain swaps.
  - `targetNetwork`: The target blockchain ID.
  - `targetToken`: Address of the token on the target network.
  - `targetAddress`: Address where the tokens should be delivered on the target network.

- **SwapTypesData**: Contains flags and identifiers to specify the type of swap operation.
  - `cctpType`: Boolean indicating if the swap is a CCTP operation.
  - `multiTokenType`: Identifier for the type of token involved in multi-token operations.
  - `chainIdString`: String representation of the chain ID, used in multi-chain operations.

# Events

## SwapSameNetwork
- **Emitted for**: Swaps that occur within the same blockchain.
- **Parameters**:
  - `sourceToken` (`address`): The token being swapped from.
  - `targetToken` (`address`): The token being swapped to.
  - `sourceAmount` (`uint256`): The amount of the source token being swapped.
  - `settledAmount` (`uint256`): The amount of the target token received after the swap.
  - `sourceAddress` (`address`): The address initiating the swap.
  - `targetAddress` (`address`): The address receiving the swapped tokens.

## Withdraw
- **Emitted for**: Successful token withdrawals.
- **Parameters**:
  - `token` (`address`): The token being withdrawn.
  - `receiver` (`address`): The address receiving the tokens.
  - `amount` (`uint256`): The amount of tokens withdrawn.
  - `salt` (`bytes32`): A unique identifier for the transaction to prevent replay attacks.
  - `signature` (`bytes`): The signature verifying the transaction was authorized.

## WithdrawRouter
- **Emitted for**: Token withdrawals that involve routing logic, especially for cross-chain swaps.
- **Parameters**:
  - `to` (`address payable`): The address to which tokens are withdrawn.
  - `amountIn` (`uint256`): The input amount for the swap.
  - `amountOut` (`uint256`): The output amount after the swap.
  - `foundryToken` (`address`): The token used in the swap.
  - `targetToken` (`address`): The final token intended to be received.
  - `router` (`address`): The router handling the swap.
  - `routerCalldata` (`bytes`): The call data required for the router to execute the swap.
  - `salt` (`bytes32`): A unique identifier for the transaction.
  - `multiSignature` (`bytes`): The multi-signature verifying the transaction was authorized.

## OmniSwapFailed
- **Emitted for**: Failed OmniSwap operations, which are designed for seamless swaps across different chains.
- **Parameters**:
  - `token` (`address`): The token intended to be swapped.
  - `amount` (`uint256`): The amount of the token that failed to be swapped.
  - `receiver` (`address`): The intended recipient of the token.

## RouterAndSelectorWhitelisted / RouterAndSelectorRemoved
- **Emitted for**: Tracking changes to router and selector combinations in the whitelist system.
- **Parameters for Whitelisted**:
  - `router` (`address`): The router address being added to the whitelist.
  - `selector` (`bytes4`): The function selector being whitelisted for the specified router.
- **Parameters for Removed**:
  - `router` (`address`): The router address being removed from the whitelist.
  - `selector` (`bytes`): The function selector being removed from the whitelist.


## Constructor
- **Purpose**: Sets up the contract with essential configurations for interchain token services.
- **Parameter**:
  - `interchainTokenService`: The address of the service handling interchain tokens, which is critical for enabling the contract's cross-chain functionalities.

## Functions

### setWeth
- **Purpose**: Configures the address of the Wrapped Ether (WETH) contract used within the router. WETH is essential for handling Ether in a manner compatible with ERC-20 token standards, facilitating operations that require Ether to be treated as a token.
- **Parameter**:
  - `_weth` (`address`): The address of the Wrapped Ether contract.
- **Visibility**: `external`
- **Access Control**: `onlyOwner`
  - Only the owner of the contract can set the WETH address, ensuring that this critical configuration is secured against unauthorized changes.

### setFundManager
- **Purpose**: Sets the address of the `FundManager` contract, which is responsible for managing the logistics and operations involved in non-CCTP swaps.
- **Parameter**:
  - `_fundManager` (`address`): The address of the `FundManager`.
- **Visibility**: `external`
- **Access Control**: `onlyOwner`
  - This function is restricted to the owner, emphasizing the importance of controlling who can manage the fund operations.

### setCCTPFundManager
- **Purpose**: Assigns the address of the `CCTPFundManager` to handle all cross-chain token protocol operations, ensuring that CCTP swaps are managed by a specialized component.
- **Parameter**:
  - `_cctpFundManager` (`address`): The address of the `CCTPFundManager`.
- **Visibility**: `external`
- **Access Control**: `onlyOwner`
  - Similar to other critical management functions, only the owner has the authority to set or update this address.

### setGasWallet
- **Purpose**: Specifies the payable address that will be used for managing gas payments related to the router's operations. This function is crucial for ensuring that transaction fees are handled efficiently and securely.
- **Parameter**:
  - `_gasWallet` (`address payable`): The wallet address that will be charged for gas when necessary.
- **Visibility**: `external`
- **Access Control**: `onlyOwner`
  - Protecting this setting is vital to prevent unauthorized manipulation of transaction cost handling.

### addRouterAndSelectors
- **Purpose**: Adds a router and associated selectors to the whitelist, enabling specific router functions to be called securely within the contract. This setup supports flexible yet secure execution of decentralized finance operations.
- **Parameters**:
  - `router` (`address`): The router address to whitelist.
  - `selectors` (`bytes4[]`): An array of function selectors that the router is allowed to call.
- **Visibility**: `external`
- **Access Control**: `onlyOwner`
  - Ensuring that only the owner can manage this whitelist defends against unauthorized routing operations, which could compromise security.

### removeRouterAndSelector
- **Purpose**: Removes a router and selector combination from the whitelist, revoking previously granted permissions to execute specific router functions. This is essential for maintaining the integrity and security of the contract's operations.
- **Parameters**:
  - `router` (`address`): The router address to be removed.
  - `selector` (`bytes`): The specific function selector to remove from the whitelist for the given router.
- **Visibility**: `external`
- **Access Control**: `onlyOwner`
  - As with additions, only the owner can remove entries to prevent unauthorized parties from altering the routing logic.

### isAllowListed
- **Purpose**: Checks if a router and selector combination is currently whitelisted, allowing for verification before performing potentially sensitive operations.
- **Parameters**:
  - `router` (`address`): The router address to check.
  - `selector` (`bytes`): The selector to verify against the whitelist.
- **Visibility**: `public`
  - This function is public to enable on-the-fly checks from within the contract and externally, providing transparency and utility in routing operations.
- **Returns**:
  - `bool`: Returns `true` if the router and selector combination is whitelisted, `false` otherwise.

### swapOnSameNetwork
- **Purpose**: Executes a token swap on the same blockchain network using a specified decentralized exchange router. This function facilitates direct token exchanges without requiring cross-chain mechanisms, optimizing for speed and cost efficiency on single-chain operations.
- **Parameters**:
  - `amountIn` (`uint256`): The amount of the source token to be swapped.
  - `minAmountOut` (`uint256`): The minimum amount of the target token expected to be received, accounting for slippage.
  - `fromToken` (`address`): The token being swapped from.
  - `toToken` (`address`): The token being swapped to.
  - `targetAddress` (`address`): The recipient's address for the swapped tokens.
  - `router` (`address`): The decentralized exchange router to conduct the swap.
  - `routerCalldata` (`bytes`): The call data necessary for the router to execute the swap properly.
- **Visibility**: `external`
- **Modifiers**: `nonReentrant`
  - Prevents re-entry attacks during the execution of this function.
- **Behavior**:
  - Validates the necessary conditions for a successful swap.
  - Performs the swap using the specified router and parameters, ensuring that the minimum expected output is met.
  - Emits a `SwapSameNetwork` event detailing the swap's specifics.

### swapOnSameNetworkETH
- **Purpose**: Specialized function to handle swaps involving native Ether, converting ETH to WETH within the transaction flow, which is then swapped for another token. This function addresses the need for handling native blockchain currency seamlessly within token swap operations.
- **Parameters**:
  - Similar to `swapOnSameNetwork`, but handles ETH specifically and requires value to be sent with the call.
- **Visibility**: `external`
- **Modifiers**: `payable`, `nonReentrant`
- **Behavior**:
  - Accepts ETH, wraps it into WETH, and performs the swap to another token using the specified parameters and router.
  - Ensures that the slippage constraints are met.
  - Emits a `SwapSameNetwork` event with details on the transaction.

### swapSigned
- **Purpose**: Executes a cross-chain or complex swap involving multiple types and layers of validation. This function is designed to handle more intricate swap scenarios that may include different token standards and interchain operations.
- **Parameters**:
  - `swapTypes` (`SwapTypesData`): Contains flags and data specifying the type of swap, such as whether it's a CCTP operation or involves multiple token types.
  - `token` (`address`): The token being swapped.
  - `amount` (`uint256`): The amount of the token to be swapped.
  - `sd` (`SwapCrossData`): Data detailing the target network, token, and address for the swap.
  - `withdrawalData` (`bytes32`): Additional data relevant to the swap, typically involving authentication or routing specifics.
  - `fd` (`FeeDistributionData`): Data concerning how fees should be distributed as part of the transaction.
- **Visibility**: `external`
- **Modifiers**: `payable`, `nonReentrant`
- **Behavior**:
  - Conducts validation checks to ensure all parameters meet the required criteria for a successful swap.
  - Depending on the swap type, routes the tokens appropriately through different fund management pathways.
  - Handles fee distribution and gas cost management as part of the swap process.
  - Emits a `Swap` event providing comprehensive details of the executed swap.

### swapSignedAndCrossRouter
- **Purpose**: Initiates a token swap and sets up a cross-chain transfer within the same transaction. This method is designed for complex operations that require both a local token swap and subsequent preparation for an interchain move.
- **Parameters**:
  - `swapTypes` (`SwapTypesData`): Contains flags indicating the type of swap, such as CCTP-related or regular interchain transfers.
  - `amountIn` (`uint256`): The amount of the input token to be swapped.
  - `minAmountOut` (`uint256`): The minimum acceptable amount of the output token after the swap, accounting for slippage.
  - `fromToken` (`address`): The token address from which the swap will start.
  - `foundryToken` (`address`): The intermediary or final token intended for cross-chain transfer.
  - `router` (`address`): The decentralized exchange router to execute the swap.
  - `routerCalldata` (`bytes`): The specific call data required by the router for the swap.
  - `sd` (`SwapCrossData`): Additional cross-chain data required for targeting the swap.
  - `withdrawalData` (`bytes32`): Data necessary for the withdrawal and transfer processes.
  - `fd` (`FeeDistributionData`): Information on how transaction fees should be distributed.
- **Visibility**: `external`
- **Modifiers**: `payable`, `nonReentrant`
- **Behavior**:
  - Conducts a local token swap through the specified router and parameters.
  - Distributes any applicable fees according to the contract's fee structure.
  - Prepares tokens for cross-chain transfer based on the specified swap type, whether via CCTP or through ITS.
  - Ensures the gas fees are covered and properly accounted for during the transaction.
  - Emits detailed events to log the swap and any preparatory actions for cross-chain activities.

### swapSignedAndCrossRouterETH
- **Purpose**: Facilitates a token swap starting with Ether as the input, converting it to WETH, then performing a swap and setting up for a cross-chain transfer. This function is critical for operations involving Ether in complex interchain scenarios.
- **Parameters**:
  - Same as `swapSignedAndCrossRouter`, but designed specifically for initial inputs in ETH.
- **Visibility**: `external`
- **Modifiers**: `payable`, `nonReentrant`
- **Behavior**:
  - Receives Ether, converts it to WETH, and uses it in subsequent swap operations.
  - Handles all aspects of the swap, fee distribution, and preparation for cross-chain transfers.
  - Ensures the transaction adheres to specified slippage limits.
  - Manages the routing and execution of the swap to meet cross-chain requirements effectively.

### withdrawSigned
- **Purpose**: Executes a withdrawal operation based on a pre-signed authorization, allowing for secure, verified transactions that can integrate with external systems or contracts.
- **Parameters**:
  - `token` (`address`): The token to be withdrawn.
  - `payee` (`address`): The recipient of the withdrawn tokens.
  - `amount` (`uint256`): The amount of tokens to be transferred.
  - `salt` (`bytes32`): A unique identifier to ensure the transaction's uniqueness and prevent replay attacks.
  - `expiry` (`uint256`): Timestamp indicating when the signed authorization expires.
  - `multiSignature` (`bytes`): A signature or set of signatures validating the withdrawal.
  - `cctpType` (`bool`): A boolean flag indicating whether the withdrawal is part of a CCTP operation.
- **Visibility**: `public`
- **Modifiers**: `nonReentrant`
- **Behavior**:
  - Validates the withdrawal authorization against the provided signatures and other security parameters.
  - Conducts the withdrawal from the appropriate pool based on whether it is a CCTP-related transaction.
  - Logs the transaction using the `Withdraw` event, providing transparency and traceability.

### withdrawSignedAndSwapRouter
- **Purpose**: Facilitates a withdrawal of tokens that are immediately swapped using a specified router.
- **Parameters**:
  - `swapTypes` (`SwapTypesData`): Contains flags indicating the type of swap and additional data like chain ID string and token type.
  - `to` (`address payable`): The destination address for the swapped tokens.
  - `amountIn` (`uint256`): The amount of the input token to be swapped.
  - `minAmountOut` (`uint256`): The minimum acceptable amount of the output token after the swap, protecting against excessive slippage.
  - `foundryToken` (`address`): The token to be used in the swap, typically involving a conversion or handling fee.
  - `targetToken` (`address`): The token to be received after the swap.
  - `router` (`address`): The decentralized exchange router to execute the swap.
  - `routerCalldata` (`bytes`): The call data necessary for the router to execute the swap properly.
  - `salt` (`bytes32`): A unique identifier for the transaction.
  - `expiry` (`uint256`): The expiration time of the signature, ensuring the transaction is executed in a timely manner.
  - `multiSignature` (`bytes`): The signatures required to authorize the transaction.
- **Visibility**: `public`
- **Modifiers**: `payable`, `nonReentrant`
- **Behavior**:
  - Withdraws tokens and immediately swaps them using the configured router and swap parameters.
  - Emits a detailed `WithdrawRouter` event capturing all relevant transaction parameters.
  - **Ominiswap Logic**:
    - **Multi-Token Handling**: This function includes advanced logic to handle cases where `multiTokenType` is greater than 0, indicating the presence of multiple token types or interchain operations:
      - If `multiTokenType` is `1`, it signifies an interchain transfer. In this scenario, the method uses `IInterchainTokenStandard(targetToken).interchainTransfer`, facilitating a transfer across chains.
        - `chainIdString`: Extracted from `swapTypes`, used to specify the target chain ID for the interchain transfer.
        - `abi.encodePacked(_readCalldataAddress(0x24))`: Retrieves the first argument from the calldata, a mechanism used to avoid stack too deep errors.
        - `amountOut`: The output amount from the swap, which will be sent across chains.
        - The interchain transfer is funded with `msg.value` to cover potential cross-chain fees.
      - This architecture allows for future expansion where additional token types can be integrated with custom logic tailored to specific interchain or multi-token scenarios.
- **Stack Too Deep Workaround**:
  - Utilizes local variables `chainIdString` and `multiTokenType` to manage complex data structures within Solidity's stack limitations, ensuring all operations maintain clarity and efficiency without exceeding local variable limits.

### Internal Helper Functions

### _swapAndCheckSlippage
- **Purpose**: Performs the token swap via the specified router and verifies that the output amount meets the expected minimum output, effectively managing slippage. This internal function is a core component of swap execution, ensuring that token exchanges meet the trade criteria specified by users.
- **Parameters**:
  - `targetAddress` (`address`): The recipient of the output tokens from the swap.
  - `fromToken` (`address`): The token being exchanged.
  - `toToken` (`address`): The token expected after the swap.
  - `amountIn` (`uint256`): The amount of the `fromToken` provided for the swap.
  - `minAmountOut` (`uint256`): The minimum amount of `toToken` expected to be received to ensure the swap does not suffer from unfavorable slippage.
  - `router` (`address`): The DEX router conducting the swap.
  - `data` (`bytes`): The router-specific calldata needed to perform the swap.
- **Visibility**: `internal`
- **Behavior**:
  - Approves the router to access the necessary amount of `fromToken`.
  - Calls the router with the provided data to execute the swap.
  - Verifies the amount of `toToken` received post-swap, ensuring it meets or exceeds the `minAmountOut`.
  - Manages exceptions and errors during the swap execution, reverting if the output is less than expected or if the router call fails.
  - Returns the actual amount of `toToken` received, providing this data back to calling functions for further processing or logging.

#### isAllowListed
- **Purpose:** Verifies if a router and its associated function selector are on the whitelist, permitting it to initiate transactions.
- **Visibility:** Public
- **Modifiers:** None (view function)
- **Parameters:**
  - `router` (address): The address of the router.
  - `selector` (bytes memory): The function selector associated with the router.
- **Returns:** `bool` - Returns true if the router and selector combination is whitelisted, false otherwise.
- **Behavior:** Utilizes the `_getKey` function to generate a unique key for the router and selector combination and checks this against the `routerAllowList` mapping.
- **Effects:** Purely a read operation; does not modify state.

#### _makeRouterCall
- **Purpose:** Executes a call to a router using provided calldata, handling all interactions necessary for the swap operation.
- **Visibility:** Private
- **Parameters:**
  - `router` (address): The address of the router to which the call is made.
  - `data` (bytes memory): The calldata to be passed to the router for the swap.
- **Behavior:** Makes a low-level `call` to the specified router with the provided `data`. If the call fails, it checks if there is return data to provide a specific error message; if no return data is present, a generic "Call to router failed" error is thrown.

#### _getBalance
- **Purpose:** Retrieves the balance of a specified token for a given account. If querying the native currency, it returns the account's Ether balance.
- **Visibility:** Private
- **Modifiers:** None (view function)
- **Parameters:**
  - `token` (address): The token address, or the special `NATIVE_CURRENCY` address for Ether.
  - `account` (address): The account whose balance is being queried.
- **Returns:** `uint256` - The balance of the token or Ether for the specified account.
- **Behavior:** Checks if the token address matches `NATIVE_CURRENCY` to differentiate between a token balance query and an Ether balance query, using appropriate method calls.

#### _approveAggregatorRouter
- **Purpose:** Approves a specified amount of a token for a router to handle, setting up for transactions such as swaps.
- **Visibility:** Private
- **Parameters:**
  - `token` (address): The token for which approval is being granted.
  - `router` (address): The router that is being authorized to use the tokens.
  - `amount` (uint256): The amount of tokens the router is allowed to use.
- **Behavior:** Checks if there is an existing token allowance for the router and resets it to zero if necessary before setting it to the new specified amount using `safeApprove` from the ERC20 token standard.

#### _getKey
- **Purpose:** Generates a unique key for a router and data combination used in the `routerAllowList` to manage whitelisted routers and their selectors.
- **Visibility:** Private
- **Modifiers:** None (pure function)
- **Parameters:**
  - `router` (address): The router's address.
  - `data` (bytes memory): The data typically containing the function selector.
- **Returns:** `bytes32` - A unique key generated based on the router address and the first four bytes (function selector) of the provided data.
- **Behavior:** Uses inline assembly to efficiently combine the router address and the function selector into a single `bytes32` key, ensuring uniqueness and consistency for whitelist checks.

### _executeWithInterchainToken
- **Purpose**: This function is designed to facilitate operations that involve tokens meant for interchain transactions. It attempts to execute operations defined in the `fiberRouterCalldata`, which typically involve complex token routing or swaps necessary for cross-chain functionality.
- **Parameters**:
  - `commandId` (`bytes32`): A unique identifier for the command being executed, used to track and manage interchain requests.
  - `sourceChain` (`string calldata`): The identifier (usually a chain ID or name) of the source blockchain from which the operation is initiated.
  - `sourceAddress` (`bytes calldata`): Encoded address information, detailing the originator of the transaction within the source chain.
  - `fiberRouterCalldata` (`bytes calldata`): The calldata to be executed on this contract, containing all necessary instructions for the intended token operation.
  - `tokenId` (`bytes32`): An identifier for the token type involved in the interchain operation, useful for handling specific token behaviors or requirements.
  - `token` (`address`): The address of the token being manipulated or transferred as part of the interchain operation.
  - `amount` (`uint256`): The amount of tokens to be handled, transferred, or swapped in the operation.
- **Visibility**: `internal`
- **Modifiers**: `override`
- **Behavior**:
  - Attempts to execute the provided `fiberRouterCalldata` within the context of this contract, using a direct contract call.
  - If the execution fails (e.g., due to errors in the calldata execution or rejection by the receiving function), it triggers a fallback mechanism:
    - Calculates the recipient's address from the `sourceAddress` bytes.
    - Transfers the specified `amount` of `token` directly to the calculated recipient, ensuring that the tokens are not locked or lost due to failed operations.
    - Emits an `OmniSwapFailed` event to log the failure and the action taken, providing transparency and traceability for the operation.

### _readCalldataAddress
- **Purpose**: Extracts an address from a specific position within the calldata of a transaction. This utility function is crucial for operations where addresses need to be dynamically read from complex or variable-length inputs.
- **Parameter**:
  - `cdPtr` (`uint256`): The position in the calldata from which the address should be read, typically indicating the start of the address bytes.
- **Visibility**: `internal`
- **Returns**:
  - `addr` (`address`): The address decoded from the specified position in the calldata.
- **Behavior**:
  - Uses low-level assembly to directly access and load the address from the specified position in the calldata, ensuring efficient and accurate retrieval.


# FeeDistributor Contract Documentation

## Overview
`FeeDistributor` is designed to handle the distribution of transaction fees collected from various operations within the MultiSwap ecosystem. This contract ensures that fees are allocated and disbursed accurately to various stakeholders according to predefined rules.

## Imports
The contract imports several OpenZeppelin libraries and contracts for security and functionality enhancement:
- `SafeERC20` for safe ERC20 token interactions.
- `ECDSA` for cryptographic operations.
- `EIP712` for implementing typed structured data hashing and signing.
- `Ownable` for access control.

## Constants
- **NAME:** `"FEE_DISTRIBUTOR"`
  - A constant for the EIP712 domain separator.
- **VERSION:** `"000.001"`
  - Version of the contract used in the EIP712 domain.
- **MINUTE:** `60`
  - Represents the number of seconds in a minute, used for time calculations.

## State Variables
- **signers:** `mapping(address => bool) public`
  - A mapping to keep track of addresses that are authorized to sign fee distribution orders.
- **usedSalt:** `mapping(bytes32 => bool) public`
  - Tracks whether a unique identifier (salt) has been used to prevent replay attacks in transactions.

## Structs

### FeeAllocation
- **Purpose:** Defines the structure for fee allocations to recipients.
- **Fields:**
  - `recipient` (address): The recipient of the fee.
  - `platformFee` (uint256): The amount of fee allocated to the recipient.

### FeeDistributionData
- **Purpose:** Holds data required to execute fee distributions.
- **Fields:**
  - `feeAllocations` (FeeAllocation[]): An array of `FeeAllocation` structures detailing each recipient and their respective fee.
  - `totalPlatformFee` (uint256): The total amount of platform fees to be distributed.
  - `sourceAmountIn` (uint256): The total amount of tokens before fees are applied.
  - `sourceAmountOut` (uint256): The total amount of tokens after fees are applied.
  - `destinationAmountIn` (uint256): The total amount of tokens received in the destination before fees.
  - `destinationAmountOut` (uint256): The total amount of tokens in the destination after fees.
  - `salt` (bytes32): A unique identifier for the transaction.
  - `expiry` (uint256): Expiration time for the fee distribution order.
  - `signature` (bytes): Signature proving the authenticity and approval of the fee distribution.

## Events

### FeesDistributed
- **Purpose:** Logs the distribution of fees for transparency and tracking.
- **Parameters:**
  - `token` (address): The token in which the fees were distributed.
  - `preFeeAmount` (uint256): The amount before fees were deducted.
  - `afterFeeAmount` (uint256): The remaining amount after fees were deducted.
  - `totalPlatformFee` (uint256): The total amount of fees distributed.

## Functions

### Constructor
- Initializes the EIP712 domain with the name and version of the contract.

### addSigner
- **Purpose:** Adds an address that is authorized to sign fee distribution orders.
- **Modifiers:** `onlyOwner`
- **Parameters:**
  - `_signer` (address): The address to be added as a signer.

### removeSigner
- **Purpose:** Removes an address from the list of authorized signers.
- **Modifiers:** `onlyOwner`
- **Parameters:**
  - `_signer` (address): The address to be removed.

### _distributeFees
- **Purpose:** Internal function that handles the actual distribution of fees according to the `FeeDistributionData`.
- **Parameters:**
  - `token` (address): The token in which fees are to be distributed.
  - `preFeeAmount` (uint256): The total token amount before fees are deducted.
  - `fdd` (FeeDistributionData): Data structure containing detailed distribution instructions.
- **Flow:** Validates the transaction signature and timing, performs the distribution of fees to each recipient, and emits a `FeesDistributed` event.

### _verify
- **Purpose:** Private function to verify the signature of a fee distribution order.
- **Parameters:**
  - `token` (address): The token involved in the distribution.
  - `fdd` (FeeDistributionData): The data required for executing the distribution.
- **Flow:** Verifies the signature against the stored signers, checks the expiry and salt usage to ensure the transaction's validity.

### _encodeFeeAllocations
- **Purpose:** Encodes fee allocations for hashing and signature verification.
- **Parameters:**
  - `feeAllocations` (FeeAllocation[]): The allocations to be encoded.
- **Flow:** Iterates through each allocation, encoding and hashing the details for use in transaction verification.

# FundManager Contract Documentation

## Overview
`FundManager` is a core component of the MultiSwap project, responsible for managing and distributing funds within the ecosystem. It handles various operations related to fund transfers, including liquidity management, cross-network transactions, and ensuring secure processing of transactions through signature verifications.

## Constants and State Variables
- **WEEK:** `uint32 constant`
  - Represents the number of seconds in a week, used for calculating expiration times.
- **NAME:** `string public constant`
  - Used in the EIP-712 domain separator, set to "FUND_MANAGER".
- **VERSION:** `string public constant`
  - Indicates the contract version, set to "000.004".

## State Variables
- **fiberRouter:** `address public`
  - The address of the FiberRouter contract which interacts with this FundManager.
- **settlementManager:** `address public`
  - Address of the Settlement Manager which is authorized to manage settlement processes.
- **signers:** `mapping(address => bool) public`
  - Mapping of addresses that are authorized to sign certain operations within the contract.
- **liquidities:** `mapping(address => mapping(address => uint256)) private`
  - Tracks the liquidity added by different addresses for various tokens.
- **allowedTargets:** `mapping(address => mapping(uint256 => address)) public`
  - Stores allowed target tokens for each chain, facilitating cross-chain swaps.
- **isFoundryAsset:** `mapping(address => bool) public`
  - Indicates whether a token is recognized as a foundry asset within the ecosystem.
- **usedSalt:** `mapping(bytes32 => bool) public`
  - Keeps track of salts used in operations to prevent replay attacks.

## Modifiers
- **onlyRouter:**
  - Ensures that only the FiberRouter can call certain functions.
- **onlySettlementManager:**
  - Allows only the Settlement Manager to execute specific administrative functions.

## Events

### TransferBySignature
- **Purpose:** Logs successful token transfers that are executed following a verified signature authorization.
- **Parameters:**
  - `signer` (address): The address of the signer who authorized the token transfer.
  - `receiver` (address): The recipient of the tokens.
  - `token` (address): The token that was transferred.
  - `amount` (uint256): The quantity of tokens transferred.
- **Description:** This event is triggered when tokens are successfully transferred as per the instructions contained in a signed message. It serves to provide a traceable record of all signed transfers, enhancing the security and transparency of token movements within the system.

### FailedWithdrawalCancelled
- **Purpose:** Records the cancellation of a failed withdrawal attempt, which is vital for tracking unsuccessful or invalid transactions.
- **Parameters:**
  - `settlementManager` (address indexed): The Settlement Manager responsible for overseeing the cancellation.
  - `receiver` (address indexed): The intended recipient of the withdrawal.
  - `token` (address indexed): The token attempted to be withdrawn.
  - `amount` (uint256): The amount involved in the failed transaction.
  - `salt` (bytes32): A unique identifier used to mark the transaction.
- **Description:** This event is emitted when a withdrawal initiated by a signature fails due to reasons such as invalid parameters, expiration, or other checks. It ensures that all parties are informed of the cancellation, maintaining the integrity and trust in the withdrawal process.

### BridgeLiquidityAdded
- **Purpose:** Indicates the addition of liquidity for a specific token by an actor within the ecosystem.
- **Parameters:**
  - `actor` (address): The address of the entity or individual who added the liquidity.
  - `token` (address): The token for which liquidity was added.
  - `amount` (uint256): The amount of liquidity added.
- **Description:** Triggered when an actor adds liquidity to the pool, this event helps in tracking the inflow of funds into liquidity pools, ensuring transparency in liquidity management.

### BridgeLiquidityRemoved
- **Purpose:** Logs the removal of liquidity for a specific token by an actor.
- **Parameters:**
  - `actor` (address): The address of the entity or individual who removed the liquidity.
  - `token` (address): The token for which liquidity was removed.
  - `amount` (uint256): The amount of liquidity removed.
- **Description:** This event is crucial for monitoring the outflow of funds from liquidity pools, providing stakeholders with clear visibility into liquidity adjustments.

### BridgeSwap
- **Purpose:** Logs details of cross-chain swaps, facilitating tracking of these complex transactions across different blockchain networks.
- **Parameters:**
  - `from` (address): The origin address initiating the swap.
  - `token` (address indexed): The token being swapped.
  - `targetNetwork` (uint256): The network to which the tokens are being swapped.
  - `targetToken` (address): The token address on the target network.
  - `targetAddress` (address): The recipient address on the target network.
  - `amount` (uint256): The amount of tokens involved in the swap.
- **Description:** This event provides essential information about cross-chain swaps, including the source and destination details, which helps in auditing and reconciling cross-network transactions.

## Constructor
- **Purpose:** Initializes the EIP-712 domain which is used in the contract for handling and verifying signatures according to the EIP-712 standard.
- **Implementation:**
  - Initializes the domain with the contract's `NAME` and `VERSION`.
  - This setup is critical for subsequent operations involving signature verifications.

## Admin Functions

### setSettlementManager
- **Purpose:** Sets the address of the settlement manager who will have certain administrative capabilities over fund management.
- **Parameters:**
  - `_settlementManager` (address): The address of the settlement manager.
- **Modifiers:** `onlyOwner` - Ensures only the contract owner can execute this function.
- **Flow:**
  - Validates that the `_settlementManager` address is not the zero address.
  - Assigns the `_settlementManager` address to the `settlementManager` state variable.

### setRouter
- **Purpose:** Sets the address of the FiberRouter which interacts with this contract for fund management related to swaps and transfers.
- **Parameters:**
  - `_fiberRouter` (address): The address of the FiberRouter.
- **Modifiers:** `onlyOwner` - Ensures only the contract owner can execute this function.
- **Flow:**
  - Validates that the `_fiberRouter` address is not the zero address.
  - Assigns the `_fiberRouter` address to the `fiberRouter` state variable.

### addSigner
- **Purpose:** Adds an address to the list of authorized signers who can validate transactions via signatures.
- **Parameters:**
  - `_signer` (address): The address to be added as a signer.
- **Modifiers:** `onlyOwner` - Ensures only the contract owner can execute this function.
- **Flow:**
  - Validates that the `_signer` address is not the zero address.
  - Adds `_signer` to the `signers` mapping, setting its value to `true`.

### removeSigner
- **Purpose:** Removes an address from the list of authorized signers.
- **Parameters:**
  - `_signer` (address): The address to be removed as a signer.
- **Modifiers:** `onlyOwner` - Ensures only the contract owner can execute this function.
- **Flow:**
  - Validates that the `_signer` address is not the zero address.
  - Removes `_signer` from the `signers` mapping.

## Transaction Functions

### swapToAddress
- **Purpose:** Facilitates a token swap by transferring tokens to a specified address on a target network.
- **Parameters:**
  - `token` (address): The token to be swapped.
  - `amount` (uint256): The amount of the token to be swapped.
  - `targetNetwork` (uint256): The identifier of the target network.
  - `targetAddress` (address): The address on the target network where the tokens will be sent.
- **Modifiers:** `onlyRouter` - Restricts function execution to the FiberRouter.
- **Flow:**
  - Validates all parameters including non-zero values and correct network settings.
  - Executes the swap and transfers the specified `amount` of `token` to `targetAddress`.
  - Emits a `BridgeSwap` event logging the details of the swap.

### withdrawSigned
- **Purpose:** Allows the withdrawal of tokens based on a verified signature, enhancing security and flexibility in fund management.
- **Parameters:**
  - `token` (address): The token to be withdrawn.
  - `payee` (address): The recipient of the tokens.
  - `amount` (uint256): The amount of tokens to be withdrawn.
  - `salt` (bytes32): A unique identifier for the transaction.
  - `expiry` (uint256): The timestamp when the signature expires.
  - `signature` (bytes): The signature verifying the transaction.
- **Modifiers:** `onlyRouter` - Restricts function execution to the FiberRouter.
- **Flow:**
  - Validates the signature, `salt`, and `expiry` to ensure the transaction is legitimate and timely.
  - Checks that the signer is authorized.
  - Marks the `salt` as used in the `usedSalt` mapping to prevent replay attacks.
  - Transfers the specified `amount` of `token` to `payee`.
  - Emits a `TransferBySignature` event confirming the transaction.

### withdrawSignedAndSwapRouter
- **Purpose:** Allows for a signed withdrawal combined with a swap operation, all validated through a signature.
- **Parameters:**
  - `to` (address): The recipient of the withdrawn tokens.
  - `amountIn` (uint256): The amount of the foundry token to be swapped.
  - `minAmountOut` (uint256): The minimum acceptable amount of the target token expected from the swap.
  - `foundryToken` (address): The token being withdrawn and swapped.
  - `targetToken` (address): The target token expected from the swap.
  - `router` (address): The address of the router handling the swap.
  - `routerCalldata` (bytes): The calldata to be passed to the router.
  - `salt` (bytes32): A unique identifier for the transaction to prevent replay attacks.
  - `expiry` (uint256): Timestamp at which the signature for the transaction expires.
  - `signature` (bytes): Signature to validate the transaction.
- **Modifiers:** `onlyRouter` - Ensures that only the FiberRouter can invoke this function.
- **Flow:**
  - Verifies the signature, checks that the signer is authorized, and confirms the transaction's expiry and salt have not been used before.
  - Proceeds to execute the withdrawal and the swap, adjusting the state and transferring the appropriate token amounts.
  - Emits a `TransferBySignature` event documenting the transaction.

### withdrawSignedAndSwapRouterVerify
- **Purpose:** Provides a means to verify the parameters of a withdrawal with a swap without executing it.
- **Parameters:** Same as `withdrawSignedAndSwapRouter`.
- **Returns:** `(bytes32, address)` - The digest of the verification and the address of the signer.
- **Flow:**
  - Constructs and verifies the transaction data without making any state changes or token transfers.
  - Used primarily for validation and testing purposes to ensure parameters are correct before execution.

### addLiquidity
- **Purpose:** Allows liquidity providers to deposit tokens into the fund, increasing the available liquidity.
- **Parameters:**
  - `token` (address): The token address for which liquidity is being added.
  - `amount` (uint256): The amount of tokens being added as liquidity.
- **Flow:**
  - Validates that the token is recognized as a foundry asset and that the amount is positive.
  - Updates the liquidity mapping to reflect the addition.
  - Transfers the tokens from the provider's address to the contract.
  - Emits a `BridgeLiquidityAdded` event after successfully adding liquidity.

### removeLiquidityIfPossible
- **Purpose:** Allows liquidity providers to withdraw their tokens if the conditions permit.
- **Parameters:**
  - `token` (address): The token address for which liquidity is being removed.
  - `amount` (uint256): The amount of tokens being removed.
- **Returns:** `uint256` - The actual amount of tokens removed.
- **Flow:**
  - Checks for sufficient liquidity and token availability.
  - Adjusts the liquidity mapping and transfers the appropriate amount of tokens back to the provider, if conditions are met.
  - Emits a `BridgeLiquidityRemoved` event documenting the removal.

### liquidity
- **Purpose:** Retrieves the current amount of liquidity provided for a specific token by a specific liquidity provider.
- **Parameters:**
  - `token` (address): The token for which liquidity information is requested.
  - `liquidityAdder` (address): The address of the liquidity provider.
- **Returns:** `uint256` - The current amount of liquidity available for the specified token and provider.
- **Flow:**
  - Returns the amount from the liquidity mapping without modifying any state.

# CCTPFundManager Contract Documentation

## Overview
The `CCTPFundManager` contract is integral to the Cross-Chain Transfer Protocol (CCTP) operations within the MultiSwap ecosystem. It manages the coordination and settlement of cross-chain token transfers, ensuring secure and verifiable transactions across different blockchain networks.

## Constants
- **WEEK:** `uint32 constant`
  - Represents the number of seconds in one week. This constant is used for time-related calculations, typically for determining expiries or timeouts in transactions.
- **NAME:** `string public constant`
  - Set to "FUND_MANAGER", this name is used within the EIP-712 domain for signing and verifying transactions.
- **VERSION:** `string public constant`
  - Indicates the version of the contract, set to "000.004", used also in the EIP-712 domain setup.

## State Variables
- **usdcToken:** `address public`
  - Address of the USDC token contract, representing the primary stablecoin managed by this fund manager.
- **cctpTokenMessenger:** `address public`
  - Address of the CCTP Token Messenger contract responsible for handling the actual token transfer logistics across chains.
- **fiberRouter:** `address public`
  - Address of the FiberRouter, which interfaces with this CCTP fund manager for routing transactions.
- **signers:** `mapping(address => bool) public`
  - Tracks addresses authorized to sign off on transactions, ensuring that all outgoing transfers are approved by legitimate parties.
- **usedSalt:** `mapping(bytes32 => bool) public`
  - Ensures uniqueness of transactions by tracking salts used in operations to prevent replay attacks.
- **targetNetworks:** `mapping(uint256 => TargetNetwork) public`
  - Stores information about target networks where tokens can be sent, including the network domain and associated CCTP fund manager addresses.

## Structs

### TargetNetwork
- **Purpose:** Stores configuration details for target networks in cross-chain operations.
- **Fields:**
  - `targetNetworkDomain` (`uint32`): The domain identifier of the target network, facilitating network-specific actions and routing.
  - `targetCCTPFundManager` (`address`): The CCTP fund manager address on the target network responsible for managing the received assets.

## Modifiers

### onlyRouter
- **Purpose:** Restricts certain sensitive functions to be callable only by the designated FiberRouter, ensuring controlled access to fund management operations.
- **Implementation:** Checks if the `msg.sender` is the `fiberRouter` address and reverts if not.

## Events

### TransferBySignature
- **Purpose:** Logs the details of token transfers that are executed following signature verification.
- **Parameters:**
  - `signer` (address): The address of the signer who authorized the transfer.
  - `receiver` (address): The recipient of the transferred tokens.
  - `token` (address): The specific token that was transferred.
  - `amount` (uint256): The amount of the token that was transferred.

### Modifiers

#### onlyRouter
- **Purpose:** Ensures that only the FiberRouter contract can invoke certain critical functions.
- **Implementation:** Checks if the caller (`msg.sender`) is the `fiberRouter`. If not, the transaction is reverted with an error message stating "FM: Only fiberRouter method".
- **Usage:** Applied to functions that manage token transfers, withdrawals, and other sensitive operations to maintain security and integrity.

### Functions

#### setRouter
- **Purpose:** Configures the address of the FiberRouter that interacts with this CCTPFundManager.
- **Parameters:**
  - `_fiberRouter` (address): The new address of the FiberRouter.
- **Modifiers:** `onlyOwner` - Ensures that only the contract owner can update this address.
- **Flow:**
  - Validates that the provided address is not the zero address.
  - Updates the `fiberRouter` state variable with the new address.
- **Impact:** Essential for updating the router configuration, which is critical for routing transactions correctly within the ecosystem.

#### addSigner
- **Purpose:** Adds a new address to the list of authorized signers who can approve transactions.
- **Parameters:**
  - `_signer` (address): The address to be authorized as a signer.
- **Modifiers:** `onlyOwner` - Ensures that only the contract owner can add signers.
- **Flow:**
  - Checks that the address is not the zero address to avoid invalid entries.
  - Adds the address to the `signers` mapping with a value of `true`.
- **Impact:** Increases the flexibility and security of transaction approval by allowing multiple trusted entities to authorize operations.

#### removeSigner
- **Purpose:** Removes an address from the list of authorized signers.
- **Parameters:**
  - `_signer` (address): The address to be removed from the list of signers.
- **Modifiers:** `onlyOwner` - Restricts this operation to the contract owner.
- **Flow:**
  - Ensures the address is not the zero address.
  - Removes the address from the `signers` mapping.
- **Impact:** Helps maintain the security of the contract by allowing the owner to manage signatory permissions dynamically.

#### initCCTP
- **Purpose:** Initializes the CCTP parameters for the contract, setting up the primary tokens and messengers used in cross-chain transfers.
- **Parameters:**
  - `_cctpTokenMessenger` (address): The address of the CCTP Token Messenger.
  - `_usdcToken` (address): The address of the USDC token used in transactions.
- **Modifiers:** `onlyOwner` - Ensures that only the contract owner can initialize these critical settings.
- **Flow:**
  - Validates that neither address is the zero address.
  - Sets the `cctpTokenMessenger` and `usdcToken` state variables with the provided addresses.
- **Impact:** Crucial for setting up the infrastructure required for handling CCTP transactions securely and efficiently.

#### setTargetCCTPNetwork
- **Purpose:** Configures a target network for CCTP, specifying where tokens can be sent and managed.
- **Parameters:**
  - `_chainID` (uint256): The identifier for the target network.
  - `_targetNetworkDomain` (uint32): The domain ID of the target network.
  - `_targetCCTPFundManager` (address): The CCTP Fund Manager address on the target network.
- **Flow:**
  - Validates that the network chain ID and domain are not zero, and that the CCTP Fund Manager address is not the zero address.
  - Maps the `_chainID` to a `TargetNetwork` struct containing the domain and fund manager address.
- **Impact:** Enables the CCTPFundManager to manage tokens across multiple blockchain networks, extending the reach and functionality of the MultiSwap ecosystem for cross-chain operations.

## Transaction Functions

### withdrawSigned
- **Purpose:** Allows the withdrawal of tokens based on a verifiable signature, adding an extra layer of security to fund management.
- **Parameters:**
  - `token` (address): The ERC-20 token to be withdrawn.
  - `payee` (address): The recipient of the tokens.
  - `amount` (uint256): The amount of tokens to be withdrawn.
  - `salt` (bytes32): A unique identifier for the transaction to prevent replay attacks.
  - `expiry` (uint256): The timestamp after which the signature is considered expired.
  - `signature` (bytes): The cryptographic signature validating the transaction.
- **Modifiers:** `onlyRouter` - Ensures that only the designated router can initiate the withdrawal.
- **Flow:**
  - Verifies that the parameters, such as the token, payee, and amounts, are not zero or invalid.
  - Checks the signature's validity and expiry against the current block timestamp and ensures the salt has not been used before.
  - Marks the salt as used in the `usedSalt` mapping to prevent future replays of the transaction.
  - Transfers the specified amount of the token to the payee.
  - Emits a `TransferBySignature` event detailing the transaction.
- **Returns:** The actual amount of tokens transferred.

### withdrawSignedVerify
- **Purpose:** Provides a method for externally verifying the parameters of a `withdrawSigned` request without executing the transaction.
- **Parameters:**
  - `token` (address): The token address involved in the withdrawal.
  - `payee` (address): Intended recipient of the withdrawal.
  - `amount` (uint256): The amount of tokens to be withdrawn.
  - `salt` (bytes32): Unique identifier for the transaction.
  - `expiry` (uint256): The expiry time of the signature.
  - `signature` (bytes calldata): The signature to verify.
- **Flow:**
  - Constructs the EIP-712 typed data hash using the specified parameters and the `WITHDRAW_SIGNED_METHOD` identifier.
  - Calls the `signer` function to recover the signer's address from the signature and message hash.
  - Verifies that the signer is an authorized signer.
  - Returns the message hash and the signer's address to confirm the transaction can be executed with these parameters.
- **Returns:** A tuple containing the digest of the transaction data and the address of the signer, allowing for pre-validation of the withdrawal request.

### withdrawSignedAndSwapRouterVerify
- **Purpose:** Verifies the parameters of a withdrawal coupled with a swap without executing the transaction.
- **Parameters:**
  - `to` (address): The address where the tokens should be sent.
  - `amountIn` (uint256): The amount of tokens to be withdrawn.
  - `minAmountOut` (uint256): The minimum expected amount after the swap.
  - `foundryToken` (address): The token being withdrawn.
  - `targetToken` (address): The intended token to receive after the swap.
  - `router` (address): The router address used for the swap.
  - `routerCallData` (bytes): Additional data required by the router to perform the swap.
  - `salt` (bytes32): A unique identifier to prevent replay attacks.
  - `expiry` (uint256): The expiry date of the signature.
  - `signature` (bytes calldata): The signature verifying the transaction.
- **Flow:**
  - Computes the hash of the provided parameters using the specific method identifier for withdrawals with swaps.
  - Uses the signature to determine the signer address, ensuring it is authorized and the signature is valid within the given timeframe.
  - Verifies that the transaction parameters are correct without modifying the state or moving any funds.
- **Returns:** 
  - `bytes32`: The transaction hash.
  - `address`: The address of the signer.
- **Use Case:** This function is particularly useful for front-end applications that need to display transaction details or confirm their validity before execution.

### swapCCTP
- **Purpose:** Executes a cross-chain token transfer under the Cross-Chain Transfer Protocol (CCTP).
- **Parameters:**
  - `amountIn` (uint256): The amount of tokens to transfer.
  - `token` (address): The token address, typically USDC in this contract's configuration.
  - `targetNetwork` (uint256): The target network identifier where the tokens are to be transferred.
- **Modifiers:** `onlyRouter` - Ensures that only the designated FiberRouter can initiate this function.
- **Flow:**
  - Checks the token is the specified USDC token.
  - Retrieves the target network's configuration, ensuring it exists and the CCTP fund manager address is valid.
  - Approves the CCTP token messenger to handle the specified amount of tokens.
  - Initiates the transfer using the CCTP token messenger's `depositForBurn` function, specifying the destination network, recipient, and token details.
  - Returns a deposit nonce generated by the CCTP messenger which acts as a unique identifier for the transaction.
- **Impact:** 
  - Facilitates secure, traceable cross-chain token transfers, expanding the utility and operational scope of the MultiSwap ecosystem across different blockchains.

# LiquidityManagerRole Contract Documentation

## Overview
The `LiquidityManagerRole` contract is a fundamental component of the MultiSwap ecosystem, designed to handle liquidity management with designated roles. It provides mechanisms to add or remove liquidity under strict role-based permissions, ensuring secure and efficient management of fund liquidity.

## Import Dependencies
- **WithAdmin:** Inherits from WithAdmin to utilize administrative role checking.
- **TokenReceivable:** Inherits functionalities to receive and handle tokens.
- **SafeAmount:** Utilizes SafeAmount to safely handle token amounts during transfers.

## State Variables
- **liquidityManager:** `address public`
  - The primary liquidity manager's address, authorized to manage liquidity operations.
- **liquidityManagerBot:** `address public`
  - A secondary, automated liquidity manager's address, usually a bot, also authorized for liquidity operations.
- **withdrawalAddress:** `address public`
  - Address where liquidity is withdrawn, typically set to a secure wallet controlled by the organization.

## Events
- **LiquidityAddedByManager**
  - Logs the addition of liquidity by the manager.
  - `token` (address): The address of the token for which liquidity was added.
  - `amount` (uint256): The amount of liquidity added.
- **LiquidityRemovedByManager**
  - Logs the removal of liquidity by the manager.
  - `token` (address): The address of the token from which liquidity was removed.
  - `amount` (uint256): The amount of liquidity removed.
  - `withdrawalAddress` (address): The address to which the liquidity was withdrawn.

## Modifiers
- **onlyLiquidityManager**
  - Restricts function execution to the designated liquidity managers (`liquidityManager` or `liquidityManagerBot`).
  - Validates that the caller is either the primary or secondary designated liquidity manager before proceeding with the function execution.

## Functions

### setLiquidityManagers
- **Purpose:** Sets the addresses of the primary and secondary liquidity managers.
- **Parameters:**
  - `_liquidityManager` (address): The primary liquidity manager.
  - `_liquidityManagerBot` (address): The secondary or automated liquidity manager.
- **Access Control:** `onlyOwner` - Only the contract owner can set these addresses.
- **Implementation Details:**
  - Validates that neither address is the zero address to prevent invalid configurations.
  - Updates the `liquidityManager` and `liquidityManagerBot` addresses.

### setWithdrawalAddress
- **Purpose:** Sets the address used for withdrawing liquidity.
- **Parameters:**
  - `_withdrawalAddress` (address): The address where liquidity should be withdrawn.
- **Access Control:** `onlyOwner`
- **Implementation Details:**
  - Sets the `withdrawalAddress` to the specified address.

### addLiquidityByManager
- **Purpose:** Allows the liquidity manager to add liquidity for a specific token.
- **Parameters:**
  - `token` (address): The token address for which liquidity is being added.
  - `amount` (uint256): The amount of the token to add as liquidity.
- **Access Control:** `onlyLiquidityManager`
- **Implementation Details:**
  - Validates the token address and the amount (must be greater than zero).
  - Transfers the specified amount of tokens from the caller to the contract.
  - Emits a `LiquidityAddedByManager` event.

### removeLiquidityByManager
- **Purpose:** Allows the liquidity manager to remove liquidity for a specific token.
- **Parameters:**
  - `token` (address): The token address from which liquidity is being removed.
  - `amount` (uint256): The amount of the token to remove as liquidity.
- **Returns:** `uint256` - The actual amount of tokens removed as liquidity.
- **Access Control:** `onlyLiquidityManager`
- **Implementation Details:**
  - Validates that there are sufficient tokens available for withdrawal.
  - Transfers the specified amount of tokens from the contract to the `withdrawalAddress`.
  - Emits a `LiquidityRemovedByManager` event documenting the removal.

# MultiswapForge Contract Documentation

## Overview
The `MultiswapForge` contract extends the `FiberRouter`, incorporating specific enhancements to cater to gas estimation processes and manage transaction simulations. It is designed primarily for development and testing scenarios where gas cost estimations are critical for transaction optimization and system reliability.

## Import Dependencies
- Inherits from `FiberRouter`, utilizing its comprehensive routing capabilities for token swaps and fund management.

## State Variables
- **gasEstimationAddress** (`address public`): Holds the address authorized to execute and simulate gas estimations, ensuring that only designated entities can perform these sensitive operations.

## Constructor
- **Parameters**:
  - `interchainTokenService` (`address`): Initializes the base `FiberRouter` with a service address that handles interchain token functionalities.
- **Description**:
  - Sets up the contract by linking it with necessary interchain services, preparing it for its specialized roles within the network's ecosystem.

## Functions

### setGasEstimationAddress
- **Purpose**: Sets the address authorized to perform gas estimations. This is essential to control and secure the execution of potentially costly gas estimations to a trusted entity.
- **Parameter**:
  - `_gasEstimationAddress` (`address`): The wallet address designated for gas estimation tasks.
- **Visibility**: `external`
- **Access Control**: `onlyOwner`
  - Ensures that only the contract owner can change the address, maintaining strict control over gas estimation privileges.

### withdrawSigned
- **Purpose**: Overrides the `withdrawSigned` method from `FiberRouter` to explicitly disallow its functionality within this contract context, ensuring that no unexpected withdrawals are processed.
- **Visibility**: `public`
- **Modifiers**: `override`
- **Behavior**:
  - Reverts any transaction attempts, indicating that this operation is intentionally unsupported in this contract variant.

### withdrawSignedForGasEstimation
- **Purpose**: Facilitates the simulation of `withdrawSigned` operations specifically for gas estimation purposes without performing actual asset transfers.
- **Parameters**: Mirrors `withdrawSigned` from `FiberRouter` but used only under authorized gas estimation scenarios.
- **Visibility**: `external`
- **Behavior**:
  - Executes the `withdrawSigned` method securely, ensuring it can only be called by the authorized gas estimation address, effectively simulating the function for testing purposes without real asset movement.

### withdrawSignedAndSwapRouter
- **Purpose**: Similarly to `withdrawSigned`, this function overrides the corresponding method in `FiberRouter` to disallow its operation, preventing any unintended swaps that could occur during routing processes.
- **Visibility**: `public`
- **Modifiers**: `override`, `payable`
- **Behavior**:
  - Instantly reverts any calls to this function, maintaining the contract's integrity by preventing unsupported operations.

### withdrawSignedAndSwapRouterForGasEstimation
- **Purpose**: Tests the `withdrawSignedAndSwapRouter` functionality under controlled conditions, allowing for gas cost estimations and operational verifications without executing real token swaps.
- **Visibility**: `external`
- **Behavior**:
  - Calls the original `withdrawSignedAndSwapRouter` function for testing purposes, restricted solely to the authorized gas estimation address to ensure no actual transactions are processed.

This documentation encapsulates the functionalities and restrictions of the `MultiswapForge` contract, highlighting its specific use cases in gas estimation and testing scenarios within a controlled development environment.


# ForgeFundManager Contract Documentation

## Overview
The `ForgeFundManager` contract extends the `FundManager` to include specific functionalities tailored for simulating wihtdrawal functions of fund manager to estimate the gas fee for withdrawals. 

## Import Dependencies
- **FundManager:** Inherits from the `FundManager` contract to utilize its fund management functionalities.

## Constructor
- **Description**: Initializes the `ForgeFundManager` by setting a predefined test signer address.
- **Test Signer Address**: `0xb1Ea8634f56E17DCD2D5b66214507B7f493E12aD`
  - This address is used as the signer for transactions in a testing and development setup to facilitate easy simulation and testing of fund management activities.

## Functions

### addSigner
- **Inherited From**: `FundManager`
- **Purpose**: Adds a new signer to the fund management system.
- **Parameters**:
  - `_signer` (`address`): Address of the new signer to be added.
- **Visibility**: `internal`
- **Description**: Provides the functionality to expand the list of authorized signers for fund management, using an internal method to ensure security and integrity.

## Notes
- **PrivateKey Reference for Developers**:
  - For development purposes, the private key associated with the test signer is `fc4a1eb6778756a953b188220062d33e3eaabd85099bef1a61da1053ae3d0c63`. It is crucial that this key is used responsibly and only within secure, controlled environments to prevent unauthorized access and ensure the safety of funds.

# ForgeCCTPFundManager Contract Documentation

## Overview
The `ForgeCCTPFundManager` contract is a specialized extension of the `CCTPFundManager` designed for simulating the withdrawals to get the gas estimation, specifically geared towards testing and development scenarios involving CCTP (Cross-Chain Trading Protocol) fund management.

## Import Dependencies
- **CCTPFundManager:** Inherits from `CCTPFundManager` to leverage cross-chain fund management functionalities.

## Constructor
- **Description**: Initializes the `ForgeCCTPFundManager` by setting a predefined test signer address.
- **Test Signer Address**: `0xb1Ea8634f56E17DCD2D5b66214507B7f493E12aD`
  - This address is strategically used as the signer in test environments, facilitating the simulation and verification of CCTP-related transactions.

## Functions

### addSigner
- **Inherited From**: `CCTPFundManager`
- **Purpose**: Adds a new signer to the CCTP fund management system.
- **Parameters**:
  - `_signer` (`address`): Address of the new signer to be added.
- **Visibility**: `internal`
- **Description**: Expands the list of authorized signers for managing CCTP funds, ensuring that only approved entities can perform sensitive fund operations.

## Notes
- **PrivateKey Reference for Developers**:
  - The private key for the test signer used in development is `fc4a1eb6778756a953b188220062d33e3eaabd85099bef1a61da1053ae3d0c63`. It is essential that this key is used strictly within test and development environments to prevent any security breaches or unauthorized access to fund management functions.

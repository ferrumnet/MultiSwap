# MultiSwap Documentation
#### MultiSwap contracts are structured into two main categories:

### MultiSwap Contracts:
**FiberRouter**
- Facilitates the execution of token swaps and interacts with various DEX aggregators, such as 1inch, Uniswap, and SushiSwap.
**Fundmanager**
- Manages the funds and provides functionalities related to fund allocations and balances.
### Forge/Gas Estimation Contracts:
**MultiSwapForge**
- Inherits from fiberRouter and is primarily responsible for executing token swaps. It serves as a core component for initiating swap transactions.
**ForgeFundManager**
- Inherits from fundmanager and is utilized for simulating withdrawal transactions to estimate gas fees associated with the withdrawal functions. It aids in predicting gas costs for withdrawal operations

# FiberRouter Contract Documentation

## Overview
`FiberRouter.sol` is a key component of the MultiSwap project designed for handling token swaps both within a single network and across different networks using the Cross-Chain Transfer Protocol (CCTP). This contract facilitates efficient token swapping mechanisms, manages gas fee payments, and ensures secure transaction processing through a router whitelist system.

## Inherits
- Inherits `Ownable`: Ensures that administrative functions are protected and can only be accessed by the contract owner.
- Inherits `TokenReceivable`: Enhances the contract's ability to interact with and process multiple token types securely.
- Inherits `FeeDistributor`: Allows the contract to manage and distribute transaction fees effectively.

## Using Libraries
- **SafeERC20 for IERC20**
  - This contract uses the `SafeERC20` library which provides safety checks when interacting with ERC20 tokens. These checks prevent common mistakes like failing to handle return values in token transfer operations, thereby reducing the risk of tokens getting lost or locked.

## State Variables

### Public Variables
- **weth:** `address public`
  - Address of the Wrapped Ethereum (WETH) token contract. This is used for operations that require Ethereum in an ERC20 format.
- **fundManager:** `address public`
  - Address of the Fund Manager contract that manages and orchestrates the handling of funds within various operations.
- **cctpFundManager:** `address public`
  - Address of the Cross-Chain Transfer Protocol (CCTP) Fund Manager. This contract handles the management of cross-chain transfers.
- **gasWallet:** `address payable public`
  - The wallet address designated for receiving and managing Ethereum used to pay for transaction gas costs.

### Private Variables
- **routerAllowList:** `mapping(bytes32 => bool) private`
  - A mapping that stores whether a specific router and selector combination is allowed (whitelisted) to perform operations like swaps. It is used to enhance security by ensuring only authorized routers can execute certain functions.

### Public Mappings
- **targetNetworks:** `mapping(uint256 => TargetNetwork) public`
  - A mapping from network identifiers (chain IDs) to `TargetNetwork` structs. This helps manage and configure operations that involve cross-network interactions, storing necessary details about each supported network.

## Structs

### SwapCrossData
- **Purpose:** Holds essential data required for executing swaps across different blockchain networks.
- **Fields:**
  - `targetNetwork` (`uint256`): The network identifier (chain ID) where the swap will target.
  - `targetToken` (`address`): The token address on the target network that the swap aims to acquire or interact with.
  - `targetAddress` (`address`): The address on the target network to which the swapped tokens will be sent or which will interact with the tokens.

### TargetNetwork
- **Purpose:** Stores configuration details for different blockchain networks involved in cross-network operations.
- **Fields:**
  - `targetNetworkDomain` (`uint32`): A domain or unique identifier for the target network that simplifies interactions and configurations.
  - `targetFundManager` (`address`): The address of the fund manager on the target network responsible for managing the cross-network swaps or transactions.

## Events

### Swap
- **Purpose:** Logs details of a cross-chain token swap, including the amounts and addresses involved.
- **Parameters:**
  - `sourceToken` (address): The token being swapped from.
  - `targetToken` (address): The token being swapped to.
  - `sourceChainId` (uint256): The blockchain ID of the source token.
  - `targetChainId` (uint256): The blockchain ID of the target token.
  - `sourceAmount` (uint256): The amount of the source token being swapped.
  - `sourceAddress` (address): The address providing the source token.
  - `targetAddress` (address): The address receiving the target token.
  - `settledAmount` (uint256): The amount of the target token received.
  - `withdrawalData` (bytes32): Additional data related to the withdrawal process.
  - `gasAmount` (uint256): The amount of gas used for processing the swap.
  - `depositNonce` (uint256): A nonce to ensure the uniqueness of the deposit transaction.

### SwapSameNetwork
- **Purpose:** Logs information about a token swap that occurs within the same blockchain network.
- **Parameters:**
  - `sourceToken` (address): The token being exchanged.
  - `targetToken` (address): The token received after the swap.
  - `sourceAmount` (uint256): The amount of the source token being swapped.
  - `settledAmount` (uint256): The amount of the target token received.
  - `sourceAddress` (address): The address from which the source token is sent.
  - `targetAddress` (address): The address receiving the target token.

### Withdraw
- **Purpose:** Records the details of a token withdrawal operation.
- **Parameters:**
  - `token` (address): The token being withdrawn.
  - `receiver` (address): The recipient of the withdrawn tokens.
  - `amount` (uint256): The amount of tokens withdrawn.
  - `salt` (bytes32): A unique identifier to prevent replay attacks.
  - `signature` (bytes): The cryptographic signature verifying the transaction.

### WithdrawRouter
- **Purpose:** Logs the execution of a combined withdrawal and swap operation through a specified router.
- **Parameters:**
  - `to` (address): The address where the tokens are sent post-swap.
  - `amountIn` (uint256): The amount of tokens before the swap.
  - `amountOut` (uint256): The amount of tokens after the swap.
  - `foundryToken` (address): The initial token involved in the swap.
  - `targetToken` (address): The final token received after the swap.
  - `router` (address): The router used for the swap.
  - `routerCalldata` (bytes): The specific calldata required by the router for the swap.
  - `salt` (bytes32): A unique identifier for the transaction.
  - `multiSignature` (bytes): The multiple signatures required to authorize the transaction.

### RouterAndSelectorWhitelisted
- **Purpose:** Indicates that a router and a specific function selector have been added to the whitelist, allowing them to be used for swaps.
- **Parameters:**
  - `router` (address): The address of the router.
  - `selector` (bytes4): The function selector that is whitelisted for use with the router.

### RouterAndSelectorRemoved
- **Purpose:** Indicates that a router and a specific function selector have been removed from the whitelist, disallowing their future use for swaps.
- **Parameters:**
  - `router` (address): The address of the router.
  - `selector` (bytes4): The function selector that is removed from the whitelist.

## Functions

### Admin Functions

#### setWeth
- **Purpose:** Configures the address of the Wrapped Ethereum (WETH) contract to be used in swaps involving Ethereum.
- **Visibility:** External
- **Modifiers:** `onlyOwner`
- **Parameters:**
  - `_weth` (address): The new WETH contract address.
- **Flow:** The function checks that the `_weth` address is not the zero address and then sets the `weth` state variable.
- **Effects:** Modifies the `weth` state variable.

#### setFundManager
- **Purpose:** Sets the address of the fund manager that will execute token swaps and manage funds.
- **Visibility:** External
- **Modifiers:** `onlyOwner`
- **Parameters:**
  - `_fundManager` (address): Address of the new fund manager contract.
- **Flow:** Validates that the `_fundManager` is not the zero address and updates the `fundManager` state variable.
- **Effects:** Updates the `fundManager` variable.

#### setCCTPFundManager
- **Purpose:** Updates the address of the CCTP Fund Manager to handle cross-chain swaps.
- **Visibility:** External
- **Modifiers:** `onlyOwner`
- **Parameters:**
  - `_cctpFundManager` (address): The CCTP fund manager's new address.
- **Flow:** Ensures the `_cctpFundManager` is not null before updating the corresponding state variable.
- **Effects:** Modifies the `cctpFundManager` variable.

#### setGasWallet
- **Purpose:** Designates a specific wallet address for handling gas payments during transactions.
- **Visibility:** External
- **Modifiers:** `onlyOwner`
- **Parameters:**
  - `_gasWallet` (address payable): The address of the wallet to handle gas fees.
- **Flow:** Checks that `_gasWallet` is not the zero address and updates the `gasWallet` variable.
- **Effects:** Changes the `gasWallet` state variable.

### Router Management Functions

#### addRouterAndSelectors
- **Purpose:** Adds a router and its associated function selectors to the whitelist, enabling it to initiate token swaps.
- **Visibility:** External
- **Modifiers:** `onlyOwner`
- **Parameters:**
  - `router` (address): The router's address to whitelist.
  - `selectors` (bytes4[]): An array of function selectors associated with the router.
- **Flow:** Iterates through each selector, adding each combination of router and selector to the `routerAllowList` mapping.
- **Effects:** Modifies the `routerAllowList` by setting true for each router-selector pair.

#### removeRouterAndSelector
- **Purpose:** Removes a specific router and selector combination from the whitelist, disallowing it from initiating future swaps.
- **Visibility:** External
- **Modifiers:** `onlyOwner`
- **Parameters:**
  - `router` (address): The router's address.
  - `selector` (bytes calldata): The function selector to be removed from the whitelist.
- **Flow:** Accesses the `routerAllowList` mapping and sets the value of the key derived from the router and selector to false, effectively removing it from the whitelist.
- **Effects:** Modifies the `routerAllowList` mapping by setting the corresponding entry to false.

### Swap Functions

#### swapOnSameNetwork
- **Purpose:** Conducts a token swap on the same network using a specified router, ensuring that the amount received is not less than a predetermined minimum to handle potential slippage.
- **Visibility:** External
- **Modifiers:** `nonReentrant`
- **Parameters:**
  - `amountIn` (uint256): The amount of the input token to swap.
  - `minAmountOut` (uint256): The minimum amount of the output token that must be received for the swap to be considered valid.
  - `fromToken` (address): The token being swapped.
  - `toToken` (address): The token to be received after the swap.
  - `targetAddress` (address): The address where the output tokens should be sent.
  - `router` (address): The router to perform the swap.
  - `routerCalldata` (bytes memory): The router-specific data needed to perform the swap.
- **Flow:** Validates the input parameters, executes the swap through the specified router, checks for slippage against `minAmountOut`, and then transfers the swapped tokens to the `targetAddress`.
- **Effects:** Conducts the swap and adjusts token balances accordingly.

#### swapOnSameNetworkETH
- **Purpose:** Specifically handles swaps involving Ethereum, converting it to another token using a specified router within the same network.
- **Visibility:** External, Payable
- **Modifiers:** `nonReentrant`
- **Parameters:**
  - `minAmountOut` (uint256): Minimum amount of the output token expected after the swap.
  - `toToken` (address): The token to be received post-swap.
  - `targetAddress` (address): The address to receive the swapped tokens.
  - `router` (address): The router performing the swap.
  - `routerCalldata` (bytes memory): Additional data needed by the router to execute the swap.
- **Flow:** Converts sent ETH to WETH, performs the swap via the specified router, ensures the output meets the `minAmountOut`, and sends the output tokens to `targetAddress`.
- **Effects:** Swaps ETH to another token, modifies WETH and the output token's balances.

#### swapSigned
- **Purpose:** Facilitates a signed token swap, optionally involving cross-chain operations based on the CCTP.
- **Visibility:** External, Payable
- **Modifiers:** `nonReentrant`
- **Parameters:**
  - `token` (address): Token to be swapped.
  - `amount` (uint256): Amount of the token to be swapped.
  - `sd` (SwapCrossData memory): Struct containing information about the target network and token details.
  - `withdrawalData` (bytes32): Additional data required for processing withdrawals if needed.
  - `cctpType` (bool): Indicates if the swap is a CCTP operation.
  - `fd` (FeeDistributionData memory): Data structure containing fee distribution information.
- **Flow:** Validates all input data, checks token balances, initiates the transfer of the specified amount, handles fee distributions, and if `cctpType` is true, performs a CCTP swap; otherwise, conducts a regular swap.
- **Effects:** Initiates a token swap with or without cross-chain capabilities depending on `cctpType`.

#### swapSignedAndCrossRouter
- **Purpose:** Performs a signed token swap on the same network followed by initiating a setup for a potential cross-chain swap using the CCTP if specified.
- **Visibility:** External, Payable
- **Modifiers:** `nonReentrant`
- **Parameters:**
  - `amountIn` (uint256): Amount of the input token.
  - `minAmountOut` (uint256): Minimum expected output after the swap, considering potential slippage.
  - `fromToken` (address): Token to be swapped from.
  - `foundryToken` (address): Intermediate or final token to be received after the swap.
  - `router` (address): Router to be used for the swap.
  - `routerCalldata` (bytes memory): Specific call data needed for the router.
  - `sd` (SwapCrossData memory): Contains data about the target network and token.
  - `withdrawalData` (bytes32): Data related to the withdrawal process.
  - `cctpType` (bool): Flag indicating whether the operation should initiate a CCTP swap.
  - `fd` (FeeDistributionData memory): Details regarding fee distribution for the transaction.
- **Flow:** Validates the provided parameters for correctness, performs a local swap, adjusts for fees, and sets up cross-chain data if `cctpType` is true.
- **Effects:** Executes a swap and potentially sets up a cross-chain transfer, modifying the state of involved tokens and fees.

#### swapSignedAndCrossRouterETH
- **Purpose:** Facilitates a token swap starting with Ethereum as the input currency, followed by a potential cross-chain transfer setup.
- **Visibility:** External, Payable
- **Modifiers:** `nonReentrant`
- **Parameters:**
  - `minAmountOut` (uint256): Minimum amount of tokens expected from the swap to manage slippage.
  - `foundryToken` (address): The target token after the swap.
  - `gasFee` (uint256): Amount of Ether designated for the transaction fees.
  - `router` (address): Router used for the swap.
  - `routerCalldata` (bytes memory): Calldata necessary for the router operation.
  - `sd` (SwapCrossData memory): Details about the target network and token for cross-chain swaps.
  - `withdrawalData` (bytes32): Data necessary for withdrawal operations.
  - `cctpType` (bool): Indicates whether the swap includes a cross-chain transfer.
  - `fd` (FeeDistributionData memory): Information on how fees should be distributed in the transaction.
- **Flow:** Checks parameters, handles Ethereum conversion to WETH, executes the swap, processes fees, and prepares for a cross-chain operation if applicable.
- **Effects:** Changes the state by performing a swap and optionally setting up for cross-chain transfers.

### Withdrawal Functions

#### withdrawSigned
- **Purpose:** Executes a signed withdrawal of tokens to a specified payee, ensuring all parameters match those signed off by authorized parties.
- **Visibility:** Public, Virtual
- **Modifiers:** `nonReentrant`
- **Parameters:**
  - `token` (address): Token to be withdrawn.
  - `payee` (address): Recipient of the withdrawn tokens.
  - `amount` (uint256): Amount of tokens to be withdrawn.
  - `salt` (bytes32): A unique identifier used to prevent replay attacks.
  - `expiry` (uint256): Timestamp after which the withdrawal is no longer valid.
  - `multiSignature` (bytes memory): Signatures from authorized entities validating the withdrawal.
  - `cctpType` (bool): Indicates whether the withdrawal involves cross-chain logic.
- **Flow:** Validates the withdrawal data against the multi-signatures, checks expiry, and transfers the specified amount to the payee if all conditions are met.
- **Effects:** Reduces the token balance of the contract and increases that of the payee if the transaction is validated successfully.

#### withdrawSignedAndSwapRouter
- **Purpose:** Executes a signed withdrawal combined with a swap operation through a specified router, allowing for complex transaction patterns including cross-chain transfers if required.
- **Visibility:** Public, Virtual
- **Modifiers:** `nonReentrant`
- **Parameters:**
  - `to` (address payable): Address to which the swapped tokens should be sent.
  - `amountIn` (uint256): Amount of the input token for the swap.
  - `minAmountOut` (uint256): Minimum expected output token amount post-swap.
  - `foundryToken` (address): Token used in the withdrawal and initial part of the swap.
  - `targetToken` (address): Token to be received after the swap.
  - `router` (address): Router to conduct the swap.
  - `routerCalldata` (bytes memory): Router-specific call data.
  - `salt` (bytes32): Unique identifier to ensure uniqueness of the transaction.
  - `expiry` (uint256): Expiry timestamp to validate the transaction timing.
  - `multiSignature` (bytes memory): Combined signatures from authorized parties.
  - `cctpType` (bool): Indicator if the transaction involves cross-chain elements.
- **Flow:** The function first checks the validity of the signatures and the transaction expiry. If valid, it executes the withdrawal, followed by a swap via the specified router, ensuring the output meets or exceeds the `minAmountOut`.
- **Effects:** Modifies the state by transferring the `foundryToken` and receiving the `targetToken` at the `to` address.

### Internal Helper Functions

#### _swapAndCheckSlippage
- **Purpose:** Conducts a token swap and checks that the output meets or exceeds a specified minimum amount to protect against slippage.
- **Visibility:** Internal
- **Parameters:**
  - `targetAddress` (address): The address where the output tokens should be sent.
  - `fromToken` (address): The token being swapped out.
  - `toToken` (address): The token being received from the swap.
  - `amountIn` (uint256): The amount of `fromToken` being swapped.
  - `minAmountOut` (uint256): The minimum amount of `toToken` expected from the swap.
  - `router` (address): The router conducting the swap.
  - `data` (bytes memory): The router-specific calldata necessary for executing the swap.
- **Flow:** Checks if the router is whitelisted and that the transaction parameters meet the specified conditions. Approves the router to handle the specified `fromToken`, executes the swap, and verifies that the returned amount of `toToken` meets or exceeds the `minAmountOut`.
- **Effects:** Transfers the `fromToken` from the contract to the router and credits the `toToken` to the `targetAddress`, ensuring slippage conditions are met.

#### isAllowListed
- **Purpose:** Verifies if a router and its associated function selector are on the whitelist, permitting it to initiate transactions.
- **Visibility:** Public
- **Modifiers:** None (view function)
- **Parameters:**
  - `router` (address): The address of the router.
  - `selector` (bytes memory): The function selector associated with the router.
- **Returns:** `bool` - Returns true if the router and selector combination is whitelisted, false otherwise.
- **Flow:** Utilizes the `_getKey` function to generate a unique key for the router and selector combination and checks this against the `routerAllowList` mapping.
- **Effects:** Purely a read operation; does not modify state.

#### _makeRouterCall
- **Purpose:** Executes a call to a router using provided calldata, handling all interactions necessary for the swap operation.
- **Visibility:** Private
- **Parameters:**
  - `router` (address): The address of the router to which the call is made.
  - `data` (bytes memory): The calldata to be passed to the router for the swap.
- **Flow:** Makes a low-level `call` to the specified router with the provided `data`. If the call fails, it checks if there is return data to provide a specific error message; if no return data is present, a generic "Call to router failed" error is thrown.
- **Effects:** Directly interacts with external routers, potentially modifying state based on the swap details encoded in the `data`.

#### _getBalance
- **Purpose:** Retrieves the balance of a specified token for a given account. If querying the native currency, it returns the account's Ether balance.
- **Visibility:** Private
- **Modifiers:** None (view function)
- **Parameters:**
  - `token` (address): The token address, or the special `NATIVE_CURRENCY` address for Ether.
  - `account` (address): The account whose balance is being queried.
- **Returns:** `uint256` - The balance of the token or Ether for the specified account.
- **Flow:** Checks if the token address matches `NATIVE_CURRENCY` to differentiate between a token balance query and an Ether balance query, using appropriate method calls.
- **Effects:** Purely a read operation; does not modify state.

#### _approveAggregatorRouter
- **Purpose:** Approves a specified amount of a token for a router to handle, setting up for transactions such as swaps.
- **Visibility:** Private
- **Parameters:**
  - `token` (address): The token for which approval is being granted.
  - `router` (address): The router that is being authorized to use the tokens.
  - `amount` (uint256): The amount of tokens the router is allowed to use.
- **Flow:** Checks if there is an existing token allowance for the router and resets it to zero if necessary before setting it to the new specified amount using `safeApprove` from the ERC20 token standard.
- **Effects:** Modifies the state by updating the allowance for the router.

#### _getKey
- **Purpose:** Generates a unique key for a router and data combination used in the `routerAllowList` to manage whitelisted routers and their selectors.
- **Visibility:** Private
- **Modifiers:** None (pure function)
- **Parameters:**
  - `router` (address): The router's address.
  - `data` (bytes memory): The data typically containing the function selector.
- **Returns:** `bytes32` - A unique key generated based on the router address and the first four bytes (function selector) of the provided data.
- **Flow:** Uses inline assembly to efficiently combine the router address and the function selector into a single `bytes32` key, ensuring uniqueness and consistency for whitelist checks.
- **Effects:** Purely a computation operation; does not interact with state or external contracts.


# MultiSwap Documentation
## MultiSwap contracts are structured into two main categories:

## MultiSwap Contracts:
### FiberRouter
- Facilitates the execution of token swaps and interacts with various DEX aggregators, such as 1inch, Uniswap, and SushiSwap.

### FeeDistributor
- `FeeDistributor` is designed to handle the distribution of transaction fees collected from various operations within the MultiSwap ecosystem. This contract ensures that fees are allocated and disbursed accurately to various stakeholders according to predefined rules.

### Fundmanager
- Manages the funds and provides functionalities related to fund allocations and balances.

### CCTPFundmanager
- Manages the funds received from CCTP and provides functionalities related to fund allocations and balances for CCTP Swaps.

### LiquidityManagerRole**
- The `LiquidityManagerRole` contract is a fundamental component of the MultiSwap ecosystem, designed to handle liquidity management with designated roles. It provides mechanisms to add or remove liquidity under strict role-based permissions, ensuring secure and efficient management of fund liquidity.

## Forge/Gas Estimation Contracts:
### MultiSwapForge
- Inherits from `fiberRouter` and is primarily responsible for executing token swaps. It serves as a core component for initiating swap transactions.

### ForgeFundManager
- Inherits from `fundmanager` and is utilized for simulating withdrawal transactions to estimate gas fees associated with the withdrawal functions. It aids in predicting gas costs for withdrawal operations

### ForgeCCTPFundManager
- Inherits from `CCTPFundManager` and is utilized for simulating withdrawal transactions to estimate gas fees associated with the withdrawal functions. It aids in predicting gas costs for withdrawal operations

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

# MultiSwapForge Contract Documentation

## Overview
The `MultiSwapForge` contract enhances the `FiberRouter` functionalities, focusing on gas estimation and simulation for withdrawal processes. This contract serves as a vital tool for managing and simulating gas estimations in a controlled manner.

## State Variables
- **gasEstimationAddress** (`address public`): An address authorized to perform gas estimations. This address can execute simulations to ensure the accuracy of gas cost estimations for transactions.

## Functions

### Constructor
Initializes the `FiberRouter`.

### setGasEstimationAddress
- **Parameters**:
  - `_gasEstimationAddress` (`address`): The address authorized to perform gas estimations. It should not be the zero address to ensure valid functionality.
- **Visibility**: `external`
- **Modifiers**: `onlyOwner`
- **Description**: Sets the gas estimation address to a specified address. Ensures that the address is not the zero address.

### withdrawSigned
- **Parameters**:
  - `token` (`address`): Address of the token involved in the withdrawal.
  - `payee` (`address`): Address receiving the token.
  - `amount` (`uint256`): Amount of token to be withdrawn.
  - `salt` (`bytes32`): Random nonce to ensure transaction uniqueness.
  - `expiry` (`uint256`): Timestamp after which the transaction is not valid.
  - `multiSignature` (`bytes`): Signature proving that the transaction was approved.
  - `cctpType` (`bool`): Boolean flag for transaction type.
- **Visibility**: `public`
- **Modifiers**: `override`
- **Description**: Overrides the original `withdrawSigned` from `FiberRouter` to revert any transactions, indicating that this operation is not supported in this contract.

### withdrawSignedForGasEstimation
- **Parameters**:
  - Uses the same parameters as `withdrawSigned`.
- **Visibility**: `external`
- **Description**: Performs a simulation of the `withdrawSigned` function specifically for gas estimation purposes. Requires that the caller is the authorized gas estimation address.

### withdrawSignedAndSwapRouter
- **Parameters**:
  - `to` (`address payable`): Recipient address of the swapped token.
  - `amountIn` (`uint256`): Amount of the input token.
  - `minAmountOut` (`uint256`): Minimum amount of the output token expected from the swap.
  - `foundryToken` (`address`): Input token address.
  - `targetToken` (`address`): Output token address.
  - `router` (`address`): Address of the token swap router.
  - `routerCallData` (`bytes`): Encoded data required for the router to perform the swap.
  - `salt` (`bytes32`): Random nonce to ensure transaction uniqueness.
  - `expiry` (`uint256`): Timestamp after which the transaction is not valid.
  - `multiSignature` (`bytes`): Signature proving that the transaction was approved.
  - `cctpType` (`bool`): Boolean flag for transaction type.
- **Visibility**: `public`
- **Modifiers**: `override`
- **Description**: Overrides the original `withdrawSignedAndSwapRouter` from `FiberRouter` to revert any transactions, indicating that this operation is not supported in this contract.

### withdrawSignedAndSwapRouterForGasEstimation
- **Parameters**:
  - Uses the same parameters as `withdrawSignedAndSwapRouter`.
- **Visibility**: `external`
- **Description**: Performs a simulation of the `withdrawSignedAndSwapRouter` function specifically for gas estimation purposes. Requires that the caller is the authorized gas estimation address.

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

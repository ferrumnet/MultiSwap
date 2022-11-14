## Multiswap SDK interface

### constructor

Input parameters

- Contract address
- RPC endpoint
- Mnemonic or privateKey

### owner

Returns contract owner who can add / remove signers, and foundry assets.
Input: Empty
Output: String
Example Output: "cudosxxxx1"

### pool

Returns multiswap pool address configured to the router.
Input: Empty
Output: String
Example Output: "cudosxxxx1"

### transferOwnership

A contract function call to transfer contract ownership to other address.
This function should be executed by the contract owner.

Input: newOwner (string)
Example Input: cudosxxx1
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

### setPool

A contract function call to update pool contract to other address.
This function should be executed by the contract owner.

Input: pool (string)
Example Input: cudosxxx1
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

### swap

A contract function call to swap tokens from one network to another.

Input: [sourceToken, sourceAmount, targetNetworkId, targetTokenAddress, targetAddress]
Example Input: ["stake", "100000", "111", "target_token", "target_address"]
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

### withdraw

A contract function call to withdraw tokens from other network.

Input: [token, user, amount, salt, signature]
Example Input: ["stake", "cudosxxx1", "100000", "0x0", "0x0"]
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

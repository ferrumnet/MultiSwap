## Multiswap SDK interface

### constructor

Input parameters

- Contract address
- RPC endpoint
- Mnemonic or privateKey

### allFoundryAssets

Returns all foundry assets configured on multiswap contract.

Input: Empty
Output: Array<String>
Example Output: [Asset1, Asset2, Asset3]

### owner

Returns contract owner who can add / remove signers, and foundry assets.
Input: Empty
Output: String
Example Output: "cudosxxxx1"

### isFoundryAsset

Returns if an asset is a foundry asset.

Input: Asset (string)
Example Input: "cudos"
Output: Boolean
Example Output: true

### allSigners

Returns all signers that are able to sign withdrawal transactions.

Input: Empty
Output: Array<String>
Example Output: ["cudosxxxx1","cudosxxxx2"]

### allLiquidity

Returns liquidity information for each wallet.

Input: Empty
Output: Array<Liquidity>
Example Output:

```js
[
  {
    user: "cudos189hwnkqaqacszm9kd6zcfz8dg22egaah9y0mc6",
    token: "stake",
    amount: "1000000",
  },
  {
    user: "cudos1nysrj2xxpm77xpkvglne0zcvnxuq0laacc7nrv",
    token: "stake",
    amount: "201822",
  },
];
```

### addFoundryAsset

A contract function call to add an asset to foundry asset list.
This function should be executed by the contract owner.

Input: Token (string)
Example Input: cudos
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

### removeFoundryAsset

A contract function call to remove an asset from foundry asset list.
This function should be executed by the contract owner.

Input: Token (string)
Example Input: cudos
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

### transferOwnership

A contract function call to transfer contract ownership to other address.
This function should be executed by the contract owner.

Input: newOwner (string)
Example Input: cudosxxx1
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

### addSigner

A contract function call to add a signer to the list of signers.
This function should be executed by the contract owner.

Input: signer (string)
Example Input: cudosxxx1
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

### removeSigner

A contract function call to remove a signer from the list of signers.
This function should be executed by the contract owner.

Input: signer (string)
Example Input: cudosxxx1
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

### addLiquidity

A contract function call to add liquidity to Multiswap.
Liquidity operation can only be done for foundry assets.

Input: [token, amount]
Example Input: [cudos, 100000]
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

### removeLiquidity

A contract function call to remove liquidity from Multiswap.
Liquidity operation can only be done for foundry assets.

Input: [token, amount]
Example Input: [cudos, 100000]
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

### swap

A contract function call to swap tokens from one network to another.
This smart contract function is called via fiber router.

Input: [sourceToken, sourceAmount, targetNetworkId, targetTokenAddress, targetAddress]
Example Input: ["stake", "100000", "111", "target_token", "target_address"]
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

### withdraw

A contract function call to withdraw tokens from other network.
This smart contract function is called via fiber router.

Input: [token, user, amount, salt, signature]
Example Input: ["stake", "cudosxxx1", "100000", "0x0", "0x0"]
Output: TxHash
Example Output: 2617EE7114CB573E50A8FB19AD458099F4702F2A429A6F5357F37B2B40DDD1E3

---
MultiSwap Overview: >-
  MultiSwap allows users to securely bridge any asset on network 1 for any asset on network 2 at transaction speed. Read the docs here: https://docs.ferrumnetwork.io/ferrum-network-ecosystem/v/multiswap-and-multichain-liquidity-pool-bridge/
---

# MultiSwap

### MultiSwap is divided into three major parts 
1. Fiber Engine: Controls everything
2. Fiber Router: Everything flows through the router, to ensure that there is no external contract interaction with the Fund Manager contract where the majority of Foundry Assets are.
3. Fund Manager Contract: This is where all the Foundry Assets are and also where the MultiSwap nodes will look to settle assets that need to be bridged across chains.

### Fiber Engine:
#### There are following checks being performs for initiating a swap
1. FACCheck: Foundery Asset Check, if source & target tokens are foundry assets (are bridgeable) then FACCheck is performed. 
2. RIACheck: Refinery & Ionic Asset Check, if source & target tokens are either Refinery or Ionic assets (are not bridge tokens) then RIACCheck is performed. 

### Flow of Foundry Swap
1. Source Network: FAC check (Does this token exist in the Fund Manager?)
    - Answer: Yes -> Categorized as Foundry Asset
2. Destination Network: FAC Check (Does the requested token exist on the destination network Fund Manager? If so, is there enough liquidity for this token in the Fund Manager to support the requested amount?)
    - Answer: Yes -> Categorized as Foundry Asset.

### Flow of Refinery Swap
1. Source Network: FAC check (Does the requested token exist on the Source network Fund Manager?)
    - Answer: No -> Initiates RIAC check
    - Source Network: Can I swap source token to a foundry asset in a single transaction through ecosystem DEX or aggregators?
        - Answer: Yes -> Categorized as Refinery Asset
    - Source Network: ABQC (Asset Best Quote Check) determines which ecosystem DEX or aggregator will give the best rate for this swap. -> Quote Received

2. Destination Network: FAC Check (Does the requested token exist on the destination network Fund Manager? If so, is there enough liquidity for this token in the Fund Manager to support the requested amount?)
    - Answer: No -> Initiates RIAC check
    - Destination Network: Can I swap to a foundry asset in a single transaction through ecosystem DEX or aggregators?
        - Answer: Yes -> Categorized as Refinery Asset
    - Destination Network: ABQC (Asset Best Quote Check) determines which ecosystem DEX or aggregator will give the best rate for this swap -> Quote Received

### Flow of Ionic Swap

1. Source Network: FAC check (Does the requested token exist on the Source network Fund Manager?)
    - Answer: No -> Initiates RIAC check
    - Source Network: Can I swap to a foundry asset in a single transaction through ecosystem DEX or aggregators?
        - Answer: No -> Categorized as Ionic Asset
    - Source Network: ABQC (Asset Best Quote Check) determines which ecosystem DEX or aggregator will give the best rate for this swap. -> Quote Received
2.  Destination Network: FAC Check (Does the requested token exist on the destination network Fund Manager? If so, is there enough liquidity for this token in the Fund Manager to support the requested amount?)
    - Answer: No -> Initiates RIAC check
    - Destination Network: Can I swap to a foundry asset in a single transaction through ecosystem DEX or aggregators?
        - Answer: Yes -> Categorized as Ionic Asset
    - Destination Network: ABQC (Asset Best Quote Check) determines which ecosystem DEX or aggregator will give the best rate for this swap. -> Quote Received

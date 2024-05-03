import "@nomicfoundation/hardhat-toolbox"
import "@openzeppelin/hardhat-upgrades"
import "@matterlabs/hardhat-zksync"
import 'solidity-coverage'
import { HardhatUserConfig } from "hardhat/types"
import dotenv from 'dotenv'
dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  zksolc: {
    version: "1.4.0",
    settings: {
      isSystem: true,
      optimizer: {
        enabled: true, // optional. True by default
        mode: '3', // optional. 3 by default, z to optimize bytecode size
        fallback_to_optimizing_for_size: true, // optional. Try to recompile with optimizer mode "z" if the bytecode is too large
      },
    },
  },
  networks: {
    localhost: {
      chainId: 31337,
      accounts: [process.env.PRIVATE_KEY0!],
      forking: {
        url: "https://base-mainnet.core.chainstack.com/e7aa01c976c532ebf8e2480a27f18278",
        // blockNumber: 5282922
      },
    },
    hardhat: {
      chainId: 31337,
      forking: {
        url: "https://base-mainnet.core.chainstack.com/e7aa01c976c532ebf8e2480a27f18278",
        // blockNumber: 5282922
      },
    },
    baseSepolia: {
      url: 'https://base-sepolia.g.alchemy.com/v2/uPXJr7oN2Ayz-84TDwKU3ZHCtE9zKuXv',
      accounts: [process.env.PRIVATE_KEY0!],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY0!],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/ARKLz20KVHlYxrljqZ1dhoEZGsZ7QuRm`,
      accounts: [process.env.PRIVATE_KEY0!]
    },
    mumbai: {
      url: `https://polygon-mumbai-pokt.nodies.app`,
      accounts: [process.env.PRIVATE_KEY0!]
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/b08AJeGVJqVkLAyuyvC-seOyG9fxoD_t`,
      accounts: [process.env.PRIVATE_KEY0!]
    },
    binance: {
      url: "https://bsc-dataseed2.defibit.io",
      accounts: [process.env.PRIVATE_KEY0!]
    },
    kava: {
      url: 'https://evm2.kava.io',
      accounts: [process.env.PRIVATE_KEY0!]
    },
    avalanche: {
      url: 'https://nd-118-315-546.p2pify.com/048dd2e7493f4804ffed70b2acfffe8b/ext/bc/C/rpc',
      accounts: [process.env.PRIVATE_KEY0!]
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY0!]
    },
    ethereum: {
      url: 'https://nd-611-696-948.p2pify.com/8a54d0bc389e645253087fd1a6c5fe3a',
      accounts: [process.env.PRIVATE_KEY0!]
    },
    arbitrum: {
      url: 'https://nd-829-997-700.p2pify.com/790712c620e64556719c7c9f19ef56e3',
      accounts: [process.env.PRIVATE_KEY0!]
    },
    scroll: {
      url: 'https://scroll-mainnet.core.chainstack.com/26406aa9a6209c7577a5ab1ff15243cd',
      accounts: [process.env.PRIVATE_KEY0!]
    },
    base: {
      url: 'https://base-mainnet.core.chainstack.com/e7aa01c976c532ebf8e2480a27f18278',
      accounts: [process.env.PRIVATE_KEY0!]
    },
    zksync: {
      url: "https://mainnet.era.zksync.io",
      ethNetwork: "mainnet",
      zksync: true,
      accounts: [process.env.PRIVATE_KEY0!],
      deployPaths: "deploy-zkSync",
      verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
    },
    zkSyncSepoliaTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      zksync: true,
      accounts: [process.env.PRIVATE_KEY0!],
      deployPaths: "deploy-zkSync",
      verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
    },
    dockerizedNode: {
      url: "http://localhost:3050",
      ethNetwork: "http://localhost:8545",
      zksync: true,
      deployPaths: "deploy-zkSync"
    },
    inMemoryNode: {
      url: "http://127.0.0.1:8011",
      ethNetwork: "localhost", // in-memory node doesn't support eth node; removing this line will cause an error
      zksync: true,
      deployPaths: "deploy-zkSync"
    },
  },
  etherscan: {
    apiKey: {
      scroll: "8PT9SH3QX8NENRAXGE3MGEXB58TWXEHR3V",
      bsc: process.env.BSCSCAN_API_KEY!,
      optimism: process.env.OPTIMISTIC_ETHERSCAN_API_KEY!,
      arbitrumOne: process.env.ARBISCAN_API_KEY!,
      base: process.env.BASESCAN_API_KEY!,
    },
    customChains: [
      {
        network: "scroll",
        chainId: 534352,
        urls: {
          apiURL: "https://api.scrollscan.com/api",
          browserURL: "https://scrollscan.com"
        }
      }
    ]
  },
  ignition: {
    strategyConfig: {
      create2: {
        // To learn more about salts, see the CreateX documentation
        salt: "0x0000000000000000000000000000100000000000000000000000000000000000",
      },
    },
  },
};

export default config

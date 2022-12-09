const { ethers } = require("ethers");
const fundManagerAbi = require("./artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbi = require("./artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const tokenAbi = require("./artifacts/contracts/token/Token.sol/Token.json");
const routerAbi = require("./artifacts/contracts/common/uniswap/IUniswapV2Router02.sol/IUniswapV2Router02.json");

const bscChainId = 97;
const goerliChainId = 5;

const goerliRPC =
  "https://nd-018-780-500.p2pify.com/8d55fdf55750fe8f435ef82b610d1bba";
const bscRPC =
  "https://nd-409-138-440.p2pify.com/a2b2f87cd496703b1cc64ff8e91b7981";

const goerliFundManager = "0x9B887791463cc3BfEBB04D8f54603E5E9ed81f1C"; //proxy
const bscFundManager = "0xE450A528532FaeF1Feb1094eA2674e7A1fAA3E78"; //proxy

const goerliFiberRouter = "0x757FaA8A92b6B813f96058725eC731F75cE0C59f"; //proxy
const bscFiberRouter = "0x6Cb6Aa70511C9289FbD212E5e320c799Ed2a7Be9"; //proxy

const bscRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const goerliRouter = "0xEfF92A263d31888d860bD50809A8D171709b7b1c";

const bscUsdt = "0xD069d62C372504d7fc5f3194E3fB989EF943d084";
const goerliUsdt = "0x636b346942ee09Ee6383C22290e89742b55797c5";

const goerliCake = '0xdb4d2a90C3dD45F72fA03A6FDAFe939cE52B2131';
const bscCake = "0xFa60D973F7642B748046464e165A65B7323b0DEE";


const bscUsdc = '0x2211593825f59ABcC809D1F64DE1930d56C7e483'
const goerliUsdc = '0x54E1F0a14F5a901c54563c0Ea177eB5B43CeeFc0'

const bscAda = "0x93498CD124EE957CCc1E0e7Acb6022Fc6caF3D10";
const goerliAda = "0x93e7a4C6FF5f5D786a33076c8F9D380E1bbA7E90";

const bscLink = "0x800181891a79A3Aa28f271884c7c6cAD07847967";
const goerliLink = "0x6CD74120C67A5c0C1Ed6f34a3c40f3224E4Cf5bC";

const bscUsdtOracle = "0xEca2605f0BCF2BA5966372C99837b1F182d3D620";
const goerliUsdtOracle = "0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7";

const bscLinkOracle = "0x1B329402Cb1825C6F30A0d92aB9E2862BE47333f";
const goerliLinkOracle = "0x48731cF7e84dc94C5f84577882c14Be11a5B7456";

const goerliCudos = "0xe6A57A671F23CcB8cA54264e2cF5E05D47a200ED";
const bscCudos = "0x34e93782447c34C1526f4A2C2c30B54178289d90";

const goerliWeth = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
const bscWbnb = "0xae13d989dac2f0debff460ac112a837c89baa7cd";

const goerliAave = "0xbAa54514a31F64c1eB3340789943bCc0abb29f9f";
const bscAave = "0x8834b57Fb0162977011C9D11dFF1d24b93073DA6";

//network providers
const goerliProvider = new ethers.providers.JsonRpcProvider(goerliRPC);
const bscProvider = new ethers.providers.JsonRpcProvider(bscRPC);

//dex contracts
const goerliDexContract = new ethers.Contract(
  goerliRouter,
  routerAbi.abi,
  goerliProvider
);
const bscDexContract = new ethers.Contract(
  bscRouter,
  routerAbi.abi,
  bscProvider
);

// fund manager contracts
const goerliFundMangerContract = new ethers.Contract(
  goerliFundManager,
  fundManagerAbi.abi,
  goerliProvider
);
const bscFundMangerContract = new ethers.Contract(
  bscFundManager,
  fundManagerAbi.abi,
  bscProvider
);

// goerli fund manager contract
const goerliFiberRouterContract = new ethers.Contract(
  goerliFiberRouter,
  fiberRouterAbi.abi,
  goerliProvider
);
const bscFiberRouterContract = new ethers.Contract(
  bscFiberRouter,
  fiberRouterAbi.abi,
  bscProvider
);

const networks = {
  5: {
    name: "goerli",
    rpc: goerliRPC,
    chainId: goerliChainId,
    fundManager: goerliFundManager,
    fiberRouter: goerliFiberRouter,
    router: goerliRouter,
    provider: goerliProvider,
    foundryTokenAddress: goerliUsdc,
    dexContract: goerliDexContract,
    fundManagerContract: goerliFundMangerContract,
    fiberRouterContract: goerliFiberRouterContract,
    weth: goerliWeth,
  },
  97: {
    name: "bsc",
    rpc: bscRPC,
    chainId: bscChainId,
    fundManager: bscFundManager,
    fiberRouter: bscFiberRouter,
    router: bscRouter,
    provider: bscProvider,
    foundryTokenAddress: bscUsdc,
    dexContract: bscDexContract,
    fundManagerContract: bscFundMangerContract,
    fiberRouterContract: bscFiberRouterContract,
    wbnb: bscWbnb,
  },
};

module.exports = {
  bscChainId,
  goerliChainId,
  goerliRPC,
  bscRPC,
  goerliFundManager,
  bscFundManager,
  goerliFiberRouter,
  bscFiberRouter,
  bscRouter,
  goerliRouter,
  bscUsdt,
  goerliUsdt,
  bscCake,
  goerliCake,
  goerliUsdc,
  bscUsdc,
  bscAda,
  goerliAda,
  bscLink,
  goerliLink,
  goerliAave,
  bscAave,
  goerliCudos,
  bscCudos,
  bscUsdtOracle,
  goerliUsdtOracle,
  bscLinkOracle,
  goerliLinkOracle,
  networks,
};

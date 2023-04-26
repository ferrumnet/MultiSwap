const { ethers } = require("ethers");
const fundManagerAbi = require("./artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbi = require("./artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const tokenAbi = require("./artifacts/contracts/token/Token.sol/Token.json");
const routerAbi = require("./artifacts/contracts/common/uniswap/IUniswapV2Router02.sol/IUniswapV2Router02.json");

const fundManagerAbiMainnet = require("./artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbiMainnet = require("./artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const routerAbiMainnet = require("./artifacts/contracts/common/uniswap/IUniswapV2Router02.sol/IUniswapV2Router02.json");

/* ================================================================= */
// TESTNET Configurations
const bscChainId = 97;
const goerliChainId = 5;
const cudosChainId = "cudos-1";

const goerliRPC = `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`;
const bscRPC = process.env.BINANCE_TESTNET_RPC;

const cudosRPC = "https://rpc.cudos.org";

const goerliFundManager = "0x9B887791463cc3BfEBB04D8f54603E5E9ed81f1C"; //proxy
const bscFundManager = "0xE450A528532FaeF1Feb1094eA2674e7A1fAA3E78"; //proxy
const cudosFundManager =
  "cudos1peeyz6n4k8hz4mnj5f3p6jun4v5gjax0uvq9k3c5ekudjtncxl6qhkkdp2";

const goerliFiberRouter = "0x47C9f492c14bb23ED88Df2EE250E3baC45283019"; //proxy
const bscFiberRouter = "0x116321eF4642518774E00528Facf8C825552cd2B"; //proxy
const cudosFiberRouter =
  "cudos1c676xpc64x9lxjfsvpn7ajw2agutthe75553ws45k3ld46vy8ptsg9e9ez";

const bscRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const goerliRouter = "0xEfF92A263d31888d860bD50809A8D171709b7b1c";

const bscUsdt = "0xD069d62C372504d7fc5f3194E3fB989EF943d084";
const goerliUsdt = "0x636b346942ee09Ee6383C22290e89742b55797c5";

const goerliCake = "0xdb4d2a90C3dD45F72fA03A6FDAFe939cE52B2131";
const bscCake = "0xFa60D973F7642B748046464e165A65B7323b0DEE";

const bscUsdc = "0x2211593825f59ABcC809D1F64DE1930d56C7e483";
const goerliUsdc = "0x54E1F0a14F5a901c54563c0Ea177eB5B43CeeFc0";

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
const bscWeth = "0xae13d989dac2f0debff460ac112a837c89baa7cd";

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

/* =================================================================== */
//                   Mainnet Configurations

const bscMainnetChainId = 56;
const polygonMainnetChainId = 137;
const ftmMainnetChainId = 250;

// const bscMainnetRPC = 'https://nd-217-204-155.p2pify.com/379ccd6673575fd7a096cc3f2a87be63';
const bscMainnetRPC = process.env.BSCMAINNETRPC;
// const polygonMainnetRPC = 'https://polygon-rpc.com';
const polygonMainnetRPC = process.env.POLYGONRPC;
const ftmMainnetRPC = process.env.FTMRPC;

const bscMainnetProvider = new ethers.providers.JsonRpcProvider(bscMainnetRPC);
const polygonMainnetProvider = new ethers.providers.JsonRpcProvider(
  polygonMainnetRPC
);
const ftmMainnetProvider = new ethers.providers.JsonRpcProvider(ftmMainnetRPC);

const bscMainnetDEXRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const polygonMainnetDEXRouter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const ftmMainnetDEXRouter = "0xF491e7B69E4244ad4002BC14e878a34207E38c29";

// const bscMainnetFundManager = '0x42cEB2Bb4B04FC5A2D7621A382019F8E3ADB6B68';

// const bscMainnetFundManager = '0x9E566928AcC3594555A35d4D319f081013Ea9949'; //for non evm testin
const bscMainnetFundManager = "0x6c94d367CbAC6B8F9879EDDc54eAE9B9762f1e6E"; //for non evm testin

const polygonMainnetFundManager = "0xd695Ecd3D8A824D0D8Cb5f8aeBD59fAEC2d37Bf8";
const ftmMainnetFundManager = "0xF87d78C41D01660082DE1A4aC3CAc3dd211CaCCf";

// const bscMainnetFiberRouter = '0x7cA60AA20761EBC81F70Bb93F5068Be4e6765E87';
// const bscMainnetFiberRouter = '0xd695Ecd3D8A824D0D8Cb5f8aeBD59fAEC2d37Bf8'; // for non evm testing
const bscMainnetFiberRouter = "0xcf40780AbBb8BB83f8748Fd377Ef779B19a011e8"; // for non evm testing

const polygonMainnetFiberRouter = "0x72329a50E785bc1A414022D319E3a10A6f12184f";
const ftmMainnetFiberRouter = "0xb014edCb84b89480Ac21F36837B62Fa75a5BFf8a";

const bscMainnetUsdc = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const polygonMainnetUsdc = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const ftmMainnetUsdc = "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75";

const bscMainnetWeth = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const polygonMainnetWeth = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
const ftmMainnetWeth = "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83";

// Mainnet Contract Configuration
const bscMainnetDexContract = new ethers.Contract(
  bscMainnetDEXRouter,
  routerAbiMainnet.abi,
  bscMainnetProvider
);
const polygonMainnetDexContract = new ethers.Contract(
  polygonMainnetDEXRouter,
  routerAbiMainnet.abi,
  polygonMainnetProvider
);
const ftmMainnetDexContract = new ethers.Contract(
  ftmMainnetDEXRouter,
  routerAbiMainnet.abi,
  ftmMainnetProvider
);

// fund manager contracts
const bscMainnetFundMangerContract = new ethers.Contract(
  bscMainnetFundManager,
  fundManagerAbiMainnet.abi,
  bscMainnetProvider
);
const polygonMainnetFundMangerContract = new ethers.Contract(
  polygonMainnetFundManager,
  fundManagerAbiMainnet.abi,
  polygonMainnetProvider
);
const ftmMainnetFundMangerContract = new ethers.Contract(
  ftmMainnetFundManager,
  fundManagerAbiMainnet.abi,
  ftmMainnetProvider
);

// goerli fund manager contract
const bscMainnetFiberRouterContract = new ethers.Contract(
  bscMainnetFiberRouter,
  fiberRouterAbiMainnet.abi,
  bscMainnetProvider
);
const polygonMainnetFiberRouterContract = new ethers.Contract(
  polygonMainnetFiberRouter,
  fiberRouterAbiMainnet.abi,
  polygonMainnetProvider
);
const ftmMainnetFiberRouterContract = new ethers.Contract(
  ftmMainnetFiberRouter,
  fiberRouterAbiMainnet.abi,
  ftmMainnetProvider
);

const networks = {
  56: {
    name: "bscMainnet",
    shortName: "bsc",
    rpc: bscMainnetRPC,
    chainId: bscMainnetChainId,
    fundManager: bscMainnetFundManager,
    fiberRouter: bscMainnetFiberRouter,
    router: bscMainnetDEXRouter,
    provider: bscMainnetProvider,
    foundryTokenAddress: bscMainnetUsdc,
    dexContract: bscMainnetDexContract,
    fundManagerContract: bscMainnetFundMangerContract,
    fiberRouterContract: bscMainnetFiberRouterContract,
    weth: bscMainnetWeth,
    type: "evm",
    decimals: null,
    foundryTokenDecimals: 18,
  },
  137: {
    name: "polygonMainnet",
    shortName: "polygon",
    rpc: polygonMainnetRPC,
    chainId: polygonMainnetChainId,
    fundManager: polygonMainnetFundManager,
    fiberRouter: polygonMainnetFiberRouter,
    router: polygonMainnetDEXRouter,
    provider: polygonMainnetProvider,
    foundryTokenAddress: polygonMainnetUsdc,
    dexContract: polygonMainnetDexContract,
    fundManagerContract: polygonMainnetFundMangerContract,
    fiberRouterContract: polygonMainnetFiberRouterContract,
    weth: polygonMainnetWeth,
    type: "evm",
    decimals: null,
    foundryTokenDecimals: 6,
  },
  250: {
    name: "polygonMainnet",
    shortName: "polygon",
    rpc: ftmMainnetRPC,
    chainId: ftmMainnetChainId,
    fundManager: ftmMainnetFundManager,
    fiberRouter: ftmMainnetFiberRouter,
    router: ftmMainnetDEXRouter,
    provider: ftmMainnetProvider,
    foundryTokenAddress: ftmMainnetUsdc,
    dexContract: ftmMainnetDexContract,
    fundManagerContract: ftmMainnetFundMangerContract,
    fiberRouterContract: ftmMainnetFiberRouterContract,
    weth: ftmMainnetWeth,
    type: "evm",
    decimals: null,
    foundryTokenDecimals: 6,
  },
  5: {
    name: "goerli",
    shortName: "goerliTestnet",
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
    type: "evm",
    decimals: null,
    foundryTokenDecimals: 18,
  },
  97: {
    name: "bsc",
    shortName: "bscTestnet",
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
    weth: bscWeth,
    type: "evm",
    decimals: null,
    foundryTokenDecimals: 18,
  },
  "cudos-1": {
    name: "CUDOS",
    shortName: "cudos",
    rpc: cudosRPC,
    chainId: cudosChainId,
    fundManager: cudosFundManager,
    fiberRouter: cudosFiberRouter,
    router: null,
    provider: null,
    foundryTokenAddress: "acudos",
    dexContract: null,
    fundManagerContract: null,
    fiberRouterContract: null,
    weth: null,
    type: "cosmwasm",
    decimals: "18",
    foundryTokenDecimals: 18,
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
  bscWeth,
  bscUsdtOracle,
  goerliUsdtOracle,
  bscLinkOracle,
  goerliLinkOracle,
  networks,
};

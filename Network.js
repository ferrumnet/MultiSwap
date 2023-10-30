const { ethers } = require("ethers");
const fundManagerAbi = require("./artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbi = require("./artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const tokenAbi = require("./artifacts/contracts/token/Token.sol/token.json");
const routerAbi = require("./artifacts/contracts/common/uniswap/IUniswapV2Router02.sol/IUniswapV2Router02.json");

const fundManagerAbiMainnet = require("./artifacts/contracts/upgradeable-Bridge/FundManager.sol/FundManager.json");
const fiberRouterAbiMainnet = require("./artifacts/contracts/upgradeable-Bridge/FiberRouter.sol/FiberRouter.json");
const routerAbiMainnet = require("./artifacts/contracts/common/uniswap/IUniswapV2Router02.sol/IUniswapV2Router02.json");

/* ================================================================= */
// TESTNET Configurations
const bscChainId = 97;
const goerliChainId = 5;
const cudosChainId = "cudos-1";
const neonDevNetChainId = 245022926

const goerliRPC = `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`;
const bscRPC = process.env.BINANCE_TESTNET_RPC;

const cudosRPC = "https://rpc.cudos.org";
const neonDevNetRPC = "https://devnet.neonevm.org";

const goerliFundManager = "0x9B887791463cc3BfEBB04D8f54603E5E9ed81f1C"; //proxy
const bscFundManager = "0xE450A528532FaeF1Feb1094eA2674e7A1fAA3E78"; //proxy
const cudosFundManager =
  "cudos1peeyz6n4k8hz4mnj5f3p6jun4v5gjax0uvq9k3c5ekudjtncxl6qhkkdp2";
const neonDevNetFundManager = "0xE6ff690CC7B91A2B626F7A76Fe507028bc1Eb12D"

const goerliFiberRouter = "0x47C9f492c14bb23ED88Df2EE250E3baC45283019"; //proxy
const bscFiberRouter = "0x116321eF4642518774E00528Facf8C825552cd2B"; //proxy
const cudosFiberRouter =
  "cudos1c676xpc64x9lxjfsvpn7ajw2agutthe75553ws45k3ld46vy8ptsg9e9ez";
const neonDevNetFiberRouter = "0xF712ed427b3912DD423a60EB033e7015c24fb304"

const bscRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const goerliRouter = "0xEfF92A263d31888d860bD50809A8D171709b7b1c";
const neonDevNetRouter = "0x491FFC6eE42FEfB4Edab9BA7D5F3e639959E081B"

const bscUsdt = "0xD069d62C372504d7fc5f3194E3fB989EF943d084";
const goerliUsdt = "0x636b346942ee09Ee6383C22290e89742b55797c5";

const goerliCake = "0xdb4d2a90C3dD45F72fA03A6FDAFe939cE52B2131";
const bscCake = "0xFa60D973F7642B748046464e165A65B7323b0DEE";

const bscUsdc = "0x2211593825f59ABcC809D1F64DE1930d56C7e483";
const goerliUsdc = "0x54E1F0a14F5a901c54563c0Ea177eB5B43CeeFc0";
const neonDevNetUsdc = "0x512e48836cd42f3eb6f50ced9ffd81e0a7f15103"

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
const neonDevNetWeth = "0xf1041596da0499c3438e3b1eb7b95354c6aed1f5"

const goerliAave = "0xbAa54514a31F64c1eB3340789943bCc0abb29f9f";
const bscAave = "0x8834b57Fb0162977011C9D11dFF1d24b93073DA6";

//network providers
const goerliProvider = new ethers.providers.JsonRpcProvider(goerliRPC);
const bscProvider = new ethers.providers.JsonRpcProvider(bscRPC);
const neonDevNetProvider = new ethers.providers.JsonRpcProvider(neonDevNetRPC);


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
const neonDevDexContract = new ethers.Contract(
  neonDevNetRouter,
  routerAbi.abi,
  neonDevNetProvider
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
const neonDevNetFundMangerContract = new ethers.Contract(
  neonDevNetFundManager,
  fundManagerAbi.abi,
  neonDevNetProvider
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
const neonDevNetFiberRouterContract = new ethers.Contract(
  neonDevNetFiberRouter,
  fiberRouterAbi.abi,
  neonDevNetProvider
);


/* =================================================================== */
//                   Mainnet Configurations

const bscMainnetChainId = 56;
const polygonMainnetChainId = 137;
const ftmMainnetChainId = 250;
const kavaMainnetChainId = 2222;
const avalancheMainnetChainId = 43114;
const neonEvmMainnetChainId = 245022934;
const celoMainnetChainId = 245022934;
const harmonyMainnetChainId = 1666600000;




const bscMainnetRPC = 'https://bsc-dataseed2.ninicoin.io';
// const bscMainnetRPC = process.env.BSCMAINNETRPC;
const polygonMainnetRPC = 'https://nd-003-843-665.p2pify.com/7af52d3a77b5d19f11de64357253ca16';
// const polygonMainnetRPC = process.env.POLYGONRPC;
const ftmMainnetRPC = "https://nd-900-788-550.p2pify.com/6987e80a4f315a5fe7d277c50bbefb02";
const kavaMainnetRPC = "https://evm2.kava.io";
const avalancheMainnetRPC = "https://nd-118-315-546.p2pify.com/048dd2e7493f4804ffed70b2acfffe8b/ext/bc/C/rpc";
const neonEvmMainnetRPC = "https://neon-proxy-mainnet.solana.p2p.org";
const celoMainnetRPC = "https://celo-mainnet.infura.io/v3/71855b0c342b4fbcb05db89073ae2035";
const harmonyMainnetRPC = "https://api.harmony.one";



const bscMainnetProvider = new ethers.providers.JsonRpcProvider(bscMainnetRPC);
const polygonMainnetProvider = new ethers.providers.JsonRpcProvider(
  polygonMainnetRPC
);
const ftmMainnetProvider = new ethers.providers.JsonRpcProvider(ftmMainnetRPC);
const kavaMainnetProvider = new ethers.providers.JsonRpcProvider(kavaMainnetRPC);
const avalancheMainnetProvider = new ethers.providers.JsonRpcProvider(avalancheMainnetRPC);
const neonEvmMainnetProvider = new ethers.providers.JsonRpcProvider(neonEvmMainnetRPC);
const celoMainnetProvider = new ethers.providers.JsonRpcProvider(celoMainnetRPC);
const harmonyMainnetProvider = new ethers.providers.JsonRpcProvider(harmonyMainnetRPC);


const bscMainnetDEXRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const polygonMainnetDEXRouter = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const ftmMainnetDEXRouter = "0xF491e7B69E4244ad4002BC14e878a34207E38c29";
const kavaMainnetDEXRouter = "0xA7544C409d772944017BB95B99484B6E0d7B6388";
const avalancheMainnetDEXRouter = "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106";
const neonEvmMainnetDEXRouter = "0x3CC4E4Ce67a6908CA5EA74d73d6c9482ec90e573";
const celoMainnetDEXRouter = "0x1421bDe4B10e8dd459b3BCb598810B1337D56842";
const harmonyMainnetDEXRouter = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

// const bscMainnetFundManager = '0x42cEB2Bb4B04FC5A2D7621A382019F8E3ADB6B68';

// const bscMainnetFundManager = '0x9E566928AcC3594555A35d4D319f081013Ea9949'; //for non evm testin
const bscMainnetFundManager = "0x3A508088Ad506184E6D0207C4705803d9D4F1263"; //for non evm testin

const polygonMainnetFundManager = "0x59730bF8cb1D2a42Ac0dc88F7eD38E7eFF009B7c";
const ftmMainnetFundManager = "0x354cbfc2894d45a584a9fd0223cf58495ce3cf7";
const kavaMainnetFundManager = "0x2de94E021C23933E18fbFa01437d0BC14D8aCd3A"
const avalancheMainnetFundManager = "0x81A536479Af0FE02Ec2aC6BB59Db305aa72a774f";
const neonEvmMainnetFundManager = "0xE6ff690CC7B91A2B626F7A76Fe507028bc1Eb12D";
const celoMainnetFundManager = "0x16c2a402327A8ef00d3230B56e62eFf669B19f34";
const harmonyMainnetFundManager = "0x798805A012CCfc5128f56659bc73f4051caCB95C";

// const bscMainnetFiberRouter = '0x7cA60AA20761EBC81F70Bb93F5068Be4e6765E87';
// const bscMainnetFiberRouter = '0xd695Ecd3D8A824D0D8Cb5f8aeBD59fAEC2d37Bf8'; // for non evm testing
const bscMainnetFiberRouter = "0x3b0d843c49220308512B3068A6211022C08585a8"; // for non evm testing
const polygonMainnetFiberRouter = "0x5c72ff04A53f6eCeaAc4DA77daB945b321ec25B0";
const ftmMainnetFiberRouter = "0xaa209557b51c28a8d050fb500e67498eb3d1d92b";
const kavaMainnetFiberRouter = "0x00e6474E31d06Cca62caf1CA6BAce786b585D944";
const avalancheMainnetFiberRouter = "0x066599eD3abB7Eaf517119d376254af13871e5B1";
const neonEvmMainnetFiberRouter = "0x2234157B16637AfA6f1A7C1C34b1b80D82b50D82";
const celoMainnetFiberRouter = "0x35D1A31df0122f1f00065229Ad00968D52c2BDB7";
const harmonyMainnetFiberRouter = "0xD4B5f5f365ecc752A8154097510835606BAc80e8";


const bscMainnetUsdc = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const polygonMainnetUsdc = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const ftmMainnetUsdc = "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75";
const kavaMainnetUsdc = "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75";
const avalancheMainnetUsdc = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
const neonEvmMainnetUsdc = "0xea6b04272f9f62f997f666f07d3a974134f7ffb9";
const celoMainnetUsdc = "0xef4229c8c3250C675F21BCefa42f58EfbfF6002a";
const harmonyMainnetUsdc = "0xBC594CABd205bD993e7FfA6F3e9ceA75c1110da5";

const bscMainnetWeth = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const polygonMainnetWeth = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
const ftmMainnetWeth = "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83";
const kavaMainnetWeth = "0xc86c7c0efbd6a49b35e8714c5f59d99de09a225b";
const avalancheMainnetWeth = "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB";
const neonEvmMainnetWeth = "0xcffd84d468220c11be64dc9df64eafe02af60e8a";
const celoMainnetWeth = "0x122013fd7dF1C6F636a5bb8f03108E876548b455";
const harmonyMainnetWeth = "0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a";

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
const kavaMainnetDexContract = new ethers.Contract(
  kavaMainnetDEXRouter,
  routerAbiMainnet.abi,
  kavaMainnetProvider
);
const avalancheMainnetDexContract = new ethers.Contract(
  avalancheMainnetDEXRouter,
  routerAbiMainnet.abi,
  avalancheMainnetProvider
);
const neonEvmMainnetDexContract = new ethers.Contract(
  neonEvmMainnetDEXRouter,
  routerAbiMainnet.abi,
  neonEvmMainnetProvider
);
const celoMainnetDexContract = new ethers.Contract(
  celoMainnetDEXRouter,
  routerAbiMainnet.abi,
  celoMainnetProvider
);
const harmonyMainnetDexContract = new ethers.Contract(
  harmonyMainnetDEXRouter,
  routerAbiMainnet.abi,
  harmonyMainnetProvider
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
const kavaMainnetFundMangerContract = new ethers.Contract(
  kavaMainnetFundManager,
  fundManagerAbiMainnet.abi,
  kavaMainnetProvider
);
const avalancheMainnetFundMangerContract = new ethers.Contract(
  avalancheMainnetFundManager,
  fundManagerAbiMainnet.abi,
  avalancheMainnetProvider
);
const neonEvmMainnetFundMangerContract = new ethers.Contract(
  neonEvmMainnetFundManager,
  fundManagerAbiMainnet.abi,
  neonEvmMainnetProvider
);
const celoMainnetFundMangerContract = new ethers.Contract(
  celoMainnetFundManager,
  fundManagerAbiMainnet.abi,
  celoMainnetProvider
);
const harmonyMainnetFundMangerContract = new ethers.Contract(
  harmonyMainnetFundManager,
  fundManagerAbiMainnet.abi,
  harmonyMainnetProvider
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
const kavaMainnetFiberRouterContract = new ethers.Contract(
  kavaMainnetFiberRouter,
  fiberRouterAbiMainnet.abi,
  kavaMainnetProvider
);
const avalancheMainnetFiberRouterContract = new ethers.Contract(
  avalancheMainnetFiberRouter,
  fiberRouterAbiMainnet.abi,
  avalancheMainnetProvider
);
const neonEvmMainnetFiberRouterContract = new ethers.Contract(
  avalancheMainnetFiberRouter,
  fiberRouterAbiMainnet.abi,
  avalancheMainnetProvider
);
const celoMainnetFiberRouterContract = new ethers.Contract(
  celoMainnetFiberRouter,
  fiberRouterAbiMainnet.abi,
  celoMainnetProvider
);
const harmonyMainnetFiberRouterContract = new ethers.Contract(
  harmonyMainnetFiberRouter,
  fiberRouterAbiMainnet.abi,
  harmonyMainnetProvider
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
  245022926: {
    name: "Neon Labs",
    shortName: "neon",
    rpc: neonDevNetRPC,
    chainId: neonDevNetChainId,
    fundManager: neonDevNetFundManager,
    fiberRouter: neonDevNetFiberRouter,
    router: neonDevNetRouter,
    provider: neonDevNetProvider,
    foundryTokenAddress: neonDevNetUsdc,
    dexContract: neonDevDexContract,
    fundManagerContract: neonDevNetFundMangerContract,
    fiberRouterContract: neonDevNetFiberRouterContract,
    weth: neonDevNetWeth,
    type: "evm",
    decimals: null,
    foundryTokenDecimals: 6,
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
  2222: {
    name: "Kava Mainnet",
    shortName: "kava",
    rpc: kavaMainnetRPC,
    chainId: kavaMainnetChainId,
    fundManager: kavaMainnetFundManager,
    fiberRouter: kavaMainnetFiberRouter,
    router: kavaMainnetDEXRouter,
    provider: kavaMainnetProvider,
    foundryTokenAddress: kavaMainnetUsdc,
    dexContract: kavaMainnetDexContract,
    fundManagerContract: kavaMainnetFundMangerContract,
    fiberRouterContract: kavaMainnetFiberRouterContract,
    weth: kavaMainnetWeth,
    type: "evm",
    decimals: null,
    foundryTokenDecimals: 6,
  },
  43114: {
    name: "Avalanche C-Chain",
    shortName: "avax",
    rpc: avalancheMainnetRPC,
    chainId: avalancheMainnetChainId,
    fundManager: avalancheMainnetFundManager,
    fiberRouter: avalancheMainnetFiberRouter,
    router: avalancheMainnetDEXRouter,
    provider: avalancheMainnetProvider,
    foundryTokenAddress: avalancheMainnetUsdc,
    dexContract: avalancheMainnetDexContract,
    fundManagerContract: avalancheMainnetFundMangerContract,
    fiberRouterContract: avalancheMainnetFiberRouterContract,
    weth: avalancheMainnetWeth,
    type: "evm",
    decimals: null,
    foundryTokenDecimals: 6,
  },
  245022934: {
    name: "Neon Labs",
    shortName: "neon",
    rpc: neonEvmMainnetRPC,
    chainId: neonEvmMainnetChainId,
    fundManager: neonEvmMainnetFundManager,
    fiberRouter: neonEvmMainnetFiberRouter,
    router: neonEvmMainnetDEXRouter,
    provider: neonEvmMainnetProvider,
    foundryTokenAddress: neonEvmMainnetUsdc,
    dexContract: neonEvmMainnetDexContract,
    fundManagerContract: neonEvmMainnetFundMangerContract,
    fiberRouterContract: neonEvmMainnetFiberRouterContract,
    weth: neonEvmMainnetWeth,
    type: "evm",
    decimals: null,
    foundryTokenDecimals: 6,
  },
  42220: {
    name: "Celo Mainnet",
    shortName: "celo",
    rpc: celoMainnetRPC,
    chainId: celoMainnetChainId,
    fundManager: celoMainnetFundManager,
    fiberRouter: celoMainnetFiberRouter,
    router: celoMainnetDEXRouter,
    provider: celoMainnetProvider,
    foundryTokenAddress: celoMainnetUsdc,
    dexContract: celoMainnetDexContract,
    fundManagerContract: celoMainnetFundMangerContract,
    fiberRouterContract: celoMainnetFiberRouterContract,
    weth: celoMainnetWeth,
    type: "evm",
    decimals: null,
    foundryTokenDecimals: 6,
  },
  1666600000: {
    name: "harmony Mainnet",
    shortName: "harmony",
    rpc: harmonyMainnetRPC,
    chainId: harmonyMainnetChainId,
    fundManager: harmonyMainnetFundManager,
    fiberRouter: harmonyMainnetFiberRouter,
    router: harmonyMainnetDEXRouter,
    provider: harmonyMainnetProvider,
    foundryTokenAddress: harmonyMainnetUsdc,
    dexContract: harmonyMainnetDexContract,
    fundManagerContract: harmonyMainnetFundMangerContract,
    fiberRouterContract: harmonyMainnetFiberRouterContract,
    weth: harmonyMainnetWeth,
    type: "evm",
    decimals: null,
    foundryTokenDecimals: 6,
  }
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

 const bscChain = 97;
 const goerliChain = 5;

 const goerliRPC = 'https://goerli.infura.io/v3/fa18fa35171744ae8ac35d12baa36ae3'
 const bscRPC = 'https://data-seed-prebsc-1-s2.binance.org:8545'

 // FundManagers
 const goerliFundManager = '0x9B887791463cc3BfEBB04D8f54603E5E9ed81f1C'//proxy
 const bscFundManager = '0xE450A528532FaeF1Feb1094eA2674e7A1fAA3E78'//proxy

 // FiberRouterContract
 const goerliFiberRouter = '0xa20Ea6722D828C9A5d370E6cdB9608d9e0459F26'//proxy
 const bscFiberRouter = '0x6147F4c2b20d3638d12600C6F2189e7A890F3Bbf'//proxy

 // DEX Routers
 const bscRouter = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1'
 const goerliRouter = '0xEfF92A263d31888d860bD50809A8D171709b7b1c'

 // FoundryToken
 const bscUsdt = '0xD069d62C372504d7fc5f3194E3fB989EF943d084'
 const goerliUsdt = '0x636b346942ee09Ee6383C22290e89742b55797c5'

 // Ada Token
 const bscAda = '0x93498CD124EE957CCc1E0e7Acb6022Fc6caF3D10'
 const goerliAda = '0x93e7a4C6FF5f5D786a33076c8F9D380E1bbA7E90'

 // Source Token
 const goerliUsdc = '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C'

 // Target Token
 const bscCake = '0xFa60D973F7642B748046464e165A65B7323b0DEE'





module.exports = {
    bscChain, goerliChain, goerliRPC, bscRPC, goerliFundManager, bscFundManager
    ,goerliFiberRouter, bscFiberRouter, bscRouter, goerliRouter, bscUsdt, goerliUsdt
    ,bscCake, goerliUsdc, bscAda, goerliAda
  };
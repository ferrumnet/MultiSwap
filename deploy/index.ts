import { multiswap } from "./multiswapTesting";


const main = async () => {
    await multiswap()
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});

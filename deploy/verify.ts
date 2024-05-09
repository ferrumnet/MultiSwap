import { exec } from 'child_process';
import { promisify } from 'util';
import addresses from "../constants/addresses.json";
import hre from "hardhat";

// Convert exec to a promise-based function
const execPromise = promisify(exec);

const main = async () => {
    const commands: string[] = [];
    const thisNetwork = hre.network.name;

    commands.push(`hardhat verify --network ${thisNetwork} ${addresses.networks[thisNetwork].deployments.fiberRouter}`);
    commands.push(`hardhat verify --network ${thisNetwork} ${addresses.networks[thisNetwork].deployments.fundManager} --contract contracts/multiswap-contracts/FundManager.sol:FundManager`);
    commands.push(`hardhat verify --network ${thisNetwork} ${addresses.networks[thisNetwork].deployments.cctpFundManager} --contract contracts/multiswap-contracts/CCTPFundManager.sol:CCTPFundManager`);
    commands.push(`hardhat verify --network ${thisNetwork} ${addresses.networks[thisNetwork].deployments.multiSwapForge}`);
    commands.push(`hardhat verify --network ${thisNetwork} ${addresses.networks[thisNetwork].deployments.forgeFundManager} --contract contracts/multiswap-contracts/ForgeFundManager.sol:ForgeFundManager`);
    commands.push(`hardhat verify --network ${thisNetwork} ${addresses.networks[thisNetwork].deployments.forgeCCTPFundManager} --contract contracts/multiswap-contracts/ForgeCCTPFundManager.sol:ForgeCCTPFundManager`);

    for (const command of commands) {
        try {
            const { stdout, stderr } = await execPromise(command);
            console.log(`Output for command: ${command}`);
            console.log('stdout:', stdout);
            if (stderr) {
                console.error('stderr:', stderr);
            }
        } catch (error) {
            console.error(`Error executing ${command}:`, error);
        }
    }
};

main().then(() => process.exit(0)).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});

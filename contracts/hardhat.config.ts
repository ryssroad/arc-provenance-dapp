import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env.local" });

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: false, // Disabled for Full Match verification
            },
        },
    },
    networks: {
        arcTestnet: {
            url: "https://rpc.testnet.arc.network",
            chainId: 5042002,
            accounts: [PRIVATE_KEY],
        },
    },
};

export default config;

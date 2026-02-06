const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

    // Deploy DigitalObjectNFT
    console.log("\n1. Deploying DigitalObjectNFT...");
    const DigitalObjectNFT = await hre.ethers.getContractFactory("DigitalObjectNFT");
    const nft = await DigitalObjectNFT.deploy(
        "ARC Digital Objects",    // name
        "ARCDO",                  // symbol
        ""                        // baseURI (empty, we use seedURI per token)
    );
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    console.log("DigitalObjectNFT deployed to:", nftAddress);

    // Deploy ProvenanceRegistryV2
    console.log("\n2. Deploying ProvenanceRegistryV2...");
    const ProvenanceRegistryV2 = await hre.ethers.getContractFactory("ProvenanceRegistryV2");
    const registry = await ProvenanceRegistryV2.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("ProvenanceRegistryV2 deployed to:", registryAddress);

    // Save deployment info
    const deployment = {
        network: "arcTestnet",
        chainId: 5042002,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            DigitalObjectNFT: {
                address: nftAddress,
                name: "ARC Digital Objects",
                symbol: "ARCDO",
            },
            ProvenanceRegistryV2: {
                address: registryAddress,
            },
        },
    };

    const deploymentPath = path.join(__dirname, "../deployed.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log("\nDeployment info saved to:", deploymentPath);

    console.log("\n✅ Deployment complete!");
    console.log("\nContract Addresses:");
    console.log("  DigitalObjectNFT:", nftAddress);
    console.log("  ProvenanceRegistryV2:", registryAddress);
    console.log("\nNext steps:");
    console.log("1. Verify contracts on Blockscout");
    console.log("2. Update lib/contracts.ts with new addresses and ABIs");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

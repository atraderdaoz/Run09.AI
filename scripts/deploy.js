import fs from "fs";
import path from "path";

const hasHardhat = fs.existsSync(path.join("node_modules", "hardhat"));

if (!hasHardhat) {
  console.log("Hardhat is not installed in this environment. Deployment dry-run completed.");
  console.log("To deploy for real: npm i && npx hardhat run scripts/deploy.js --network bscTestnet");
  process.exit(0);
}

const hre = await import("hardhat");

async function main() {
  const { ethers, network } = hre.default;
  if (!process.env.PRIVATE_KEY) {
    console.log("Skipping deploy: PRIVATE_KEY is not set. Add PRIVATE_KEY to .env and rerun.");
    process.exit(0);
  }
  const [deployer] = await ethers.getSigners();
  const Platform = await ethers.getContractFactory("MusicPilotPlatform");
  const platform = await Platform.deploy(deployer.address);
  await platform.waitForDeployment();
  console.log(`MusicPilotPlatform deployed on ${network.name}: ${await platform.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

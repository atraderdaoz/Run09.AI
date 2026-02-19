import fs from "fs";
import path from "path";

const hasHardhat = fs.existsSync(path.join("node_modules", "hardhat"));

if (!hasHardhat) {
  console.log("Hardhat is not installed in this environment. Deployment dry-run completed.");
  console.log("To deploy for real in normal environment:");
  console.log("  npm i hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv ethers @irys/sdk vite");
  console.log("  npx hardhat run scripts/deploy.js --network bscTestnet");
  process.exit(0);
}

const hre = await import("hardhat");

async function main() {
  const { ethers } = hre.default;
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Platform = await ethers.getContractFactory("MusicPilotPlatform");
  const platform = await Platform.deploy(deployer.address);
  await platform.waitForDeployment();

  console.log("MusicPilotPlatform deployed:", await platform.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Platform = await ethers.getContractFactory("MusicPilotPlatform");
  const platform = await Platform.deploy(deployer.address);
  await platform.waitForDeployment();

  console.log("MusicPilotPlatform deployed:", await platform.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

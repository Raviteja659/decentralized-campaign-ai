const hre = require("hardhat");

async function main() {
  const MarketingPlatform = await hre.ethers.getContractFactory(
    "MarketingPlatform"
  );
  console.log("Deploying MarketingPlatform...");
  const marketingPlatform = await MarketingPlatform.deploy();

  console.log(
    "MarketingPlatform deployed to:",
    await marketingPlatform.getAddress()
  );

  // Wait for a few block confirmations
  await marketingPlatform.waitForDeployment();
  console.log("Contract deployment confirmed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

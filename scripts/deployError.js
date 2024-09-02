const { ethers } = require("hardhat");

async function main() {
  const Error = await ethers.getContractFactory("Error");
  const error = await Error.deploy();

  await error.deployed();

  console.log("Error deployed to:", error.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    holesky: {
      url: process.env.HOLESKY_RPC,
      accounts: [process.env.PRIVATE_KEY],
    },
    localReth: {
      url: process.env.LOCAL_RETH_URL,
      accounts: [process.env.LOCAL_RETH_PRIVATE_KEY],
    },
    cfx8889: {
      url: process.env.CFX_8889_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};

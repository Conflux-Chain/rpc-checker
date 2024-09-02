const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ErrorModule", (m) => {
  const lock = m.contract("Error");
  return { lock };
});

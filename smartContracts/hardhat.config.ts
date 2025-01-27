import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-truffle5";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@solarity/hardhat-migrate";
import "@nomicfoundation/hardhat-chai-matchers";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";

import * as dotenv from "dotenv";

dotenv.config();

function privateKey() {
  return process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
}

const config: HardhatUserConfig = {
  networks: {
    hardhat: {},
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
      timeout: 0,
    },
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: privateKey(),
      gasMultiplier: 1.2,
      timeout: 0,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 11155111,
      accounts: privateKey(),
      gasMultiplier: 1.2,
      timeout: 0,
    },
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: privateKey(),
      gasMultiplier: 1.2,
      timeout: 0,
    },
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
        },
      },
      viaIR: true,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: `${process.env.ETHERSCAN_API_KEY}`,
      sepolia: `${process.env.ETHERSCAN_API_KEY}`,
      arbitrumSepolia: `${process.env.ARBISCAN_API_KEY}`,
      arbitrumOne: `${process.env.ARBISCAN_API_KEY}`,
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
    ],
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  migrate: {
    pathToMigrations: "./deploy/",
  },
  typechain: {
    target: "ethers-v5",
    alwaysGenerateOverloads: true,
    discriminateTypes: true,
    dontOverrideCompile: false,
  },
};

export default config;

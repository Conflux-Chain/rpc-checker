const { expect } = require("chai");
const RpcClient = require("../utils/RpcClient");
const { Wallet, parseUnits } = require("ethers");
require("dotenv").config();

const rpcClient = new RpcClient(process.env.CFX_8889_URL);

describe("SendTxError", function () {
    async function getAccount() {
        // const [owner] = await ethers.getSigners();
        const owner = new Wallet(process.env.PRIVATE_KEY, ethers.provider);
        return { owner };
    }

    describe("nonce issue", function() {
        it("nonce too low", async function () {
            const { owner } = await getAccount();
            
            const tx = {
                type: 0,
                nonce: 0,
                gasPrice: parseUnits("20", "gwei"),
                gasLimit: 21000,
                to: owner.address,
                value: 1,
                data: "0x",
                chainId: 8889
            };
            const fullTx = await owner.populateTransaction(tx);
            let rawTx = await owner.signTransaction(fullTx);
            let res = await rpcClient.send("eth_sendRawTransaction", [rawTx]);
            expect(res.error.code).to.equal(-32003);
            expect(res.error.message).to.equal('nonce too low');
        });

        it("nonce too high", async function () {
            const { owner } = await getAccount();
            const nonce = await ethers.provider.getTransactionCount(owner.address);
            
            const tx = {
                type: 0,
                nonce: nonce + 5000, // 5000 bigger than the current nonce will cause this error
                gasPrice: parseUnits("20", "gwei"),
                gasLimit: 21000,
                to: owner.address,
                value: 1,
                data: "0x",
                chainId: 8889
            };
            const fullTx = await owner.populateTransaction(tx);
            let rawTx = await owner.signTransaction(fullTx);
            let res = await rpcClient.send("eth_sendRawTransaction", [rawTx]);
            expect(res.error.code).to.equal(-32003);
            expect(res.error.message).to.equal('nonce too high');
        });

        it("same nonce(same price)", async function () {
            const { owner } = await getAccount();
            const nonce = await ethers.provider.getTransactionCount(owner.address);
            const tx = {
                type: 0,
                nonce: nonce + 10, // 5000 bigger than the current nonce
                gasPrice: parseUnits("20", "gwei"),
                gasLimit: 21000,
                to: owner.address,
                value: 1,
                data: "0x",
                chainId: 8889
            };
            const fullTx = await owner.populateTransaction(tx);
            expect(fullTx.type).to.equal(0);
            let rawTx = await owner.signTransaction(fullTx);
            // repeat run this test case will cause this rpc call failed too
            let hash = await rpcClient.send("eth_sendRawTransaction", [rawTx]);
            let res = await rpcClient.send("eth_sendRawTransaction", [rawTx]);
            expect(res.error.code).to.equal(-32603);
            expect(res.error.message).to.equal('replacement transaction underpriced');
        });
    });

    describe("gas issue", function() {
        it('gas too low', async function() {
            const { owner } = await getAccount();
            
            const tx = {
                type: 0,
                gasPrice: parseUnits("20", "gwei"),
                gasLimit: 21000 - 1,
                to: owner.address,
                value: 1,
                data: "0x",
                chainId: 8889
            };
            const fullTx = await owner.populateTransaction(tx);
            let rawTx = await owner.signTransaction(fullTx);
            let res = await rpcClient.send("eth_sendRawTransaction", [rawTx]);
            expect(res.error.code).to.equal(-32000);
            expect(res.error.message).to.equal('intrinsic gas too low');
        });

        it('gas too big', async function() {
            const { owner } = await getAccount();
            
            const tx = {
                type: 0,
                gasPrice: parseUnits("20", "gwei"),
                gasLimit: 20000000,  // espace max tx gas limit is 15,000,000
                to: owner.address,
                value: 1,
                data: "0x",
                chainId: 8889
            };
            const fullTx = await owner.populateTransaction(tx);
            let rawTx = await owner.signTransaction(fullTx);
            let res = await rpcClient.send("eth_sendRawTransaction", [rawTx]);
            expect(res.error.code).to.equal(-32603);
            expect(res.error.message).to.equal('exceeds block gas limit');
        });
    });

    describe("gasPrice issue", function() {
        it('gasPrice too low', async function() {
            const { owner } = await getAccount();
            
            const tx = {
                type: 0,
                gasPrice: 1, // min gas price is 20 gwei
                gasLimit: 21000,
                to: owner.address,
                value: 1,
                data: "0x",
                chainId: 8889
            };
            const fullTx = await owner.populateTransaction(tx);
            let rawTx = await owner.signTransaction(fullTx);
            let res = await rpcClient.send("eth_sendRawTransaction", [rawTx]);
            expect(res.error.code).to.equal(-32603);
            expect(res.error.message).to.equal('transaction underpriced');
        });
    });

    describe("maxFeePerGas&maxPriorityFeePerGas issue", function() {
        /* it('priority fee is bigger than max fee', async function() {
            const { owner } = await getAccount();

            const tx = {
                type: 2,
                gasLimit: 21000,
                // gasPrice: parseUnits("20", "gwei"),
                maxFeePerGas: parseUnits("1", "gwei"),
                // maxPriorityFeePerGas: parseUnits("21", "gwei"),
                to: owner.address,
                value: 1,
                data: "0x",
                chainId: 8889
            };
            const fullTx = await owner.populateTransaction(tx);
            console.log(fullTx);
            let rawTx = await owner.signTransaction(fullTx);
            let res = await rpcClient.send("eth_sendRawTransaction", [rawTx]);
            expect(res.error.code).to.equal(-32003);
            expect(res.error.message).to.equal('insufficient funds for transfer');
        }); */
    });

    describe("balance issue", function() {
        it('balance not enough for value + gasFee', async function() {
            const { owner } = await getAccount();

            const balance = await ethers.provider.getBalance(owner.address);
            
            const tx = {
                type: 0,
                gasLimit: 21000,
                gasPrice: parseUnits("20", "gwei"),
                to: owner.address,
                value: balance,
                data: "0x",
                chainId: 8889
            };
            const fullTx = await owner.populateTransaction(tx);
            let rawTx = await owner.signTransaction(fullTx);
            let res = await rpcClient.send("eth_sendRawTransaction", [rawTx]);
            expect(res.error.code).to.equal(-32003);
            expect(res.error.message).to.equal('insufficient funds for transfer');
        });

        it('balance not enough for value', async function() {
            const { owner } = await getAccount();

            const balance = await ethers.provider.getBalance(owner.address);
            
            const tx = {
                type: 0,
                gasLimit: 21000,
                gasPrice: parseUnits("20", "gwei"),
                to: owner.address,
                value: balance + 100n,
                data: "0x",
                chainId: 8889
            };
            const fullTx = await owner.populateTransaction(tx);
            let rawTx = await owner.signTransaction(fullTx);
            let res = await rpcClient.send("eth_sendRawTransaction", [rawTx]);
            expect(res.error.code).to.equal(-32003);
            expect(res.error.message).to.equal('insufficient funds for transfer');
        });
    });

    describe("chainId issue", function() {
        it('chainId mismatch', async function() {
            const { owner } = await getAccount();
            
            const tx = {
                type: 0,
                gasLimit: 21000,
                gasPrice: parseUnits("20", "gwei"),
                to: owner.address,
                value: 1,
                data: "0x",
                chainId: 88890
            };
            // const fullTx = await owner.populateTransaction(tx);
            let rawTx = await owner.signTransaction(tx);
            let res = await rpcClient.send("eth_sendRawTransaction", [rawTx]);
            expect(res.error.code).to.equal(-32000);
            expect(res.error.message).to.equal('invalid chain ID');
        });
    });

    describe("to issue", function() {
        // todo
    });

    describe("input issue", function() {
        // todo
    });
});
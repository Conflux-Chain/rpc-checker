const { expect } = require("chai");
const RpcClient = require("../utils/RpcClient");
require("dotenv").config();

// deployed on chain 17000(holesky)
// const ErrorAddress = "0xED5Db3A47220DAa6c48e8c99868a02E3CCFe013a";
// const rpcClient = new RpcClient(process.env.HOLESKY_RPC);

const ErrorAddress = "0xb4B46bdAA835F8E4b4d8e208B6559cD267851051";
const rpcClient = new RpcClient(process.env.LOCAL_RETH_URL);

describe("RevertCustomError", function () {
    async function getErrorContract() {
        const [owner, otherAccount] = await ethers.getSigners();
        const Error = await ethers.getContractAt("Error", ErrorAddress);
        const error = await Error.attach(ErrorAddress);
        return { error, owner };
    }

  describe("Revert String", function() {
    /**
        {
            code: 3,
            data: '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001d496e707574206d7573742062652067726561746572207468616e203130000000',
            message: 'execution reverted: Input must be greater than 10'
        }
    */
    it("Require should revert with a string", async function () {
        const { error } = await getErrorContract();
        let data = await error.testRequire.populateTransaction(1);
        let res = await rpcClient.send("eth_call", [data]);
        let errorData = '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001d496e707574206d7573742062652067726561746572207468616e203130000000';
        let errorMsg = 'execution reverted: revert: Input must be greater than 10';
        // console.log(res.error);
        expect(res.error.code).to.equal(3);
        expect(res.error.data).to.equal(errorData);
        expect(res.error.message).to.equal(errorMsg);

        let res1 = await rpcClient.send("eth_estimateGas", [data]);
        // console.log(res1.error);
        expect(res1.error.code).to.equal(3);
        expect(res1.error.data).to.equal(errorData);
        expect(res1.error.message).to.equal(errorMsg);
    });

    it("Revert should revert with a string", async function () {
        const { error } = await getErrorContract();
        let data = await error.testRevert.populateTransaction(1);
        let res = await rpcClient.send("eth_call", [data]);
        // console.log(res.error);
        expect(res.error.code).to.equal(3);
        expect(res.error.data).to.equal('0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001d496e707574206d7573742062652067726561746572207468616e203130000000');
        expect(res.error.message).to.equal('execution reverted: revert: Input must be greater than 10');
    });
  })

  /*
    {
        code: 3,
        data: '0xcf47918100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
        message: 'execution reverted'
    }
   */
  describe("Revert Custom Error", function() {
    it("Should revert with a custom error", async function () {
        const { error } = await getErrorContract();
        let data = await error.testCustomError.populateTransaction(1);
        let res = await rpcClient.send("eth_call", [data]);
        // console.log(res.error);
        expect(res.error.code).to.equal(3);
        expect(res.error.data).to.equal('0xcf47918100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001');
        expect(res.error.message).to.equal('execution reverted');

        // Decode the custom error
        const errorInterface = new ethers.Interface(["error InsufficientBalance(uint256 balance, uint256 withdrawAmount)"]);
        const decodedError = errorInterface.parseError(res.error.data);
        // console.log(decodedError);
        
        expect(decodedError.name).to.equal('InsufficientBalance');
        expect(decodedError.args[0]).to.equal(0n); 
        expect(decodedError.args[1]).to.equal(1n);

        // let res1 = await rpcClient.send("eth_estimateGas", [data]);
        // console.log(res1);
    });
  })
});


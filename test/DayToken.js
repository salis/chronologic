'use strict';

const assertJump = require('./helpers/assertJump');
const timer = require('./helpers/timer');
var Token = artifacts.require("./helpers/DayTokenMock.sol");
contract('DayTokenMock', function(accounts) {


    function etherInWei(x) {
        return web3.toBigNumber(web3.toWei(x, 'ether')).toNumber();
    }


    function tokenPriceInWeiFromTokensPerEther(x) {
        if (x == 0) return 0;
        return Math.floor(web3.toWei(1, 'ether') / x);
    }

    function tokenInSmallestUnit(tokens, _tokenDecimals) {
        return Math.floor(tokens * Math.pow(10, _tokenDecimals));
    }

    function getUnixTimestamp(timestamp) {
        var startTimestamp = new Date(timestamp);
        return Math.floor(startTimestamp.getTime() / 1000);
    }
    var _dayInSec = 84600;
    var _tokenName = "Day";
    var _tokenSymbol = "DAY";
    var _tokenDecimals = 8;
    var _tokenInitialSupply = 0;
    var _tokenMintable = true;
    var decimals = _tokenDecimals;
    var _maxAddresses = 3333;
    var _minMintingPower = 5000000000000000000;
    var _maxMintingPower = 10000000000000000000;
    var _halvingCycle = 88;
    var _initalBlockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    var _mintingDec = 19;
    var _bounty = 100000000;
    var _minBalanceToSell = 8800000000;
    var _teamLockPeriodInSec = 15780000;
    var tokenInstance = null;
    var i;
    var id;
    var call;
    beforeEach(async() => {
        tokenInstance = await Token.new(_tokenName, _tokenSymbol, _tokenInitialSupply, _tokenDecimals, _tokenMintable, _maxAddresses, _minMintingPower, _maxMintingPower, _halvingCycle, _initalBlockTimestamp, _mintingDec, _bounty, _minBalanceToSell, 84600, _teamLockPeriodInSec, { from: accounts[0] });
        for (i = 1; i <= 15; i++) {
            id = await tokenInstance.addContributorNew(accounts[i], 79200000000);
        }
    });

    it('Creation: should return the correct totalSupply after construction', async function() {
        let totalSupply = (await tokenInstance.totalSupply()).valueOf();
        assert.equal(totalSupply, 15 * tokenInSmallestUnit(792, _tokenDecimals));
    });

    it('Creation: should return the correct balance of admin after construction', async function() {
        let adminBalance = await tokenInstance.balanceOfWithoutUpdate.call(accounts[0]);
        assert.equal(adminBalance, _tokenInitialSupply);
    });

    it('Creation: should return correct token meta information', async function() {

        let name = await tokenInstance.name.call();
        assert.strictEqual(name, _tokenName, "Name value is not as expected.");

        let decimal = await tokenInstance.decimals.call();
        assert.strictEqual(decimal.toNumber(), _tokenDecimals, "Decimals value is not as expected");

        let symbol = await tokenInstance.symbol.call();
        assert.strictEqual(symbol, _tokenSymbol, "Symbol value is not as expected");
    });

    it('Transfer: ether transfer to token address should fail.', async function() {
        try {
            await web3.eth.sendTransaction({ from: accounts[0], to: tokenInstance.address, value: web3.toWei("10", "Ether") });
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown exception before');
    });

    it('Transfer: should return correct balances in receiver account after transfer', async function() {
        let balance0_old = (await tokenInstance.balanceOf.call(accounts[1])).valueOf();
        assert.equal(balance0_old, 79200000000);

        let balance1_old = (await tokenInstance.balanceOf.call(accounts[2])).valueOf();

        assert.equal(balance1_old, 79200000000);

        let call = await tokenInstance.transfer(accounts[2], 79200000000, { from: accounts[1] });

        let balance0_new = (await tokenInstance.balanceOf.call(accounts[1])).valueOf();
        assert.equal(balance0_new, 0);

        let balance1_new = (await tokenInstance.balanceOf.call(accounts[2])).valueOf();
        assert.equal(balance1_new, 79200000000);
    });

    it('Transfer: should throw an error when trying to transfer more than balance', async function() {
        try {
            await tokenInstance.transfer(accounts[1], 101000000 * Math.pow(10, decimals));
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

    it('Transfer: should throw an error when trying to transfer 0 balance', async function() {
        try {
            await tokenInstance.transfer(accounts[1], 0);
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

    it('Transfer: should throw an error when trying to transfer to himself', async function() {
        try {
            await tokenInstance.transfer(accounts[0], 100000000 * Math.pow(10, decimals));
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

    it('Transfer: should throw an error since the token is not released', async function() {
        try {
            await tokenInstance.transfer(accounts[1], 100000000 * Math.pow(10, decimals));
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

    it('Transfer: should throw an error when trying to transfer more than allowed', async function() {
        await tokenInstance.approve(accounts[1], 99 * Math.pow(10, decimals));
        try {
            await tokenInstance.transferFrom(accounts[0], accounts[2], 100 * Math.pow(10, decimals), { from: accounts[1] });
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

    it('Approval: should return the correct allowance amount after approval', async function() {
        await tokenInstance.approve(accounts[1], 100 * Math.pow(10, decimals));
        let allowance = await tokenInstance.allowance(accounts[0], accounts[1]);

        assert.equal(allowance, 100 * Math.pow(10, decimals));
    });

    it('Approval: attempt withdrawal from acconut with no allowance (should fail)', async function() {
        try {
            await tokenInstance.transferFrom(accounts[0], accounts[2], 100 * Math.pow(10, decimals), { from: accounts[1] });
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

    it('Balance: Should return correct phase count', async function() {
        let phase = await tokenInstance.getPhaseCount(0);
        assert.equal(phase, 1);
        let phase1 = await tokenInstance.getPhaseCount(1056);
        assert.equal(phase1, 13);
        let phase2 = await tokenInstance.getPhaseCount(1935);
        assert.equal(phase2, 22);
        let phase3 = await tokenInstance.getPhaseCount(2270);
        assert.equal(phase3, 26);
        let phase4 = await tokenInstance.getPhaseCount(8986);
        assert.equal(phase4, 103);
    });

    it('Balance: Should return correct day count', async function() {
        let day = (await tokenInstance.getDayCount()).valueOf();

    });

    it('Balance: Should return correct Minting Power by Address', async function() {
        _initalBlockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

        await timer((_dayInSec * 2) - 1);
        await web3.eth.sendTransaction({ from: accounts[20], to: accounts[21], value: web3.toWei(0.000000000000000005, "ether") });

        let MintingPower0 = (await tokenInstance.getMintingPowerByAddress(accounts[2])).valueOf();
        assert.equal(MintingPower0, 9998499399759903962);
        let MintingPower1 = (await tokenInstance.getMintingPowerByAddress(accounts[1])).valueOf();
        assert.equal(MintingPower1, 10000000000000000000);
        let MintingPower2 = (await tokenInstance.getMintingPowerByAddress(accounts[14])).valueOf();
        assert.equal(MintingPower2, 9980492196878751501);
    });

    it('Balance: Should return correct Minting Power by ID', async function() {
        _initalBlockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

        await timer((_dayInSec * 2) - 1);
        await web3.eth.sendTransaction({ from: accounts[20], to: accounts[21], value: web3.toWei(0.000000000000000005, "ether") });
        let MintingPower1 = (await tokenInstance.getMintingPowerById(1)).valueOf();
        assert.equal(MintingPower1, 10000000000000000000);
        let MintingPower2 = (await tokenInstance.getMintingPowerById(14)).valueOf();
        assert.equal(MintingPower2, 9980492196878751501);
    });

    it('Creation: Should calculate proper minting power', async function() {
        let mintingPower = (await tokenInstance.getMintingPowerById(2)).valueOf();
        assert.equal(mintingPower, 9998499399759903962);
    });

    it('Balance: Should return correct Balance by address', async function() {
        _initalBlockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

        await timer((_dayInSec * 88) - 1);
        await web3.eth.sendTransaction({ from: accounts[20], to: accounts[21], value: web3.toWei(0.000000000000000005, "ether") });
        let balance2 = (await tokenInstance.balanceOf.call(accounts[14])).valueOf();
        assert.equal(balance2, 190739419273);

        await timer((_dayInSec * 1) - 1);
        await web3.eth.sendTransaction({ from: accounts[20], to: accounts[21], value: web3.toWei(0.000000000000000005, "ether") });
        let balance3 = (await tokenInstance.balanceOf.call(accounts[2])).valueOf();
        assert.equal(balance3, 191995705144);

    });

    it('Balance: Should Update all balances and provide bounty to caller', async function() { // Commented line 327. as balance for this is not minted and daytoken is not a minting agent so can't mint. safeSub is throwing error. 
        _initalBlockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

        await tokenInstance.setBalance(tokenInstance.address, tokenInSmallestUnit(792, _tokenDecimals));

        await timer((_dayInSec * 2) - 1);
        await web3.eth.sendTransaction({ from: accounts[20], to: accounts[21], value: web3.toWei(0.000000000000000005, "ether") });
        let call1 = (await tokenInstance.updateAllBalances({ from: accounts[0] }));

        let balance1 = (await tokenInstance.balanceOf.call(accounts[14])).valueOf();

        assert.isAtMost(79990454981 - balance1, 10);
        let bounty = (await tokenInstance.balanceOf.call(accounts[0])).valueOf();
        assert.equal(bounty, 100000000);
        let balance2 = (await tokenInstance.balanceOf.call(accounts[10])).valueOf();
        assert.isAtMost(79990930372 - balance2, 10);
        await timer((_dayInSec * 1) - 1);
        await web3.eth.sendTransaction({ from: accounts[20], to: accounts[21], value: web3.toWei(0.000000000000000005, "ether") });
        let call2 = (await tokenInstance.updateAllBalances({ from: accounts[0] }));
        let balance11 = (await tokenInstance.balanceOf.call(accounts[14])).valueOf();
        assert.isAtMost(80788799092 - balance11, 10);
        let bounty1 = (await tokenInstance.balanceOf.call(accounts[0])).valueOf();
        assert.equal(bounty1, 200000000);
        let balance21 = (await tokenInstance.balanceOf.call(accounts[10])).valueOf();
        assert.isAtMost(80789759366 - balance21, 10);
        console.log(await tokenInstance.balanceOf.call(tokenInstance.address).valueOf());
    });
    it('Balance: should throw an error when trying to update all balances multiple times on same day', async function() { // SAME AS ABOVE
        _initalBlockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        await tokenInstance.setBalance(tokenInstance.address, tokenInSmallestUnit(792, _tokenDecimals));
        await timer((_dayInSec * 2) - 1);
        await web3.eth.sendTransaction({ from: accounts[20], to: accounts[21], value: web3.toWei(0.000000000000000005, "ether") });
        let call1 = (await tokenInstance.updateAllBalances());
        try {
            await tokenInstance.updateAllBalances();

        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });
    it('Transfer Address: Should let people put their minting address on sale with required amount transferred', async function() {
        _initalBlockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        var _initialBlockNumber = web3.eth.blockNumber;
        let balance1 = (await tokenInstance.balanceOf.call(accounts[1])).valueOf();
        let call = (await tokenInstance.sellMintingAddress(20, _initialBlockNumber + 10000, { from: accounts[1] })).valueOf();
        assert.equal((await tokenInstance.balanceOf.call(accounts[1])).valueOf(), balance1 - 8800000000);
        assert.equal((await tokenInstance.balanceOf.call(tokenInstance.address)).valueOf(), 8800000000);
        try {
            (await tokenInstance.sellMintingAddress(20, 100, { from: accounts[1] })).valueOf();

        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });
    it('Transfer Address: Should let people buy a minting address on sale with required min amount', async function() {
        _initalBlockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        var _initialBlockNumber = web3.eth.blockNumber;

        await tokenInstance.setBalance(accounts[16], tokenInSmallestUnit(792, _tokenDecimals));
        assert.equal(await tokenInstance.balanceOf.call(accounts[16]), 79200000000);

        let call = (await tokenInstance.sellMintingAddress(tokenInSmallestUnit(20, _tokenDecimals), 100000, { from: accounts[11] })).valueOf();

        let call1 = (await tokenInstance.buyMintingAddress(11, tokenInSmallestUnit(20, _tokenDecimals), { from: accounts[16] }));

        assert.equal((await tokenInstance.balanceOf.call(accounts[16])), tokenInSmallestUnit(792, _tokenDecimals) - tokenInSmallestUnit(20, _tokenDecimals));

        assert.equal((await tokenInstance.balanceOf.call(tokenInstance.address)).valueOf(), tokenInSmallestUnit(88, _tokenDecimals) + tokenInSmallestUnit(20, _tokenDecimals));
        try {
            (await tokenInstance.buyMintingAddress(1, tokenInSmallestUnit(20, _tokenDecimals), { from: accounts[20] }));

        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

    it('Transfer Address: Should let seller get sale proceeds', async function() {
        _initalBlockTimestamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        var _initialBlockNumber = web3.eth.blockNumber;

        await tokenInstance.setBalance(accounts[16], tokenInSmallestUnit(792, _tokenDecimals));

        let call = (await tokenInstance.sellMintingAddress(tokenInSmallestUnit(20, _tokenDecimals), 100000, { from: accounts[11] })).valueOf();

        let call1 = (await tokenInstance.buyMintingAddress(11, tokenInSmallestUnit(20, _tokenDecimals), { from: accounts[16] }));

        let call3 = (await tokenInstance.fetchSuccessfulSaleProceed({ from: accounts[11] })).valueOf();

        assert.equal((await tokenInstance.balanceOf.call(tokenInstance.address)).valueOf(), 0);
        assert.equal((await tokenInstance.balanceOf.call(accounts[11])).valueOf(), 81200000000);

    });
    it('Transfer Address: Should let seller get refunds if no-one buys', async function() {
        let balance1 = (await tokenInstance.balanceOf.call(accounts[1])).valueOf();
        let call = (await tokenInstance.sellMintingAddress(tokenInSmallestUnit(20, _tokenDecimals), 400, { from: accounts[1] })).valueOf();

        let call3 = (await tokenInstance.refundFailedAuctionAmount({ from: accounts[1] })).valueOf();
        assert.equal((await tokenInstance.balanceOf.call(tokenInstance.address)).valueOf(), 0);
        assert.equal((await tokenInstance.balanceOf.call(accounts[1])).valueOf(), 79200000000);
    });
});
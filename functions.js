import { RpcProvider, constants, num, stark, hash, CallData, Provider, Contract, Account, ec, json, cairo, getChecksumAddress, shortString, SequencerProvider} from "starknet";
import fs from "fs";
import config from "./config.json" assert { type: "json" };
import abi from "./abi.json" assert { type: "json"};
import { getArgentAddress, generateRandomEmail, getRandomNumber, hashString, encoder, removeLeadingZeroes, delay, getRandomDelay, getAllBalance, amountConsole, gasPriceL1, getAllLPBalance, gasPriceL2, getzkLendbalance} from "./helper.js";
import {fetchQuotes, executeSwap} from "@avnu/avnu-sdk";
import { ethers } from "ethers";
import _ from "lodash"
import {general} from "./settings.js"; 



export async function starkgateBridge(evmKey, starkKey, procentMin, procentMax){

    let gwei = await gasPriceL1();
    if(general.gweiL1 < gwei){
        do{
            gwei = await gasPriceL1()
            console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
            await delay(15000);
    } while(general.gwei < gwei)
}
    
    const provider = new ethers.JsonRpcProvider(general.provider);
    const wallet = new ethers.Wallet(evmKey, provider);
    const starkgateContract = new ethers.Contract(config.starkgate.address, abi.starkgate, provider);
    const balance = await provider.getBalance(wallet.address);
    const procent = getRandomNumber(procentMin, procentMax);
    const amountProcent = BigInt(balance*(BigInt(procent))/(100n));

    const starkAddress = await getArgentAddress(starkKey);
    const starkAddressBN = BigInt(starkAddress)
    const gasPrice = (await provider.getFeeData()).gasPrice;

    const starkProvider = new SequencerProvider({
        baseUrl: 'https://alpha-mainnet.starknet.io/',
        feederGatewayUrl: 'feeder_gateway',
        gatewayUrl: 'gateway',
    });
  
  let res = await starkProvider.estimateMessageFee({
        from_address: '0xae0ee0a63a2ce6baeeffe56e7714fb4efe48d419',
        to_address: '0x073314940630fd6dcda0d772d4c972c4e0a9946bef9dabf4ef84eda8ef542b82',
        entry_point_selector: 'handle_deposit',
        payload: [starkAddress, amountProcent, '0']
    })
  const starkFee = BigInt(res.overall_fee)  
  //const data = await starkgateContract.connect(wallet).deposit.populateTransaction(amountProcent, starkAddressBN, { value: amountProcent + starkFee, gasPrice: gasPrice});
  //const randomNumber = BigInt(getRandomNumber(0.0003, 0.0004));
    const gasEstimate = await starkgateContract.deposit.estimateGas(
        amountProcent,
        starkAddressBN,
        {
            value: amountProcent + starkFee,
            gasPrice: gasPrice*103n/100n
        }
        );
    const tx = await starkgateContract.connect(wallet).deposit(
        amountProcent, 
        starkAddressBN,
            {
                gasLimit: gasEstimate*150n/100n,
                gasPrice: gasPrice*103n/100n,
                value: amountProcent + starkFee,
            }
    )
    const receipt = await tx.wait();

    console.log(tx.hash)
    console.log(`Deposited ${ethers.formatUnits(amountProcent, "ether")} ETH to ${starkAddress} from EVM ${wallet.address}`);

}


export async function jediswapSwap(key, tokenIn, tokenOut, procent){

        let gwei = await gasPriceL2();
        if(general.gwei < gwei){
            do{
                gwei = await gasPriceL2()
                console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
                await delay(15000);
        } while(general.gwei < gwei)
    }
        
        const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
        const accountAddress = await getArgentAddress(key);
        const account = new Account(provider, accountAddress, key, "1");
        const tokenInContract = new Contract(abi.erc20token, config.tokens[tokenIn], provider);
        const balance = await tokenInContract.balanceOf(accountAddress);
        const jediswapContract = new Contract(abi.jediswapRouter, config.jediswap.routerAddress, provider);
        const pair = tokenIn+tokenOut;
        const poolContract = new Contract(abi.jediswapPairsPool, config.jediswap.pairsPool[pair], provider);
        const {address: token0} = await poolContract.token0();
        const reserves = await poolContract.get_reserves();
        const amount = cairo.uint256((balance.balance.low) * BigInt(procent) / 100n);
        console.log(`Making swap ${pair} on jediswap, amount is ${(amountConsole(tokenIn, amount))} ${tokenIn} `);

        let reserveIn, reserveOut;
        if (num.toHex(token0).toLowerCase() === num.toHex(config.tokens[tokenIn]).toLowerCase()) {
            reserveIn = reserves.reserve0.low;
            reserveOut = reserves.reserve1.low;
        } else {
            reserveIn = reserves.reserve1.low;
            reserveOut = reserves.reserve0.low;
        }
        const amountOut = await jediswapContract.get_amount_out(amount, cairo.uint256(reserveIn), cairo.uint256(reserveOut));
        const amountOutMin = cairo.uint256(amountOut.amountOut.low * 97n / 100n);
        const timestamp = Math.floor((Date.now() / 1000))+(60*60);

        const approveCall = tokenInContract.populate("approve", [config.jediswap.routerAddress, amount]);
        const swapCall = jediswapContract.populate("swap_exact_tokens_for_tokens", 
        [
            amount,
            amountOutMin,
            [config.tokens[tokenIn], config.tokens[tokenOut]], 
            accountAddress,
            timestamp
    ]);
        const tx = await account.execute([approveCall, swapCall]);
        console.log(tx.transaction_hash);
        const transaction_receipt = await provider.waitForTransaction(tx.transaction_hash);
        let delayAfterTX = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
        await delay(delayAfterTX);
        

        console.log(`Swap done✅`)
   
    
};


export async function myswapSwap(key, tokenIn, tokenOut, procent){
    

        let gwei = await gasPriceL2();
        if(general.gwei < gwei){
            do{
                gwei = await gasPriceL2()
                console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
                await delay(15000);
        } while(general.gwei < gwei)
    }

    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const accountAddress = await getArgentAddress(key);
    const account = new Account(provider, accountAddress, key, "1");

    const tokenInContract = new Contract(abi.erc20token, config.tokens[tokenIn], provider);
    const balance = await tokenInContract.balanceOf(accountAddress);
    const myswapContract = new Contract(abi.myswapRouter, config.myswap.routerAddress, provider);
    const pair = tokenIn+tokenOut;
    const poolInfo = await myswapContract.get_pool(config.myswap.poolId[pair]);
    const token0 = poolInfo.pool.token_a_address;
    const reserves = [poolInfo.pool.token_a_reserves.low, poolInfo.pool.token_b_reserves.low];

    const amount = cairo.uint256((balance.balance.low) * BigInt(procent) / 100n);
    console.log(`Making swap ${pair} on myswap, amount is ${(amountConsole(tokenIn, amount))} ${tokenIn} `);

    let reserveIn, reserveOut;
    if (num.toHex(token0).toLowerCase() === num.toHex(config.tokens[tokenIn]).toLowerCase()) {
        reserveIn = reserves[0];
        reserveOut = reserves[1];
    } else {
        reserveIn = reserves[1];
        reserveOut = reserves[0];
    }
    const fee = BigInt(parseFloat(poolInfo.pool.fee_percentage) / 100);
    const divider = BigInt(1000);
    const scale = 1_000_000;

    const maxDstAmount = ((BigInt(amount.low) * reserveOut) / (reserveIn + BigInt(amount.low)));
    const maxDstAmountFee = maxDstAmount - ((maxDstAmount * fee) / divider);
    const amountOutMin = cairo.uint256( maxDstAmountFee * 97n / 100n)
    //const amountOutMin = cairo.uint256((BigInt(amount.low) * 97n / 100n ) * (reserves[0] / reserves[1]));
    
    const approveCall = tokenInContract.populate("approve", [config.myswap.routerAddress, amount]);
    const swapCall = myswapContract.populate("swap", 
    [
        config.myswap.poolId[pair],
        config.tokens[tokenIn],
        amount,
        amountOutMin
    ]);

    const tx = await account.execute([approveCall, swapCall])
    console.log(tx.transaction_hash);
    const transaction_receipt = await provider.waitForTransaction(tx.transaction_hash);
    let delayAfterTX = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
    await delay(delayAfterTX);

    console.log(`Swap done✅`)


};



export async function kswapSwap(key, tokenIn, tokenOut, procent){
    try{

    let gwei = await gasPriceL2();
    if(general.gwei < gwei){
        do{
            gwei = await gasPriceL2()
            console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
            await delay(15000);
    } while(general.gwei < gwei)
}
     const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
     const accountAddress = await getArgentAddress(key);
     const account = new Account(provider, accountAddress, key, "1");

     const tokenInContract = new Contract(abi.erc20token, config.tokens[tokenIn], provider);
     const balance = await tokenInContract.balanceOf(accountAddress);
     const kswapContract = new Contract(abi.kswapRouter, config.kswap.routerAddress, provider);
     const pair = tokenIn+tokenOut;
     const poolContract = new Contract(abi.kswapPairsPool, config.kswap.pairsPool[pair], provider);
     const {token0: token0} = await poolContract.token0();
     const reserves = await poolContract.getReserves();
     const amount = cairo.uint256((balance.balance.low) * BigInt(procent) / 100n);
     console.log(`Making swap ${pair} on 10kswap, amount is ${(amountConsole(tokenIn, amount))} ${tokenIn} `);

     let reserveIn, reserveOut;
     if (num.toHex(token0).toLowerCase() === num.toHex(config.tokens[tokenIn]).toLowerCase()) {
        reserveIn = reserves.reserve0;
         reserveOut = reserves.reserve1;
     } else {
         reserveIn = reserves.reserve1;
         reserveOut = reserves.reserve0;
     }
     const amountOut = await kswapContract.getAmountOut(amount, reserveIn, reserveOut);
     const amountOutMin = cairo.uint256(amountOut.amountOut.low * 97n / 100n);
     const timestamp = Math.floor((Date.now() / 1000))+(60*60);
     const approveCall = tokenInContract.populate("approve", [config.kswap.routerAddress, amount]);
     const swapCall = kswapContract.populate("swapExactTokensForTokens", 
     [
         amount,
         amountOutMin,
         [config.tokens[tokenIn], config.tokens[tokenOut]], 
         accountAddress,
         timestamp
 ]);
     const tx = await account.execute([approveCall, swapCall]);
     console.log(tx.transaction_hash);
     const transaction_receipt = await provider.waitForTransaction(tx.transaction_hash);
     let delayAfterTX = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
     await delay(delayAfterTX);

     console.log(`Swap done✅`)

    }catch(e){
        console.log(`\x1b[31mОшибка ${e}\x1b[0m`);
    }

};


export async function avnuSwap(key, tokenIn, tokenOut, procent){

    let gwei = await gasPriceL2();
    if(general.gwei < gwei){
        do{
            gwei = await gasPriceL2()
            console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
            await delay(15000);
    } while(general.gwei < gwei)
}
    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const accountAddress = await getArgentAddress(key);
    const account = new Account(provider, accountAddress, key, "1");

    
    const tokenInContract = new Contract(abi.erc20token, config.tokens[tokenIn], provider);
    const balance = await tokenInContract.balanceOf(accountAddress);
    const avnuContract = new Contract(abi.avnuRouter, config.avnu.routerAddress, provider);
    const pair = tokenIn+tokenOut;
    
    const amount = cairo.uint256((balance.balance.low) * BigInt(procent) / 100n);
    console.log(`Making swap ${pair} on avnu, amount is ${(amountConsole(tokenIn, amount))} ${tokenIn} `);

    const AVNU_OPTIONS = { baseUrl: 'https://starknet.api.avnu.fi' };

    const params = {
        sellTokenAddress: config.tokens[tokenIn],
        buyTokenAddress: config.tokens[tokenOut],
        sellAmount: amount.low,
        takerAddress: accountAddress
      };

      
      const quotes = await fetchQuotes(params, AVNU_OPTIONS);

      const tx = await executeSwap(account, quotes[0], {slippage : 0.03}, AVNU_OPTIONS, );
      console.log(tx.transactionHash);
      const transaction_receipt = await provider.waitForTransaction(tx.transactionHash);
      let delayAfterTX = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
      await delay(delayAfterTX);

      console.log(`Swap done✅`)



}



export async function orbiterBridge(evmKey, starkKey, fromNetwork, procent){
    try{

    let gwei = await gasPriceL1();
    if(general.gweiL1 < gwei){
        do{
            gwei = await gasPriceL1()
            console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gweiL1}`);
            await delay(15000);
    } while(general.gwei < gwei)
}
    
    const provider = new ethers.JsonRpcProvider(general.providerARB);
    const wallet = new ethers.Wallet(evmKey, provider);
    const orbiterContract = new ethers.Contract(config.orbiter[fromNetwork], abi.orbiter, provider);
    const balance = await provider.getBalance(wallet.address);
    const amountProcent = balance*(BigInt(procent))/(100n);

    const starkAddress = await getArgentAddress(starkKey);
    const starkAddressWithout0x = starkAddress.slice(2);
    const starkByteAddress = '0x030'+starkAddressWithout0x;
    const gasPrice = (await provider.getFeeData()).gasPrice;
        
        if(ethers.parseEther('0.005') > amountProcent){
            console.error(`amount lower than 0.005 ETH`);
        } else {
        

    const gasEstimate = await orbiterContract.transfer.estimateGas(
        "0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8", 
        starkByteAddress,
        {value: amountProcent}
        );

    const amountWithoutGas = amountProcent - (gasPrice*gasEstimate);
    const amount = (amountWithoutGas.toString().slice(0, -5))+"09004";
    const tx = await orbiterContract.connect(wallet).transfer(
        "0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8", 
        starkByteAddress,
            {
                gasLimit: gasEstimate,
                gasPrice: gasPrice,
                value: amount,
            }
    )
    const receipt = await tx.wait();
    console.log(tx.hash);

    console.log(`deposited ${starkAddress} from EVM ${wallet.address}`);
        }
        }catch(e){
            await orbiterBridge();

        }

}


export async function argentWalletGenerate(){

    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    //new Argent X account v0.2.3
    const argentXproxyClassHash = "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
    const argentXaccountClassHash = "0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2";

    // Generate public and private key pair.
    const privateKeyAX = stark.randomAddress();
    const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);

    // Calculate future address of the ArgentX account
    const AXproxyConstructorCallData = CallData.compile({
        implementation: argentXaccountClassHash,
        selector: hash.getSelectorFromName("initialize"),
        calldata: CallData.compile({ signer: starkKeyPubAX, guardian: "0" }),
    });
    const AXcontractAddress = hash.calculateContractAddressFromHash(
        starkKeyPubAX,
        argentXproxyClassHash,
        AXproxyConstructorCallData,
        0
    );
    fs.appendFileSync('./info/generatedAW.txt', AXcontractAddress + '\n');
    fs.appendFileSync('./info/generatedStarkKeyPubAX.txt', starkKeyPubAX + '\n');
    fs.appendFileSync('./info/generatedPK.txt', privateKeyAX + '\n');

}

export async function argentDeploy(key){

    let gwei = await gasPriceL2();
    if(general.gwei < gwei){
        do{
            gwei = await gasPriceL2()
            console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
            await delay(15000);
    } while(general.gwei < gwei)
}

try{
    const accountAddress = await getArgentAddress(key); 
    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const account = new Account(provider, accountAddress, key, "1");
    const starkKeyPubAX = ec.starkCurve.getStarkKey(key);
    const accountAXsierra = json.parse(fs.readFileSync("./ArgentXaccount030.sierra.json").toString("ascii"));
    //const accountAXcasm = json.parse(fs.readFileSync("./ArgentXaccount030.casm.json").toString("ascii"));

    const contractAXclassHash = config.argent.argentXaccountClassHashNew;

    const calldataAX = new CallData(accountAXsierra.abi);
    const ConstructorAXCallData = calldataAX.compile("constructor", {
        owner: starkKeyPubAX,
        guardian: "0"
    });
    const accountAXAddress = hash.calculateContractAddressFromHash(starkKeyPubAX, contractAXclassHash, ConstructorAXCallData, 0);
    const accountAX = new Account(provider, accountAXAddress, key, "1"); // do not forget the "1" at the end
    const deployAccountPayload = {
        classHash: contractAXclassHash,
        constructorCalldata: ConstructorAXCallData,
        contractAddress: accountAXAddress,
        addressSalt: starkKeyPubAX
    };
    const { transaction_hash: AXdAth, contract_address: accountAXFinalAdress } = await accountAX.deployAccount(deployAccountPayload);
    await provider.waitForTransaction(AXdAth);

    console.log('✅ ArgentX wallet deployed at:', accountAXFinalAdress);
}catch(e){
    await argentDeploy(key);
}

}

export async function dmail(key){

    let gwei = await gasPriceL2();
    if(general.gwei < gwei){
        do{
            gwei = await gasPriceL2()
            console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
            await delay(15000);
    } while(general.gwei < gwei)
}
    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const accountAddress = await getArgentAddress(key);
    const account = new Account(provider, accountAddress, key, "1");

    /*
    const argentXproxyClassHash = "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
    const argentXaccountClassHash = "0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2";

     const starkKeyPubAX = ec.starkCurve.getStarkKey(key);

    const AXproxyConstructorCallData = CallData.compile({
        implementation: argentXaccountClassHash,
        selector: hash.getSelectorFromName("initialize"),
        calldata: CallData.compile({ signer: starkKeyPubAX, guardian: "0" }),
    });
    const AXcontractAddressNotReady = hash.calculateContractAddressFromHash(
        starkKeyPubAX,
        argentXproxyClassHash,
        AXproxyConstructorCallData,
        0
    ); 
    */

    const dmailContract = new Contract(abi.dmail, config.dmail.routerAddress, provider);
    //const email = await generateRandomEmail(4, 15);
    const email = await generateRandomEmail(4, 15);
    const hashemail = hashString(email);
    const encoded = ((encoder(`${hashemail}`))).substring(0, 65)
    const NewAddress = `${removeLeadingZeroes(accountAddress)}@dmail.ai`
    const NewAddressHash = hashString(NewAddress)
    const NewAddressEncoded = ((encoder(`${NewAddressHash}`))).substring(0, 65)
    console.log(`Sending email to ${email}`)
    const callData = dmailContract.populate("transaction", 
    [
        NewAddressEncoded,
        encoded
    ])
    const tx = await account.execute([callData]);
    console.log(tx.transaction_hash);
    const transaction_receipt = await provider.waitForTransaction(tx.transaction_hash);
    let delayAfterTX = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
    await delay(delayAfterTX);

    console.log(`Sending email done✅`)
};

export async function jediswapLP(key, procentMin, procentMax){
    let gwei = await gasPriceL2();
    if(general.gwei < gwei){
        do{
            gwei = await gasPriceL2()
            console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
            await delay(15000);
    } while(general.gwei < gwei)
}
    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const accountAddress = await getArgentAddress(key);
    const account = new Account(provider, accountAddress, key, "1");
   
    const tokenB = ["USDT", "WBTC", "USDC", "DAI"][Math.floor(Math.random() * 4)];
    const tokenA = "ETH";
    const pair = tokenA+tokenB;
    console.log(`Adding in jediSwap ${pair} LP `);
    const avnuprocent = getRandomNumber(40,60)
    await avnuSwap(key, tokenA, tokenB, avnuprocent);
    const jediswapContract = new Contract(abi.jediswapRouter, config.jediswap.routerAddress, provider);
    const jediswapLPcontract = new Contract(abi.jediswapPairsPool, config.jediswap.pairsPool[pair], provider);
    let reserves = await jediswapLPcontract.get_reserves();
    const tokenAContract = new Contract(abi.erc20token, config.tokens[tokenA], provider);
    const tokenBContract = new Contract(abi.erc20token, config.tokens[tokenB], provider);
    const procent = getRandomNumber(procentMin, procentMax);

    
    let reserveIn, reserveOut;
    reserveIn = reserves.reserve0.low;
    reserveOut = reserves.reserve1.low;
    const sort = await jediswapContract.sort_tokens(tokenAContract.address, tokenBContract.address);
    
    const balanceA = await tokenAContract.balanceOf(accountAddress);
    const desiredA = balanceA.balance.low * BigInt(procent) / 100n;
    const balanceB = await tokenBContract.balanceOf(accountAddress);
    //let quote;
    if(num.toHex(sort.token0) === num.toHex(config.tokens[tokenA])){
        reserveIn = reserves.reserve0.low;
        reserveOut = reserves.reserve1.low;
    } else{
        reserveIn = reserves.reserve1.low;
        reserveOut = reserves.reserve0.low;
    }
    
    const quote = await jediswapContract.quote(cairo.uint256(desiredA), cairo.uint256(reserveIn), cairo.uint256(reserveOut));
    console.log(`Making deposit in ${pair} on jediswap, amount is ${(amountConsole(tokenA, cairo.uint256(desiredA)))} ${tokenA} and ${(amountConsole(tokenB, cairo.uint256(quote.amountB.low)))}${tokenB}`);

    const callDataTokenAApprove = tokenAContract.populate("approve", [config.jediswap.routerAddress, cairo.uint256(desiredA)]);
    const callDataTokenBApprove = tokenBContract.populate("approve", [config.jediswap.routerAddress, cairo.uint256(quote.amountB.low)]);
    let timestamp = Math.floor((Date.now() / 1000))+(60*60);
    const callDataAddLP = jediswapContract.populate("add_liquidity", [
        tokenAContract.address,
        tokenBContract.address,
        cairo.uint256(desiredA),
        cairo.uint256(quote.amountB.low),
        cairo.uint256(desiredA*98n/100n),
        cairo.uint256(quote.amountB.low*98n/100n),
        accountAddress,
        timestamp
    ]);

    const tx = await account.execute([callDataTokenAApprove, callDataTokenBApprove, callDataAddLP]);
    console.log(tx.transaction_hash);
    const transaction_receipt = await provider.waitForTransaction(tx.transaction_hash);
    let delayAfterTX = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
    await delay(delayAfterTX);

    console.log(`Deposit done`)
    
}

export async function jediswapLPWithdrawAll(key){
    try{

    let gwei = await gasPriceL2();
    if(general.gwei < gwei){
        do{
            gwei = await gasPriceL2()
            console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
            await delay(15000);
    } while(general.gwei < gwei)
    }

    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const accountAddress = await getArgentAddress(key);
    const account = new Account(provider, accountAddress, key, "1");
    
    const allbalance = await getAllLPBalance(accountAddress);

    const tokensWithBalance = [];

    for (const token in allbalance) {
      const balance = allbalance[token];
      if (balance > 0) {
        tokensWithBalance.push(token);
      }
    }
    const pair = tokensWithBalance[0];
    console.log(`Withdrawing funds from ${pair} jediswap LP`)
    const lpToken = new Contract(abi.erc20token, config.jediswap.pairsPool[pair], provider);
    const lpBalance = await lpToken.balanceOf(accountAddress);
    const jediswapContract = new Contract(abi.jediswapRouter, config.jediswap.routerAddress, provider);
    const jediswapLPcontract = new Contract(abi.jediswapPairsPool, config.jediswap.pairsPool[pair], provider);
    let reserves = await jediswapLPcontract.get_reserves();
    const totalSupply = await jediswapLPcontract.totalSupply();
    let reserveIn = reserves.reserve0.low;
    let reserveOut = reserves.reserve1.low;
    const slippage = BigInt(25);
    const divider = BigInt(1000);
    const token0Address = await jediswapLPcontract.token0();
    const token1Address = await jediswapLPcontract.token1();
    const maxSrcAmount = (BigInt(lpBalance.balance.low) * reserveIn) / totalSupply.totalSupply.low;
    const minSrcAmount = (maxSrcAmount - ((maxSrcAmount * slippage) / divider));
    const maxDstAmount = (BigInt(lpBalance.balance.low) * reserveOut) / totalSupply.totalSupply.low;
    const minDstAmount = (maxDstAmount - ((maxDstAmount * slippage)) / divider);
    let timestamp =  Math.floor((Date.now() / 1000))+(60*60);
    const approveCall = lpToken.populate("approve", [config.jediswap.routerAddress, cairo.uint256(lpBalance.balance.low)]);
    const removeCall = jediswapContract.populate("remove_liquidity",[
      num.toHex(token0Address.address),
      num.toHex(token1Address.address),
      cairo.uint256(lpBalance.balance.low),
      cairo.uint256(minSrcAmount),
      cairo.uint256(minDstAmount),
      account.address,
      timestamp
    ])
    
    const txWithdraw = await account.execute([approveCall, removeCall]);
    console.log(txWithdraw.transaction_hash);
    const transaction_receipt_withdraw = await provider.waitForTransaction(txWithdraw.transaction_hash);
    let delayAfterTX = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
    await delay(delayAfterTX);
  
    console.log(`Withdraw done✅`)
}catch(e){
    console.log(`Have issue with withdraw, retryying....`)
    await jediswapLPWithdrawAll(key);
}

}


export async function zkLend(key, tokenDeposit, procent, borrow){
    let gwei = await gasPriceL2();
    if(general.gwei < gwei){
        do{
            gwei = await gasPriceL2()
            console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
            await delay(15000);
    } while(general.gwei < gwei)
}

    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const accountAddress = await getArgentAddress(key);
    const account = new Account(provider, accountAddress, key, "1");
    
    const zkLendContract = new Contract(abi.zkLend, config.zkLend.marketAddress, provider);
    const tokenDepositContract = new Contract(abi.erc20token, config.tokens[tokenDeposit], provider);
    const balance = await tokenDepositContract.balanceOf(accountAddress);
    const amount = cairo.uint256((BigInt(procent) * balance.balance.low) /100n)
    const callDataApprove = tokenDepositContract.populate("approve", [config.zkLend.marketAddress, amount]);
    const callDataDeposit = zkLendContract.populate("deposit", [tokenDepositContract.address, amount.low]);
    const callDataenable_collateral = zkLendContract.populate("enable_collateral", [tokenDepositContract.address]);
    console.log(`Making deposit ${(amountConsole(tokenDeposit, amount))} ${tokenDeposit}`)
    const tx = await account.execute([callDataApprove, callDataDeposit, callDataenable_collateral]);
    console.log(tx.transaction_hash);
    const transaction_receipt = await provider.waitForTransaction(tx.transaction_hash);
    let delayAfterTX = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
    await delay(delayAfterTX);
    console.log(`Deposit done✅`)
    await delay(120_000)


    if(borrow){
        await zkLendBorrow(key, tokenDeposit);
        await zkLendRepayAll(key, tokenDeposit);

    }

    const withdrawCallData = zkLendContract.populate("withdraw_all", [tokenDepositContract.address]);
    const txWithdraw = await account.execute(withdrawCallData);

    console.log(txWithdraw.transaction_hash);
    const transaction_receipt_withdraw_all = await provider.waitForTransaction(txWithdraw.transaction_hash);
    delayAfterTX = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
    await delay(delayAfterTX);
    console.log(`Provided money was taken away ✅`)
}

export async function zkLendBorrow(key, tokenDeposit){
    try{

    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const accountAddress = await getArgentAddress(key);
    const account = new Account(provider, accountAddress, key, "1");
    
    const tokenZ = new Contract(abi.erc20token, config.zkLend.wrappedTokens[tokenDeposit], provider);
    const balanceTokenZ = await tokenZ.balanceOf(accountAddress);
    const zkLendContract = new Contract(abi.zkLend, config.zkLend.marketAddress, provider);
    const tokenDepositContract = new Contract(abi.erc20token, config.tokens[tokenDeposit], provider);
  
    let random_number = getRandomNumber(20, 67);
    const borrowAmount = BigInt(random_number)*BigInt(balanceTokenZ.balance.low) / 100n;
    console.log(`Borrowing ${random_number}% is it ${(amountConsole(tokenDeposit, cairo.uint256(borrowAmount)))} ${tokenDeposit}`)
    const callDataBorrow = zkLendContract.populate("borrow", [tokenDepositContract.address, borrowAmount]);
    const {suggestedMaxFee: estimatedFeeBorrow} = await account.estimateInvokeFee({
        contractAddress: zkLendContract.address,
        entrypoint: "borrow",
        calldata: [tokenDepositContract.address, borrowAmount]
});
    const txBorrow = await account.execute([callDataBorrow], [zkLendContract.abi],{maxFee: estimatedFeeBorrow*110n/100n});
    console.log(txBorrow.transaction_hash);
    const transaction_receipt_borrow = await provider.waitForTransaction(txBorrow.transaction_hash);
    let delayAfterTX = getRandomDelay(30, 40);
    await delay(delayAfterTX);
    console.log(`Funds were borrowed ${(amountConsole(tokenDeposit, cairo.uint256(borrowAmount)))} ${tokenDeposit}`)
}catch(e){
    if(e.message.includes('Could not GET from endpoint')){
        let delayAfterTX = getRandomDelay(30, 40);
        await delay(delayAfterTX);
        console.log(`Funds were borrowed ${(amountConsole(tokenDeposit, cairo.uint256(borrowAmount)))} ${tokenDeposit}`)
    }

}
}
export async function zkLendRepayAll(key, tokenDeposit){
    try{
    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const accountAddress = await getArgentAddress(key);
    const account = new Account(provider, accountAddress, key, "1");
    
    const zkLendContract = new Contract(abi.zkLend, config.zkLend.marketAddress, provider);
    const tokenDepositContract = new Contract(abi.erc20token, config.tokens[tokenDeposit], provider);

    const debt = await zkLendContract.get_user_debt_for_token(accountAddress, tokenDepositContract.address);

    const repayApproveCallData = tokenDepositContract.populate("approve", [zkLendContract.address, cairo.uint256(debt.debt*103n/100n)]);
    /*
    const { suggestedMaxFee: estimatedFeeRepayApprove} = await account.estimateInvokeFee({
        contractAddress: tokenDepositContract.address,
        entrypoint: "approve",
        calldata: repayApproveCallData.calldata
    });
    */
    const repayCallData = zkLendContract.populate("repay_all", [tokenDepositContract.address]);
    /*
    const { suggestedMaxFee: estimatedFeeRepay } = await account.estimateInvokeFee({
        contractAddress: zkLendContract.address,
        entrypoint: "repay_all",
        calldata: repayCallData.calldata
    });
*/
    const txRepay = await account.execute([repayApproveCallData, repayCallData]);

    console.log(txRepay.transaction_hash);
    const transaction_receipt_repay_all = await provider.waitForTransaction(txRepay.transaction_hash);
    let delayAfterTX = getRandomDelay(30, 40);
    await delay(delayAfterTX);
    console.log(`The debt was paid`)
}catch(e){
    console.log(`\x1b[31mОшибка  в функции zkLendRepayAll \x1b[0m`);
    await randomswap(key, "ETH", tokenDeposit, 15);
    await zkLendRepayAll(key, tokenDeposit);
}

}

export async function starkverseMint(key){

    let gwei = await gasPriceL2();
    if(general.gwei < gwei){
        do{
            gwei = await gasPriceL2()
            console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
            await delay(15000);
    } while(general.gwei < gwei)
}
    console.log(`Starting minting NFTs on starkverse`);
    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const accountAddress = await getArgentAddress(key);
    const account = new Account(provider, accountAddress, key, "1");

    const starkverseContract = new Contract(abi.starkverse, config.starkverse, provider);
    const callDataMint = starkverseContract.populate("publicMint", [accountAddress]);
    const tx = await account.execute(callDataMint)

    console.log(tx.transaction_hash);
    const transaction_receipt = await provider.waitForTransaction(tx.transaction_hash);
    let delayAfterTX = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
    await delay(delayAfterTX);
    console.log(`Mint has been successful✅`)
}


export async function swapAllBalanceToToken(key){
    try{
    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const accountAddress = await getArgentAddress(key);
    const account = new Account(provider, accountAddress, key, "1");

    const projects = ["jediswap", "myswap", "kswap", "avnu"];
    const randomProjects = _.shuffle(projects);
    const project = randomProjects[0];
    const allbalance = await getAllBalance(accountAddress);

    const tokensWithBalance = [];

    for (const token in allbalance) {
      const balance = allbalance[token];
      if (balance > 0) {
        tokensWithBalance.push(token);
      }
    }
    
    if(tokensWithBalance.length > 0 ){
        for(let i = 0; i < tokensWithBalance.length; i++){
            if(project == "jediswap"){
                await jediswapSwap(key, tokensWithBalance[i], "ETH", 100);
            }
            else if(project == "myswap"){
                if(tokensWithBalance[i] == "WBTC"){
                    await swapAllBalanceToToken(key);
                } else{
                await myswapSwap(key, tokensWithBalance[i], "ETH", 100);
                }
            }
            else if(project == "kswap"){
                await kswapSwap(key, tokensWithBalance[i], "ETH", 100);
            }
            else if(project == "avnu"){
                await avnuSwap(key, tokensWithBalance[i], "ETH", 100);
            }
            
        }
    }    
}catch(e){
    let a = e;
    console.log(`Have issue with swap, retryying....`)
    await swapAllBalanceToToken(key);
}
}

export async function randomswap(key, tokenIn, tokenOut, procent){
    try{
    const projects = ["jediswap", "myswap", "kswap", "avnu"];
    const randomProjects = _.shuffle(projects);
    const project = randomProjects[0];
  
      if(project == "jediswap"){
      await jediswapSwap(key, tokenIn, tokenOut, procent);
    }
        else if(project == "myswap"){
        await myswapSwap(key, tokenIn, tokenOut, procent);
        }
            else if(project == "kswap"){
            await kswapSwap(key, tokenIn, tokenOut, procent);
            }
              else if(project == "avnu"){
              await avnuSwap(key, tokenIn, tokenOut, procent);
              }
  }catch(e){
    console.log(`Have issue with swap, retryying....`)
    await randomswap(key, tokenIn, tokenOut, procent);
  }
  }

  export async function identity(key){

        let gwei = await gasPriceL2();
        if(general.gwei < gwei){
            do{
                gwei = await gasPriceL2()
                console.log(`Gwei now ${gwei} , waiting lowwer than ${general.gwei}`);
                await delay(15000);
        } while(general.gwei < gwei)
    }
        const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
        const accountAddress = await getArgentAddress(key);
        const account = new Account(provider, accountAddress, key, "1");
        console.log(`Minting starknet identity`)

        const starkIdContract = new Contract(abi.starknetId, config.starknetId, provider)
        const callDataMint = starkIdContract.populate("mint", [Math.floor(1_000_000_000_000 * Math.random())])
        const tx = await account.execute(callDataMint);
        console.log(tx.transaction_hash);
        const transaction_receipt = await provider.waitForTransaction(tx.transaction_hash);
        let delayAfterTX = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
        await delay(delayAfterTX);
        console.log(`Mint has been successful✅`)
  }


  export async function checkAllBalance(key){
    const accountAddress = await getArgentAddress(key);
    const provider = new RpcProvider({ nodeUrl: general.providerSTARK });
    const contractETH = new Contract(abi.erc20token, config.tokens.ETH, provider);
    const balanceETH = await contractETH.balanceOf(accountAddress);

    const jediLPBalance = await getAllLPBalance(accountAddress);
    
    const zkLendBalance = await getzkLendbalance(accountAddress);
    const allBalance = await getAllBalance(accountAddress);
    const balances = [jediLPBalance, zkLendBalance, allBalance];
    console.log(`${amountConsole("ETH", cairo.uint256(balanceETH.balance.low))} ETH`);

    for (const token of balances) {
        for (const tokenKey in token) {
          const tokenBalance = token[tokenKey];
          
          if (tokenBalance > 0n) {
            console.log(`${amountConsole(tokenKey, cairo.uint256(tokenBalance))} ${tokenKey}`)
          }
        }
      }
  }
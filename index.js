import { jediswapSwap, myswapSwap, kswapSwap, avnuSwap, orbiterBridge, dmail, jediswapLP, zkLend, starkverseMint, argentDeploy, swapAllBalanceToToken, starkgateBridge, randomswap, identity, jediswapLPWithdrawAll, checkAllBalance, zkLendRepayAll } from "./functions.js";
import { getRandomDelay, getRandomNumber, delay, getArgentAddress } from "./helper.js";
import fs from "fs";
import {argentDeployWallet, orbiter, jediswap, myswap, kswap, avnu, starkkVerse, dmailClass, jediLP, zkLendClass, general, starkgate, starknetId, checkBalance } from "./settings.js";
import _ from "lodash"
import config from "./config.json" assert { type: "json" };

//-------------------------------------------------------------------------------------------------------\\

const accountsStark = _.shuffle(fs.readFileSync("./privateStark.txt").toString().replace(/\r\n/g,'\n').split('\n'));

const EVMprivateMas = fs.readFileSync("./privateEVM.txt").toString().replace(/\r\n/g,'\n').split('\n');
const starkPrivatemas = fs.readFileSync("./privateStark.txt").toString().replace(/\r\n/g,'\n').split('\n');

for(let i = 0; i < accountsStark.length; i++){

            let projects = [];

            if (jediswap.mode === true) {
                projects.push("jediswapSwap");
            } else if (jediswap.mode === "random") {
                if (getRandomNumber(0, 1) === 1) {
                    projects.push("jediswapSwap");
                }
            }
            
            if (myswap.mode === true) {
                projects.push("myswapSwap");
            } else if (myswap.mode === "random") {
                if (getRandomNumber(0, 1) === 1) {
                    projects.push("myswapSwap");
                }
            }

            if (kswap.mode === true) {
                projects.push("kswapSwap");
            } else if (kswap.mode === "random") {
                if (getRandomNumber(0, 1) === 1) {
                    projects.push("kswapSwap");
                }
            }

            if (starkkVerse.mode === true) {
                projects.push("starkverseMint");
            } else if (starkkVerse.mode === "random") {
                if (getRandomNumber(0, 1) === 1) {
                    projects.push("starkverseMint");
                }
            }

            if (avnu.mode === true) {
                projects.push("avnuSwap");
            } else if (avnu.mode === "random") {
                if (getRandomNumber(0, 1) === 1) {
                    projects.push("avnuSwap");
                }
            }

            if (starknetId.mode === true) {
                projects.push("starknetId");
            } else if (starknetId.mode === "random") {
                if (getRandomNumber(0, 1) === 1) {
                    projects.push("starknetId");
                }
            }

            if (dmailClass.mode === true) {
                projects.push("dmail");
            } else if (dmailClass.mode === "random") {
                if (getRandomNumber(0, 1) === 1) {
                    projects.push("dmail");
                }
            }

            if (jediLP.mode === true) {
                projects.push("jediswapLP");
            } else if (jediLP.mode === "random") {
                if (getRandomNumber(0, 1) === 1) {
                    projects.push("jediswapLP");
                }
            }

            if (zkLendClass.mode === true) {
                projects.push("zkLend");
            } else if (zkLendClass.mode === "random") {
                if (getRandomNumber(0, 1) === 1) {
                    projects.push("zkLend");
                }
            }
            

            let randomProjects = _.shuffle(projects);

    console.log(`\x1b[34mНачинаю работу с аккаунтом ${i+1} - ${await getArgentAddress(accountsStark[i])}\x1b[0m`);
    if(starkgate.mode){

            let evmKey = EVMprivateMas[i];
            let starkPrivate = starkPrivatemas[i];
            await starkgateBridge(evmKey, starkPrivate, starkgate.procentForBridgeMin, starkgate.procentForBridgeMax);
            let randomDelay = getRandomDelay(general.delayAfterTxMin, general.delayAfterTxMax);
            console.log(`delay ${randomDelay / 1000} sec started`)
            await delay(randomDelay);
        
    }
    
    
    
    if(orbiter.mode){

            let evmKey = EVMprivateMas[i];
            let starkPrivate = starkPrivatemas[i];
            await orbiterBridge(evmKey, starkPrivate, orbiter.fromNetwork, orbiter.procentForBridge);
            let randomDelay = getRandomDelay(orbiter.delayMin, orbiter.delayMax);
            console.log(`delay ${randomDelay / 1000} sec started`)
            await delay(randomDelay);
        
    }


    try{
    let key = accountsStark[i];
    if(argentDeployWallet.mode){
            await argentDeploy(key);
            console.log(`wallet ${i+1} deployed`);
            let randomDelay = getRandomDelay(argentDeployWallet.delayMin, argentDeployWallet.delayMax);
            console.log(`delay ${randomDelay / 1000} sec started`)
            await delay(randomDelay);
        }

    if(checkBalance.mode){
        //let key = starkPrivatemas[i];
        await checkAllBalance(key);


    }
    

    for(let i = 0; i < randomProjects.length; i++){
        let project = randomProjects[i];
        if(project == "starkverseMint"){
            let mints = getRandomNumber(starkkVerse.mintsMin, starkkVerse.mintsMax);
            for(let i = 0; i < mints; i++){
            await starkverseMint(key);
            let randomDelay = getRandomDelay(general.delayAfterMintMin, general.delayAfterMintMax);
            await delay(randomDelay);
            }
            let delayAfterProject = getRandomDelay(general.delayAfterProjectMin, general.delayAfterProjectMax);
            console.log(`${delayAfterProject / 1000} sec started`)
            await delay(delayAfterProject);
        }
            else if(project == "jediswapSwap"){
                let tokenIn;
                let tokenOut;
                let procent;
                let number;
                let swapNumber = getRandomNumber(jediswap.swap_number_min, jediswap.swap_number_max)
                    for(let i = 0; i <= swapNumber; i++){

                    if (i === 0) {
                        tokenIn = jediswap.tokenIn;
                        number = getRandomNumber(jediswap.procent_first_swap_min, jediswap.procent_first_swap_max);
                        procent = BigInt(number);
                    } else if(i === jediswap.swap_numbers){
                        await jediswapSwap(key, tokenOut, "ETH", 100);
                    }
                    else {
                        procent = 100n;
                        tokenIn = tokenOut
                    }
                    const existingPairs = Object.keys(config.jediswap.pairsPool);
                    do {
                        tokenOut = ["USDC", "USDT", "WBTC", "DAI", "ETH"][Math.floor(Math.random() * 5)];
                    } while(!existingPairs.includes(tokenIn+tokenOut) || tokenIn == tokenOut)
                    if(i > 0 && tokenIn == "ETH"){
                        procent = BigInt(getRandomNumber(jediswap.procent_first_swap_min, jediswap.procent_first_swap_max));
                    }
                    await jediswapSwap(key, tokenIn, tokenOut, procent);
                }
                await swapAllBalanceToToken(key)
                let delayAfterProject = getRandomDelay(general.delayAfterProjectMin, general.delayAfterProjectMax);
                console.log(`${delayAfterProject / 1000} sec started`)
                await delay(delayAfterProject);

            }


                else if(project == "myswapSwap"){
                    let tokenIn;
                    let tokenOut;
                    let procent;
                    let number;
                    let swapNumber = getRandomNumber(myswap.swap_number_min, myswap.swap_number_max)
                        for(let i = 0; i < swapNumber; i++){

                        if (i === 0) {
                            tokenIn = myswap.tokenIn;
                            number = getRandomNumber(myswap.procent_first_swap_min, myswap.procent_first_swap_max);
                            procent = BigInt(number);
                        } else {
                            procent = 100n;
                            tokenIn = tokenOut
                        }
                        const existingPairs = Object.keys(config.myswap.poolId);
                        do {
                            tokenOut = ["USDC", "USDT", "DAI", "ETH"][Math.floor(Math.random() * 4)];
                        } while(!existingPairs.includes(tokenIn+tokenOut) || tokenIn == tokenOut)
                        if(i > 0 && tokenIn == "ETH"){
                            procent = BigInt(getRandomNumber(myswap.procent_first_swap_min, myswap.procent_first_swap_max));
                        }
                        await myswapSwap(key, tokenIn, tokenOut, procent);
                    }
                    await swapAllBalanceToToken(key)
                    let delayAfterProject = getRandomDelay(general.delayAfterProjectMin, general.delayAfterProjectMax);
                    console.log(`${delayAfterProject / 1000} sec started`)
                    await delay(delayAfterProject);

            }


                    else if(project == "kswapSwap"){
                        let tokenIn;
                        let tokenOut;
                        let procent;
                        let number;
                        let swapNumber = getRandomNumber(kswap.swap_number_min, kswap.swap_number_max)
                            for(let i = 0; i < swapNumber; i++){

                            if (i === 0) {
                                tokenIn = kswap.tokenIn;
                                number = getRandomNumber(kswap.procent_first_swap_min, kswap.procent_first_swap_max);
                                procent = BigInt(number);
                            } else {
                                procent = 100n;
                                tokenIn = tokenOut
                            }
                            const existingPairs = Object.keys(config.kswap.pairsPool);
                            do {
                                tokenOut = ["USDC", "USDT", "DAI", "ETH", "WBTC"][Math.floor(Math.random() * 5)];
                            } while(!existingPairs.includes(tokenIn+tokenOut) || tokenIn == tokenOut)
                            if(i > 0 && tokenIn == "ETH"){
                                procent = BigInt(getRandomNumber(kswap.procent_first_swap_min, kswap.procent_first_swap_max));
                            }
                            await kswapSwap(key, tokenIn, tokenOut, procent);
                        }
                        await swapAllBalanceToToken(key)
                        let delayAfterProject = getRandomDelay(general.delayAfterProjectMin, general.delayAfterProjectMax);
                        console.log(`${delayAfterProject / 1000} sec started`)
                        await delay(delayAfterProject);
                }



                        else if(project == "avnuSwap"){
                            let tokenIn;
                            let tokenOut;
                            let procent;
                            let number;
                            let swapNumber = getRandomNumber(avnu.swap_number_min, avnu.swap_number_max)
                                for(let i = 0; i < swapNumber; i++){

                                if (i === 0) {
                                    tokenIn = avnu.tokenIn;
                                    number = getRandomNumber(avnu.procent_first_swap_min, avnu.procent_first_swap_max);
                                    procent = BigInt(number);
                                } else {
                                    procent = 100n;
                                    tokenIn = tokenOut
                                }
                                const existingPairs = Object.keys(config.avnu.pairs);
                                do {
                                    tokenOut = ["USDC", "USDT", "DAI", "ETH", "WBTC"][Math.floor(Math.random() * 5)];
                                } while(!existingPairs.includes(tokenIn+tokenOut) || tokenIn == tokenOut)
                                if(i > 0 && tokenIn == "ETH"){
                                    procent = BigInt(getRandomNumber(avnu.procent_first_swap_min, avnu.procent_first_swap_max));
                                }
                                await avnuSwap(key, tokenIn, tokenOut, procent);
                            }
                           await swapAllBalanceToToken(key)
                           let delayAfterProject = getRandomDelay(general.delayAfterProjectMin, general.delayAfterProjectMax);
                           console.log(`${delayAfterProject / 1000} sec started`)
                           await delay(delayAfterProject);
                    }


                                else if(project == "starknetId"){
                                    let number = getRandomNumber(starknetId.mintsMin, starknetId.mintsMax);
                                    for(let i = 0; i < number; i++){
                                        await identity(key);
                                    }
                                    let delayAfterProject = getRandomDelay(general.delayAfterProjectMin, general.delayAfterProjectMax);
                                    console.log(`${delayAfterProject / 1000} sec started`)
                                    await delay(delayAfterProject);
                                }


                                    else if(project =="dmail"){
                                        let emails = getRandomNumber(dmailClass.emailToSendMin, dmailClass.emailToSendMax);
                                        for(let i = 0; i < emails; i++){
                                            await dmail(key);
                                        }
                                        let delayAfterProject = getRandomDelay(general.delayAfterProjectMin, general.delayAfterProjectMax);
                                        console.log(`${delayAfterProject / 1000} sec started`)
                                        await delay(delayAfterProject);
                                    }

                                            else if(project == "jediswapLP"){
                                                await jediswapLP(key, jediLP.procentMin, jediLP.procentMax)
                                                await jediswapLPWithdrawAll(key);
                                                await swapAllBalanceToToken(key)
                                                let delayAfterProject = getRandomDelay(general.delayAfterProjectMin, general.delayAfterProjectMax);
                                                console.log(`${delayAfterProject / 1000} sec started`)
                                                await delay(delayAfterProject);
                                            }

                                                else if(project == "zkLend"){
                                                    let procent = getRandomNumber(zkLendClass.procentMin, zkLendClass.procentMax);
                                                    let tokenDeposit = ["USDC", "USDT", "WBTC", "DAI", "ETH"][Math.floor(Math.random() * 5)];
                                                    let borrow = false;
                                                    
                                                        if (zkLendClass.mode === true) {
                                                            borrow = true
                                                        } else if (zkLendClass.mode === "random") {
                                                            if (getRandomNumber(0, 1) === 1) {
                                                                borrow = true
                                                            }
                                                        }
                                                        if(tokenDeposit !== "ETH"){
                                                            //await randomswap(key, "ETH", tokenDeposit, procent)
                                                            await zkLend(key, tokenDeposit, 100, borrow)
                                                            await swapAllBalanceToToken(key)
                                                            }   else{
                                                                
                                                                await zkLend(key, tokenDeposit, procent, borrow)
                                                                await swapAllBalanceToToken(key)
                                                                }
                                                    let delayAfterProject = getRandomDelay(general.delayAfterProjectMin, general.delayAfterProjectMax);
                                                    console.log(`${delayAfterProject / 1000} sec started`)
                                                    await delay(delayAfterProject);
                                                }


                        
    }


    console.log(`\x1b[32mРабота с аккаунтом ${i+1} закончена\x1b[0m`);
    fs.appendFileSync('done.txt', key + '\n');

}catch(e){
    let a = e;
    console.log(`\x1b[31mОшибка ${e}\x1b[0m`);
    fs.appendFileSync('problems.txt', accountsStark[i] + '\n');
    await swapAllBalanceToToken(accountsStark[i])

}

}






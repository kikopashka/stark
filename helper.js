import { RpcProvider, constants, stark, hash, CallData, Provider, Contract, Account, ec, json, cairo, getChecksumAddress, uint256 } from "starknet";
import fs from "fs";
import {general} from "./settings.js"
import config from "./config.json" assert { type: "json" };
import abi from "./abi.json" assert { type: "json"};
import crypto from "crypto";
import {ethers} from "ethers";

/*
export async function getFeeForStarkgate(starkAddres, EVMAddress, amount){

  const provider = new SequencerProvider({
      baseUrl: 'https://alpha-mainnet.starknet.io/',
      feederGatewayUrl: 'feeder_gateway',
      gatewayUrl: 'gateway',
  });

let res = await provider.estimateMessageFee({
      from_address: '0xae0ee0a63a2ce6baeeffe56e7714fb4efe48d419',
      to_address: '0x073314940630fd6dcda0d772d4c972c4e0a9946bef9dabf4ef84eda8ef542b82',
      entry_point_selector: 'handle_deposit',
      payload: [starkAddres, amount, '0']
  })

const data = await bridge.methods.deposit(amount, starkAddres);

estimate = await data.estimateGas({ from: EVMAddress, value: BigInt(res.overall_fee) + BigInt(1000000) });
return estimate;
} 
*/


export async function getArgentAddress(key){
  const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } });
  const targetHash = '0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003';
  const oldWayAddress = await getArgentAddressOld(key);
  try{
        let classHash = await provider.getClassHashAt(oldWayAddress);
  
        if(classHash == targetHash){
        return oldWayAddress;
        } else{
    
      const newWayAddress = await getArgentAddressNew(key);
      classHash = await provider.getClassHashAt(newWayAddress);
      return newWayAddress;
        }
      }catch(e){
        if(e.message == 'Endpoint is deprecated from version 0.12.3.') return oldWayAddress
        else{
        const address = await getArgentAddressNew(key);
        return address
        }
      }
    
}



export async function getArgentAddressNew (key) {
  const argentAccountClassHash = "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";

  const publicKey = ec.starkCurve.getStarkKey(key);
  const constructorCalldata = CallData.compile({
    owner: publicKey,
    guardian: 0n
});

  return hash.calculateContractAddressFromHash(
      publicKey,
      argentAccountClassHash,
      constructorCalldata,
      0
  );
};

export async function getArgentAddressOld(key){
        const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } });

        const argentXproxyClassHash = "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
        const argentXaccountClassHash = "0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2";
        //const argentXaccountClassHash = "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";

        const publicKey = ec.starkCurve.getStarkKey(key);
        const AXproxyConstructorCallData = CallData.compile({
            implementation: argentXaccountClassHash,
            selector: hash.getSelectorFromName("initialize"),
            calldata: CallData.compile({ signer: publicKey, guardian: "0" }),
        });

        return hash.calculateContractAddressFromHash(
            publicKey,
            argentXproxyClassHash,
            AXproxyConstructorCallData,
            0
        );
    };


export async function getAmountTokenStark(walletAddress, tokenAddress, abiAddress) {
    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } });

    if (!abiAddress) {
        abiAddress = tokenAddress;
    }
    const { abi: abi } = await provider.getClassAt(abiAddress);
    if (abi === undefined) {
        throw new Error("no abi.");
    }
    const contract = new Contract(abi, tokenAddress, provider);

    const balance = await contract.functions.balanceOf(walletAddress);

    return balance.balance.low;
};


export async function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    return result;
  };


  export async function generateRandomEmail(low, high) {
    const usernameLength = Math.floor(Math.random() * (high - low + 1)) + low;
    const username = await generateRandomString(usernameLength);
    const domains = ['@gmail.com', '@outlook.com', '@yahoo.com'];
    const randomDomainIndex = Math.floor(Math.random() * domains.length);
    const domain = domains[randomDomainIndex];
    const email = username+domain;
    return email;
  };


  export function getRandomNumber(low, high){
    const number = Math.floor(Math.random() * (high - low + 1)) + low;
    return number;
  };

 export function hashString(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
};


export function removeLeadingZeroes(str) {
  if (str[2] !== '0') {
      return str;
  }
  const newStr = str.slice(0, 2) + str.slice(3);
  return removeLeadingZeroes(newStr);
};


export function encoder(message) {
  if ("" === message)
      return "";
  let t = [];
  t.push("0x");
  for (let n = 0; n < message.length; n++)
      t.push(message.charCodeAt(n).toString(16));
  return t.join("")
}



export function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export async function getAllBalance(accountAddress){
  const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } });

  const contractETH = new Contract(abi.erc20token, config.tokens.ETH, provider);
  const contractUSDC = new Contract(abi.erc20token, config.tokens.USDC, provider);
  const contractUSDT = new Contract(abi.erc20token, config.tokens.USDT, provider);
  const contractDAI = new Contract(abi.erc20token, config.tokens.DAI, provider);
  const contractWBTC = new Contract(abi.erc20token, config.tokens.WBTC, provider);


  //const balanceETH = await contractETH.balanceOf(accountAddress);
  const balanceUSDC = await contractUSDC.balanceOf(accountAddress);
  const balanceUSDT = await contractUSDT.balanceOf(accountAddress);
  const balanceDAI = await contractDAI.balanceOf(accountAddress);
  const balanceWBTC = await contractWBTC.balanceOf(accountAddress);


  return{
    //ETH : balanceETH.balance.low,
    USDC : balanceUSDC.balance.low,
    USDT : balanceUSDT.balance.low,
    DAI : balanceDAI.balance.low,
    WBTC : balanceWBTC.balance.low,
  };
}

export function amountConsole(token, amount){
  let decimals = config.decimals[token];
  let amountBN = uint256.uint256ToBN(amount);
  let amountWithDecimals = ethers.formatUnits(amountBN, decimals);
  return amountWithDecimals;
}


export async function gasPriceL1(){
  try{
  const provider = new ethers.JsonRpcProvider(general.provider)
  const gasPrice = (await provider.getFeeData()).gasPrice;
  const gwei = ethers.formatUnits(gasPrice, 'gwei');
  return gwei;
  } catch(e){
    await gasPriceL1();
  }
}

export async function gasPriceL2(){
  try{
  const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } });
  const blockInfo = await provider.getBlock('latest');
  const gwei = ethers.formatUnits(parseInt(blockInfo.gas_price, 16),"gwei")
  return gwei;
  }catch(e){
    await gasPriceL2();
  }
}

export async function getAllLPBalance(accountAddress){
  const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } });

  const contractETHUSDC = new Contract(abi.erc20token, config.jediswap.pairsPool.ETHUSDC, provider);
  const contractETHUSDT = new Contract(abi.erc20token, config.jediswap.pairsPool.ETHUSDT, provider);
  const contractDAIETH = new Contract(abi.erc20token, config.jediswap.pairsPool.DAIETH, provider);
  const contractDAIUSDC = new Contract(abi.erc20token, config.jediswap.pairsPool.DAIUSDC, provider);
  const contractDAIUSDT = new Contract(abi.erc20token, config.jediswap.pairsPool.DAIUSDT, provider);
  const contractUSDCUSDT = new Contract(abi.erc20token, config.jediswap.pairsPool.USDCUSDT, provider);
  const contractWBTCETH = new Contract(abi.erc20token, config.jediswap.pairsPool.WBTCETH, provider);



  //const balanceETH = await contractETH.balanceOf(accountAddress);
  const balanceETHUSDC = await contractETHUSDC.balanceOf(accountAddress);
  const balanceETHUSDT = await contractETHUSDT.balanceOf(accountAddress);
  const balanceDAIETH = await contractDAIETH.balanceOf(accountAddress);
  const balanceDAIUSDC = await contractDAIUSDC.balanceOf(accountAddress);
  const balanceDAIUSDT = await contractDAIUSDT.balanceOf(accountAddress);
  const balanceUSDCUSDT = await contractUSDCUSDT.balanceOf(accountAddress);
  const balanceWBTCETH = await contractWBTCETH.balanceOf(accountAddress);


  return{
    ETHUSDC : balanceETHUSDC.balance.low,
    ETHUSDT : balanceETHUSDT.balance.low,
    DAIETH : balanceDAIETH.balance.low,
    DAIUSDC : balanceDAIUSDC.balance.low,
    DAIUSDT : balanceDAIUSDT.balance.low,
    USDCUSDT : balanceUSDCUSDT.balance.low,
    WBTCETH : balanceWBTCETH.balance.low,

  };
}

export async function getzkLendbalance(accountAddress){
    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } });

    const contractzETH = new Contract(abi.erc20token, config.zkLend.wrappedTokens.ETH, provider);
    const contractzUSDC = new Contract(abi.erc20token, config.zkLend.wrappedTokens.USDC, provider);
    const contractzUSDT = new Contract(abi.erc20token, config.zkLend.wrappedTokens.USDT, provider);
    const contractzDAI = new Contract(abi.erc20token, config.zkLend.wrappedTokens.DAI, provider);
    const contractzWBTC = new Contract(abi.erc20token, config.zkLend.wrappedTokens.WBTC, provider);


    const balancezETH = await contractzETH.balanceOf(accountAddress);
    const balancezUSDC = await contractzUSDC.balanceOf(accountAddress);
    const balancezUSDT = await contractzUSDT.balanceOf(accountAddress);
    const balancezDAI = await contractzDAI.balanceOf(accountAddress);
    const balancezWBTC = await contractzWBTC.balanceOf(accountAddress);


    return{
      zETH : balancezETH.balance.low,
      zUSDC : balancezUSDC.balance.low,
      zUSDT : balancezUSDT.balance.low,
      zDAI : balancezDAI.balance.low,
      zWBTC : balancezWBTC.balance.low,
    };
}
const {Blockchain, Transaction} = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('4dd58eda6c17ff885811f45ef1d880a00c55b59970e787cf17ca3238f480fb84');
const myWalletAddress = myKey.getPublic('hex');

let changCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, 'public key goes here', 10);
tx1.signTransaction(myKey);
changCoin.addTransaction(tx1);

console.log('\nStarting the miner...');
changCoin.minePendingTransactions(myWalletAddress);

console.log('\nYour balance is', changCoin.getBalanceOfAddress(myWalletAddress));

// Tampering!!
// changCoin.chain[1].transactions[0].amount = 1;

console.log('Is chain valid? ', changCoin.isChainValid());

// console.log(JSON.stringify(changCoin, null, 4));
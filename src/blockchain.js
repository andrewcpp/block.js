const SHA256 = require('../crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    // We sign hash of the transaction
    calculateHash() {
        return SHA256(this.fromAddress + this.toAddress + this.amount).toString;
    }

    // signingKey is our private key
    signTransaction(signingKey) {
        // If signing key is not equal to sender address
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('Signing transactions from other wallets not allowed');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    // Is this transaction valid?
    isValid() {
        // Mining reward case
        if (this.fromAddress === null) {
            return true;
        }

        // Is there a signature?
        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        // Extract public key and verify
        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

class Block {

    // index: where the block sits on the chain
    // transactions: array of transactions
    // timestamp: when block was created
    // data: details of transaction, etc.
    // previousHash: string that contains the hash of the previous block
    constructor(timestamp, transactions, previousHash = '') {
        // this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    // take properties of this block, execute through hash function, returns hash
    calculateHash() {
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    // difficulty: how many zeroes does the proof of work begin with
    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined: " + this.hash);
    }

    // Are all transactions valid?
    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }

        return true;
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock() {
        return new Block(Date.now(), [], "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        this.chain.push(block);

        this.pendingTransactions = [];
    }

    addTransaction(transaction) {

        // Check if transactions have right parameters
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address.');
        }

        // Are all transactions valid?
        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to blockchain.');
        }

        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }

                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    // Basic add block function
    /*
        addBlock(newBlock) {
            newBlock.previousHash = this.getLatestBlock().hash;
            newBlock.mineBlock(this.difficulty);
            // newBlock.hash = newBlock.calculateHash();
            this.chain.push(newBlock);
        }
    */

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }

        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
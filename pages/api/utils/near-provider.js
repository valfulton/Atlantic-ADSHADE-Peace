import 'dotenv/config';
import * as nearAPI from 'near-api-js';
const {
    Near,
    Account,
    KeyPair,
    keyStores,
    utils: { PublicKey },
} = nearAPI;

// from .env
const { contractId: _contractId, secretKey, mpcPublicKey } = process.env;

export const contractId = _contractId;

const networkId = 'testnet';
const keyStore = new keyStores.InMemoryKeyStore();
const config = {
    networkId,
    keyStore,
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://testnet.mynearwallet.com/',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://testnet.nearblocks.io',
};
const near = new Near(config);
const { connection } = near;
const { provider } = connection;
const gas = BigInt('300000000000000');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const getImplicit = (pubKeyStr) =>
    Buffer.from(PublicKey.from(pubKeyStr).data).toString('hex').toLowerCase();
export const setKey = (accountId, secretKey) => {
    process.env.accountId = accountId;
    const keyPair = KeyPair.fromString(secretKey);
    keyStore.setKey(networkId, accountId, keyPair);
};
// running in dev we'll use the same NEAR account
if (secretKey) setKey(process.env.accountId, secretKey);

export const getAccount = (id = process.env.accountId) =>
    new Account(connection, id);

export const contractView = async ({
    accountId,
    contractId = _contractId,
    methodName,
    args = {},
}) => {
    const account = getAccount(accountId);
    let res;
    try {
        res = await account.viewFunction({
            contractId,
            methodName,
            args,
            gas,
        });
    } catch (e) {
        if (/deserialize/gi.test(JSON.stringify(e))) {
            console.log(`Bad arguments to ${methodName} method`);
        }
        throw e;
    }
    return res;
};

export const contractCall = async ({
    accountId,
    contractId = _contractId,
    methodName,
    args,
}) => {
    const account = getAccount(accountId);
    let res;
    try {
        res = await account.functionCall({
            contractId,
            methodName,
            args,
            gas,
        });
    } catch (e) {
        console.log(e);
        if (/deserialize/gi.test(JSON.stringify(e))) {
            return console.log(`Bad arguments to ${methodName} method`);
        }
        if (e.context?.transactionHash) {
            const maxPings = 30;
            let pings = 0;
            while (
                res.final_execution_status != 'EXECUTED' &&
                pings < maxPings
            ) {
                // Sleep 1 second before next ping.
                await sleep(1000);
                // txStatus times out when waiting for 'EXECUTED'.
                // Instead we wait for an earlier status type, sleep between and keep pinging.
                res = await provider.txStatus(
                    e.context.transactionHash,
                    account.accountId,
                    'INCLUDED',
                );
                pings += 1;
            }
            if (pings >= maxPings) {
                console.warn(
                    `Request status polling exited before desired outcome.\n  Current status: ${res.final_execution_status}\nSignature Request will likley fail.`,
                );
            }
            return parseSuccessValue(res);
        }
        throw e;
    }
    return parseSuccessValue(res);
};

// const getTxResult = async (txHash) => {
//     const transaction = await provider.txStatus(txHash, 'unnused');
//     return transaction;
// };

// const getTxSuccessValue = async (txHash) => {
//     const transaction = await getTxResult(txHash);
//     return parseSuccessValue(transaction);
// };

const parseSuccessValue = (transaction) => {
    if (transaction.status.SuccessValue.length === 0) return;

    try {
        return JSON.parse(
            Buffer.from(transaction.status.SuccessValue, 'base64').toString(
                'ascii',
            ),
        );
    } catch (e) {
        console.log(
            `Error parsing success value for transaction ${JSON.stringify(
                transaction,
            )}`,
        );
    }
};

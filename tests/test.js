import test from 'ava';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env.development.local' });

const { NEXT_PUBLIC_accountId: accountId, NEXT_PUBLIC_contractId: contractId } =
    process.env;
import * as nearAPI from 'near-api-js';

import {
    getAccount,
    contractView,
    contractCall,
    getDevAccountKeyPair,
} from '../utils/near-provider.js';

import { quote_hex, collateral } from './sample.js';

// tests

// delete the contract account to clear storage state and re-run tests

test('delete, create contract account', async (t) => {
    const keyPair = getDevAccountKeyPair();

    try {
        const account = getAccount(contractId);
        await account.deleteAccount(accountId);
    } catch (e) {
        console.log('error deleteAccount', e);
    }

    try {
        const account = getAccount(accountId);
        await account.createAccount(
            contractId,
            keyPair.getPublicKey(),
            nearAPI.utils.format.parseNearAmount('10'),
        );
    } catch (e) {
        console.log('error createAccount', e);
    }
    t.pass();
});

test('deploy contract', async (t) => {
    const file = fs.readFileSync('./contract/target/near/contract.wasm');
    const account = getAccount(contractId);
    await account.deployContract(file);
    console.log('deployed bytes', file.byteLength);
    const balance = await account.getAccountBalance();
    console.log('contract balance', balance);

    t.pass();
});

test('init contract', async (t) => {
    await contractCall({
        contractId,
        methodName: 'init',
        args: {
            owner_id: accountId,
        },
    });

    t.pass();
});

test('call register_worker with quote', async (t) => {
    const res = await contractCall({
        contractId,
        methodName: 'register_worker',
        args: {
            quote_hex,
            collateral: JSON.stringify(collateral),
            checksum: 'foo',
            codehash: 'bar',
        },
    });

    console.log(res);

    t.pass();
});

test('call get_worker', async (t) => {
    const res = await contractView({
        contractId,
        methodName: 'get_worker',
        args: {
            account_id: accountId,
        },
    });

    console.log(res);

    t.pass();
});

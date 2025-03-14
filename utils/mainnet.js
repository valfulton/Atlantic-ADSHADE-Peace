import { generateAddress } from './kdf.js';

const call = async () => {
    const { address, publicKey } = await generateAddress({
        publicKey:
            'secp256k1:3tFRbMqmoa6AAALMrEFAYCEoHcqKxeW38YptwowBVBtXK1vo36HDbUWuR6EZmoK4JcH6HDkNMGGqP1ouV7VZUWya',
        accountId: 'v0.shadeagent.near',
        path: 'shadeagent007',
        chain: 'evm',
    });

    console.log('address', address);
    console.log('publicKey', publicKey);
};

call();

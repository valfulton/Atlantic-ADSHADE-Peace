import { ethers } from 'ethers';
import BN from 'bn.js';
import { fetchJson } from './utils';
import { networkId, contractCall } from '@neardefi/shade-agent-js';

// !!! Warning only the contract call method "call" is tested

export const ethereum = {
    name: 'Hyper Liquid ',
    chainId: networkId === 'testnet' ? 998 : 999,
    currency: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
    gasLimit: 21000,

    getGasPrice: async () => {
        // get current gas prices on Sepolia
        const {
            data: { rapid, fast, standard },
        } = await fetchJson(
            `https://sepolia.beaconcha.in/api/v1/execution/gasnow`,
        );
        let gasPrice = Math.max(rapid, fast, standard);
        if (!gasPrice) {
            console.log(
                'Unable to get gas price. Please refresh and try again.',
            );
        }
        return Math.max(rapid, fast, standard);
    },

    getBalance: ({ address }) => getSepoliaProvider().getBalance(address),

    send: async ({
        from: address,
        to = '0x525521d79134822a342d330bd91DA67976569aF1',
        amount = '0.001',
    }) => {
        if (!address) return console.log('must provide a sending address');
        const {
            getGasPrice,
            gasLimit,
            chainId,
            getBalance,
            completeEthereumTx,
            currency,
        } = ethereum;

        const balance = await getBalance({ address });
        console.log('balance', ethers.formatEther(balance), currency);

        const provider = getSepoliaProvider();
        // get the nonce for the sender
        const nonce = await provider.getTransactionCount(address);
        const gasPrice = await getGasPrice();

        // check sending value
        const value = ethers.hexlify(ethers.formatUnits(amount));
        if (value === '0x00') {
            console.log('Amount is zero. Please try a non-zero amount.');
        }

        // check account has enough balance to cover value + gas spend
        const overrideBalanceCheck = true;
        if (
            !overrideBalanceCheck &&
            (!balance ||
                new BN(balance.toString()).lt(
                    new BN(ethers.formatUnits(amount).toString()).add(
                        new BN(gasPrice).mul(new BN(gasLimit.toString())),
                    ),
                ))
        ) {
            return console.log('insufficient funds');
        }

        console.log('sending', amount, currency, 'from', address, 'to', to);

        const baseTx = {
            to,
            nonce,
            data: [],
            value,
            gasLimit,
            gasPrice,
            chainId,
        };

        await completeEthereumTx({ address, baseTx });
    },

    // deployContract: async ({ from: address, path = './contracts/nft.bin' }) => {
    //     const { explorer, getGasPrice, completeEthereumTx, chainId } = ethereum;

    //     const bytes = readFileSync(path, 'utf8');

    //     const provider = getSepoliaProvider();
    //     const nonce = await provider.getTransactionCount(address);

    //     const contractAddress = ethers.utils.getContractAddress({
    //         from: address,
    //         nonce,
    //     });

    //     console.log(
    //         'deploying bytes',
    //         bytes.length,
    //         'to address',
    //         contractAddress,
    //     );

    //     const cont = await prompts({
    //         type: 'confirm',
    //         name: 'value',
    //         message: 'Confirm? (y or n)',
    //         initial: true,
    //     });
    //     if (!cont.value) return;

    //     const gasPrice = await getGasPrice();

    //     const baseTx = {
    //         nonce,
    //         data: bytes,
    //         value: 0,
    //         gasLimit: 6000000, // 6m gas
    //         gasPrice,
    //         chainId,
    //     };

    //     await completeEthereumTx({ address, baseTx });

    //     console.log('contract deployed successfully to address:');
    //     console.log(contractAddress);
    //     console.log('explorer link', `${explorer}/address/${contractAddress}`);
    // },

    view: async ({
        to = '0x09a1a4e1cfca73c2e4f6599a7e6b98708fda2664',
        method = 'balanceOf',
        args = { address: '0x525521d79134822a342d330bd91da67976569af1' },
        ret = ['uint256'],
    }) => {
        const provider = getSepoliaProvider();
        console.log('view contract', to);
        const { data, iface } = encodeData({ method, args, ret });
        const res = await provider.call({
            to,
            data,
        });
        const decoded = iface.decodeFunctionResult(method, res);
        console.log('view result', decoded.toString());
    },

    call: async ({
        from: address,
        to = '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        method = 'mint',
        args = {
            address: '0xbdDBD3A43F2474147C48CA56dc849edB981145A0',
            uint256: '1337000000000000000000',
        },
        ret = [],
    }) => {
        const { getGasPrice, completeEthereumTx, chainId, getBalance } =
            ethereum;

        const balance = await getBalance({ address });
        console.log('from account balance', balance);

        const provider = getSepoliaProvider();
        console.log('call contract', to);
        const { data } = encodeData({ method, args, ret });

        const gasPrice = await getGasPrice();
        const nonce = await provider.getTransactionCount(address);
        const baseTx = {
            to,
            nonce,
            data,
            value: 0,
            gasLimit: 1000000, // 1m
            gasPrice,
            chainId,
        };

        return await completeEthereumTx({ address, baseTx });
    },

    completeEthereumTx: async ({ address, baseTx }) => {
        const { chainId, getBalance, explorer, currency } = ethereum;

        // create hash of unsigned TX to sign -> payload
        const tx = ethers.Transaction.from(baseTx);
        const hexPayload = ethers.keccak256(
            ethers.getBytes(tx.unsignedSerialized),
        );
        const serializedTxHash = Buffer.from(hexPayload.substring(2), 'hex');

        const sigRes = await contractCall({
            accountId: undefined,
            methodName: 'get_signature',
            args: {
                payload: [...serializedTxHash],
                path: 'shadeagent007',
            },
        });

        const signature = ethers.Signature.from({
            r:
                '0x' +
                Buffer.from(
                    sigRes.big_r.affine_point.substring(2),
                    'hex',
                ).toString('hex'),
            s: '0x' + Buffer.from(sigRes.s.scalar, 'hex').toString('hex'),
            v: sigRes.recovery_id + (chainId * 2 + 35),
        });
        console.log(
            'ethers recoverAddress:',
            ethers.recoverAddress(serializedTxHash, signature),
        );
        tx.signature = signature;
        console.log('tx', tx);
        const serializedTx = tx.serialized;
        console.log('serializedTx', serializedTx);

        // broadcast TX - signature now has correct { r, s, v }
        try {
            const hash = await getSepoliaProvider().send(
                'eth_sendRawTransaction',
                [serializedTx],
            );
            console.log('SUCCESS! TX HASH:', hash);
        } catch (e) {
            if (/nonce too low/gi.test(JSON.stringify(e))) {
                return console.log('tx has been tried');
            }
            if (/gas too low|underpriced/gi.test(JSON.stringify(e))) {
                return console.log(e);
            }
            console.log(e);
        }
    },
};

const encodeData = ({ method, args, ret }) => {
    const abi = [
        `function ${method}(${Object.keys(args).join(',')}) returns (${ret.join(
            ',',
        )})`,
    ];
    const iface = new ethers.Interface(abi);
    const allArgs: any[] = [];
    const argValues = Object.values(args);
    for (let i = 0; i < argValues.length; i++) {
        allArgs.push(argValues[i]);
    }

    console.log(abi[0], 'with args', allArgs);

    return {
        iface,
        data: iface.encodeFunctionData(method, allArgs),
    };
};

const getSepoliaProvider = () => {
    return new ethers.JsonRpcProvider(
        networkId === 'mainnet'
            ? 'https://rpc.hyperliquid.xyz/evm'
            : 'https://rpc.hyperliquid-testnet.xyz/evm',
    );
};

export default ethereum;

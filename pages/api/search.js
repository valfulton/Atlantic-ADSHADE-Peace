import { SearchMode, twitter, generateAddress } from '@neardefi/shade-agent-js';
import { ethereum } from '../../utils/ethereum';
import { sleep } from '../../utils/utils';

const COST = BigInt('1000000000000000');
const MAX_POLL = 120; // 10 minutes to deposit
const polls = {
    '0x': { attempts: 0, receiver: '0x' },
};
const replied = [];

const pollBalance = async (address) => {
    const balance = await ethereum.getBalance({ address });

    if (balance == 0 && polls[address].attempts < MAX_POLL) {
        polls[address].attempts++;
        await sleep(5000);
        pollBalance(address);
        return;
    }

    if (balance >= COST) {
        const { name, bankrbotAddress } = polls[address];
    } else {
        // return balance to bankrbot address
    }
};

export default async function search(req, res) {
    // Search for recent tweets
    const results = await twitter.searchTweets(
        '@shadeagent007 "base.eth" "@bankrbot"',
        100,
        SearchMode.Latest,
    );
    const tweets = await Array.fromAsync(results);

    for (const t of tweets) {
        if (replied.includes(t.id)) continue;

        replied.push(t.id);

        // TODO parse tweet for name, bankrbot address
        const name = 'foo',
            bankrbotAddress = '0xf00';

        // check if name is taken already

        // everything valid? respond.

        const { address } = await generateAddress({
            publicKey: process.env.MPC_PUBLIC_KEY_TESTNET,
            accountId: process.env.NEXT_PUBLIC_contractId,
            path: t.username + '-basednames',
            chain: 'evm',
        });

        await twitter.sendTweet(
            `😎 Send 0.001 ETH on base to: ${address} in the next 10 mins, and I'll buy ${chosenName} for you!`,
            t.id,
        );

        // poll for the balance of the deposit address
        if (!polls[address]) {
            polls[address] = {
                attempts: 0,
                bankrbotAddress,
                name,
            };
            pollBalance(address);
        }
    }

    res.status(200).json({ replied, tweets });
}

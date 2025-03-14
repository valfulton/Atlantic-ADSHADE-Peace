import { SearchMode, twitter, generateAddress } from '@neardefi/shade-agent-js';
const replied = [];

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

        // check if name is taken already

        // everything valid? respond.

        const { address } = await generateAddress({
            publicKey: process.env.MPC_PUBLIC_KEY_TESTNET,
            accountId: process.env.NEXT_PUBLIC_contractId,
            path: t.username + '-basednames',
            chain: 'evm',
        });

        await twitter.sendTweet(
            `😎 Send 0.001 ETH on base to: ${address} and I'll buy ${chosenName} for you!`,
            t.id,
        );
    }

    res.status(200).json({ replied, tweets });
}

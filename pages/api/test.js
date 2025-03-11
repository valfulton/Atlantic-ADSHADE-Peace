import { SearchMode, twitter, generateAddress } from '../../temp/index.cjs';

const replied = [];

export default async function test(req, res) {
    // Search for recent tweets
    const results = await twitter.searchTweets(
        '@shadeagent007 "evm account"',
        100,
        SearchMode.Latest,
    );

    const tweets = await Array.fromAsync(results);

    for (const t of tweets) {
        if (replied.includes(t.id)) continue;

        replied.push(t.id);

        const { address } = await generateAddress({
            publicKey: process.env.MPC_PUBLIC_KEY_TESTNET,
            accountId: process.env.NEXT_PUBLIC_contractId,
            path: t.username,
            chain: 'evm',
        });

        await twitter.sendTweet(
            `😎 Sup @${t.username}! I gotchu an evm account right hurr: ${address}`,
            t.id,
        );
    }

    res.status(200).json({ replied, tweets });
}

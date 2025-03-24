import { TwitterApi } from 'twitter-api-v2';

export default async function search(req, res) {
    const consumerClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
    });
    // Obtain app-only client
    const client = await consumerClient.appLogin();

    const tweetGenerator = await client.v2.search(
        '@shadeagent007 ".base.eth"',
        {
            'tweet.fields': 'created_at', // Edit optional query parameters here
        },
    );

    console.log('remaining API calls', tweetGenerator._rateLimit.remaining);
    if (tweetGenerator._rateLimit.remaining < 2) {
        // cooldown
    }

    console.log(tweetGenerator);

    let seen = 0;
    const limit = 99;
    for await (const tweet of tweetGenerator) {
        if (++seen > limit) break;

        const { text, created_at } = tweet;
        tweet.timestamp = new Date(tweet.created_at).getTime() / 1000;
    }

    res.status(200).json({ pendingReply: true });
}

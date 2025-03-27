import { generateAddress, networkId } from '@neardefi/shade-agent-js';
import { evm } from '../../utils/evm';
import { fetchJson, sleep } from '../../utils/utils';
import { TwitterApi } from 'twitter-api-v2';

const DEPOSIT_PROCESSING_DELAY = 5000;
const REPLY_PROCESSING_DELAY = 15000;
const REFUND_PROCESSING_DELAY = 60000;
const MAX_DEPOSIT_ATTEMPTS = 12 * 60; // 12 per minute * 60 mins
const pendingReply = [];
const pendingDeposit = [];
let lastTweetTimestamp = parseInt(process.env.TWITTER_LAST_TIMESTAMP);
let waitingForReset = 0;
const pendingRefund = [];
const refunded = [];

let accessToken = process.env.TWITTER_ACCESS_TOKEN;
let refreshToken = process.env.TWITTER_REFRESH_TOKEN;

let FAKE_REPLY = true;

const sleepThen = async (dur, fn) => {
    await sleep(dur);
    fn();
};

const refreshAccessToken = async () => {
    console.log('refreshAccessToken');
    const client = new TwitterApi({
        clientId: process.env.TWITTER_CLIENT_KEY,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });
    try {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await client.refreshOAuth2Token(refreshToken);
        accessToken = newAccessToken;
        refreshToken = newRefreshToken;
        console.log('success refreshAccessToken', accessToken);
    } catch (e) {
        console.log('error refreshAccessToken');
        console.log(e);
    }
};

const replyToTweet = async (text, id, secondAttempt = false) => {
    console.log('replyToTweet');
    const client = new TwitterApi(accessToken);
    let res;
    try {
        console.log('client.v2.reply', id);
        res = FAKE_REPLY ? { data: true } : await client.v2.reply(text, id);
    } catch (e) {
        console.log('error', e);
        if (!secondAttempt && /401/gi.test(JSON.stringify(e))) {
            await refreshAccessToken();
            res = await replyToTweet(text, id, true);
        }
    }
    console.log(res);
    return res;
};

export const getRefunded = () => refunded;

const processRefunds = async () => {
    const tweet = pendingRefund.shift();
    if (!tweet) {
        await sleepThen(REFUND_PROCESSING_DELAY, processRefunds);
        return;
    }
    console.log('refund tweet.id', tweet.id);

    // whether successful or not, store this tweet in case we need to resolve manually
    // need tweet.path to generate signature
    refunded.push(tweet);

    const { result } = await fetchJson(
        `https://api${
            networkId === 'testnet' ? '-sepolia' : ''
        }.basescan.org/api?module=account&action=txlist&address=${
            tweet.address
        }&startblock=0&endblock=latest&page=1&offset=10&sort=asc&apikey=${
            process.env.BASE_API_KEY
        }`,
    );
    const tx = result[0];

    if (tx && tx.from) {
        const balance = await evm.getBalance({
            address: tweet.address,
        });
        const feeData = await evm.getGasPrice();
        const gasPrice =
            BigInt(feeData.maxFeePerGas) + BigInt(feeData.maxPriorityFeePerGas);
        const gasLimit = 21000n;
        const gasFee = gasPrice * gasLimit;
        const amount = evm.formatBalance(balance - gasFee);

        try {
            await evm.send({
                path: tweet.path,
                from: tweet.address,
                to: tx.from,
                amount,
            });
        } catch (e) {
            console.log(e);
        }
    }

    // check again
    await sleepThen(REFUND_PROCESSING_DELAY, processRefunds);
};
processRefunds();

// processing deposits and registering basenames

const processDeposits = async () => {
    const tweet = pendingDeposit.shift();
    if (!tweet || tweet.depositAttempt >= MAX_DEPOSIT_ATTEMPTS) {
        if (tweet) {
            pendingRefund.push(tweet);
        }
        await sleepThen(DEPOSIT_PROCESSING_DELAY, processDeposits);
        return;
    }
    console.log('processing deposit', tweet.depositAttempt, tweet.address);

    const balance = await evm.getBalance({ address: tweet.address });
    console.log('balance', evm.formatBalance(balance));

    if (balance >= tweet.price) {
        const { result } = await fetchJson(
            `https://api${
                networkId === 'testnet' ? '-sepolia' : ''
            }.basescan.org/api?module=account&action=txlist&address=${
                tweet.address
            }&startblock=0&endblock=latest&page=1&offset=10&sort=asc&apikey=${
                process.env.BASE_API_KEY
            }`,
        );
        const tx = result[0];
        console.log('DEPOSIT tx.from', tx.from);

        if (tx && tx.from) {
            try {
                await evm.getBasenameTx(
                    tweet.path,
                    tweet.basename,
                    tweet.address,
                    tx.from,
                );

                await replyToTweet(
                    `😎 I gotchu ${tweet.basename} and it's registered to ${tweet.address}`,
                    tweet.id,
                );
            } catch (e) {
                console.log(e);
            }

            // leftovers? whether successful or not
            const balance = await evm.getBalance({ address: tweet.address });
            if (balance > 0n) {
                pendingRefund.push(tweet);
            }

            await sleepThen(DEPOSIT_PROCESSING_DELAY, processDeposits);
            return;
        }
    }

    tweet.depositAttempt++;
    pendingDeposit.push(tweet);
    await sleepThen(DEPOSIT_PROCESSING_DELAY, processDeposits);
};
processDeposits();

// processing the tweet reply

const processReplies = async () => {
    const tweet = pendingReply.shift();
    if (!tweet || tweet.replyAttempt >= 3) {
        await sleepThen(REPLY_PROCESSING_DELAY, processReplies);
        return;
    }
    console.log('processing reply', tweet.id);

    tweet.path = `${tweet.author_id}-${tweet.basename}`;
    // generate deposit address
    const { address } = await generateAddress({
        publicKey:
            networkId === 'testnet'
                ? process.env.MPC_PUBLIC_KEY_TESTNET
                : process.env.MPC_PUBLIC_KEY_MAINNET,
        accountId: process.env.NEXT_PUBLIC_contractId,
        path: tweet.path,
        chain: 'evm',
    });
    tweet.address = address;

    const basenameInfo = await evm.checkBasename(tweet.basename);

    // bail on this name if it's not valid or available
    if (!basenameInfo.isValid) {
        await replyToTweet(
            `😎 Sorry ${tweet.basename} is not a valid basename!`,
            tweet.id,
        );
        await sleepThen(REPLY_PROCESSING_DELAY, processReplies);
        return;
    }

    if (!basenameInfo.isAvailable) {
        await replyToTweet(
            `😎 Sorry ${tweet.basename} is not available!`,
            tweet.id,
        );
        await sleepThen(REPLY_PROCESSING_DELAY, processReplies);
        return;
    }

    // name isValid and isAvailable
    tweet.price = basenameInfo.price + 32000000000000n; // + 0.000032 ETH to pay for gas
    // shouldn't exceed 0.00013 ETH
    if (tweet.price > 130000000000000n) {
        tweet.price = 130000000000000n;
    }
    const formatedPrice = evm.formatBalance(tweet.price).substring(0, 7);
    console.log('formatedPrice', formatedPrice);

    const res = await replyToTweet(
        `😎 Time's ticking - send ${formatedPrice} to ${tweet.address} in next 10 min to secure your basename ${tweet.basename}. Late? You might miss out & risk losing the funds. Terms in Bio.`,
        tweet.id,
    );

    // move to pendingDeposit
    if (res?.data) {
        console.log('reply sent', tweet.id);
        // move to pendingDeposit
        tweet.depositAttempt = 0;
        pendingDeposit.push(tweet);
    } else {
        // retry reply
        tweet.replyAttempt++;
        pendingReply.push(tweet);
    }

    await sleepThen(REPLY_PROCESSING_DELAY, processReplies);
};
processReplies();

export default async function search(req, res) {
    // rate limited?
    if (waitingForReset !== 0 && Date.now() / 1000 < waitingForReset) {
        return;
    }
    waitingForReset = 0;

    // nope
    const consumerClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
    });
    // app-only client
    const client = await consumerClient.appLogin();

    // search
    const start_time =
        lastTweetTimestamp > 0
            ? new Date(lastTweetTimestamp * 1000 + 1000).toISOString()
            : undefined;
    console.log('search start_time', start_time);
    const tweetGenerator = await client.v2.search('@basednames ".base.eth"', {
        start_time,
        'tweet.fields': 'author_id,created_at',
    });

    console.log('REMAINING API CALLS', tweetGenerator._rateLimit.remaining);
    console.log(
        'RESET',
        Number(
            (tweetGenerator._rateLimit.reset - Date.now() / 1000) / 60,
        ).toPrecision(4) + ' minutes',
    );
    if (tweetGenerator._rateLimit.remaining <= 0) {
        waitingForReset = tweetGenerator._rateLimit.reset;
    }

    let seen = 0;
    const limit = 99;
    let latestValidTimestamp = 0;
    for await (const tweet of tweetGenerator) {
        if (++seen > limit) break;

        console.log('reading tweet', tweet.id);
        tweet.timestamp = new Date(tweet.created_at).getTime() / 1000;

        // tweet not in pending state
        if (
            pendingReply.findIndex((t) => t.id === tweet.id) > -1 ||
            pendingDeposit.findIndex((t) => t.id === tweet.id) > -1
        ) {
            continue;
        }
        // validate tweet contents
        tweet.basename = tweet.text.match(/[a-zA-Z0-9]{3,}.base.eth/gim)?.[0];
        if (!tweet.basename) {
            continue;
        }
        // make sure we haven't seen it before
        if (tweet.timestamp <= lastTweetTimestamp) {
            continue;
        }

        if (latestValidTimestamp === 0) {
            latestValidTimestamp = tweet.timestamp;
        }
        //qualifies
        console.log('tweet qualified', tweet.id);
        tweet.replyAttempt = 0;
        pendingReply.push(tweet);
    }
    // we won't see these valid tweets in the next API call
    if (latestValidTimestamp > 0) {
        lastTweetTimestamp = latestValidTimestamp;
    }

    console.log('lastTweetTimestamp', lastTweetTimestamp);
    console.log('pendingReply.length', pendingReply.length);

    res.status(200).json({ pendingReply: pendingReply.length });
}

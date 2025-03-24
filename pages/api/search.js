import {
    SearchMode,
    twitter,
    generateAddress,
    networkId,
} from '@neardefi/shade-agent-js';
import { evm } from '../../utils/evm';
import { fetchJson, sleep } from '../../utils/utils';

const MAX_POLL = 1; // 10 minutes to deposit
let processingReplies = false;
const pendingReply = [];
let processingDeposits = false;
const pendingDeposit = [];
let lastTweetTimestamp = 0;

const processDeposits = async () => {
    const tweet = pendingDeposit.shift();
    if (!tweet || tweet.depositAttempt >= MAX_POLL) {
        processingDeposits = false;
        return;
    }
    processingDeposits = true;
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

        if (tx) {
            await evm.getBasenameTx(
                tweet.path,
                tweet.basename,
                tweet.address,
                tx.from,
            );

            // await evm.send({
            //     path: tweet.path,
            //     from: tweet.address,
            // });

            return;
        }
    } else {
        // what to do?
        // send funds back?
        tweet.depositAttempt++;
        pendingDeposit.push(tweet);
    }

    tweet.depositAttempt++;
    pendingDeposit.push(tweet);
    await sleep(15000);
    processDeposits();
};

const processReplies = async () => {
    const tweet = pendingReply.shift();
    if (!tweet || tweet.replyAttempt >= 3) {
        processingReplies = false;
        return;
    }
    processingReplies = true;
    console.log('processing reply', tweet.id);

    tweet.path = `${tweet.username}-${tweet.basename}`;
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

    const basenameInfo = await evm.checkBasename('s' + tweet.basename);
    tweet.price = basenameInfo.price + 32000000000000n; // + 0.000032 ETH to pay for gas
    // shouldn't exceed 0.00013 ETH
    if (tweet.price > 130000000000000n) {
        tweet.price = 130000000000000n;
    }
    const formatedPrice = evm.formatBalance(tweet.price).substring(0, 7);

    // let res;
    // try {
    //     res = await twitter.sendTweet(
    //         `😎 Send ${formatedPrice} ETH on base to: ${tweet.address} in the next 10 mins, and I'll buy ${tweet.basename} for you!`,
    //         tweet.id,
    //     );
    // } catch (e) {
    //     console.log(e);
    // }

    // // move to pendingDeposit
    // if (res.ok) {
    //     console.log('tweet reply sent')
    //     // move to pendingDeposit
    //     tweet.depositAttempt = 0;
    //     pendingDeposit.push(tweet);
    //     if (!processingDeposits) {
    //         processDeposits();
    //     }
    //     return;
    // }

    // retry
    tweet.replyAttempt++;
    pendingReply.push(tweet);

    await sleep(15000);
    processReplies();
};

export default async function search(req, res) {
    // Search for recent tweets
    const results = await twitter.searchTweets(
        '@shadeagent007 .base.eth',
        100,
        SearchMode.Latest,
    );

    const tweets = await Array.fromAsync(results);

    for (const tweet of tweets) {
        // make sure tweet is not in pending state
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

        if (tweet.timestamp <= lastTweetTimestamp) {
            continue;
        }

        //qualifies
        lastTweetTimestamp = tweet.timestamp;

        tweet.replyAttempt = 0;
        pendingReply.push(tweet);
    }

    res.status(200).json({ pendingReply: pendingReply.length });

    if (!processingReplies) {
        processReplies();
    }
}

require('dotenv').config();
const express = require('express');
const { TwitterApi } = require('twitter-api-v2');

const app = express();
const PORT = 3000;

const client = new TwitterApi({
    appKey: process.env.TWITTER_CLIENT_KEY,
    appSecret: process.env.TWITTER_CLIENT_SECRET,
});

let tempAuthData = {};

app.get('/auth', async (req, res) => {
    try {
        const { url, oauth_token, oauth_token_secret } =
            await client.generateAuthLink();
        tempAuthData[oauth_token] = oauth_token_secret;
        res.redirect(url);
    } catch (error) {
        res.status(500).send('Auth initiation failed');
    }
});

app.get('/callback', async (req, res) => {
    const { oauth_token, oauth_verifier: pin } = req.query;
    const oauth_token_secret = tempAuthData[oauth_token];

    if (!pin || !oauth_token || !oauth_token_secret) {
        return res.status(400).send('Invalid callback parameters');
    }

    try {
        const { client: userClient } = await client.loginWithOAuth1({
            oauth_token,
            oauth_token_secret,
            oauth_verifier: pin,
        });

        const { accessToken, accessSecret } = userClient.getCredentials();
        res.send(`
      Access Token: ${accessToken}<br>
      Access Secret: ${accessSecret}
    `);

        delete tempAuthData[oauth_token];
    } catch (error) {
        res.status(500).send('Token exchange failed');
    }
});

app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`),
);

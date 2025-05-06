Atlantic ADSHADE Peace: @basednames Bot

HoneyVault, BankerBee, and SweetShade present the Atlantic ADSHADE Peace bot—a non-custodial worker agent running in a Trusted Execution Environment (TEE) on Phala Cloud. It uses NEAR's chain signatures to purchase .base.eth names on the Base (Coinbase) chain, with banking-grade security and privacy.

Join the Shade Agents Dev Group for support!

How It Works





User tweets: "Hey @basednames buy [DESIRED_NAME].base.eth for me!"



Bot responds: "On it! Send 0.01 ETH to [UNIQUE_ADDRESS] on Base..."



User sends funds via wallet or BankerBee swaps.



Bot verifies deposit, buys the name, and assigns it to the user’s address.



Bot refunds excess ETH atomically.



Bot tweets: "Done! Tx: [BASESCAN_LINK]"

Features





HoneyVault Security: Tokens stored in HashiCorp Vault and encrypted PostgreSQL, protected by TEE.



BankerBee Swaps: Supports ETH and USDC payments with cross-chain swaps via NEAR Intents.



SweetShade Privacy: Runs in a TEE with verifiable codehash, ensuring data freedom.



Automated OAuth 2.0: Twitter API V2 with automatic token refresh.



Secure ngrok: IP-restricted tunnels with TLS and automated token rotation.

Setup

Prerequisites





Node.js, Yarn, Docker



Twitter Developer Account (Paid plan)



HashiCorp Vault and PostgreSQL instances



Phala Cloud account



Base chain RPC and wallet

Installation





Clone the repo:

git clone https://github.com/valfulton/Atlantic-ADSHADE-Peace.git
cd Atlantic-ADSHADE-Peace



Install dependencies:

yarn



Configure environment variables in .env:

VAULT_ENDPOINT=https://vault.yourdomain.com
VAULT_TOKEN=your_vault_token
PG_USER=your_pg_user
PG_HOST=your_pg_host
PG_DATABASE=your_pg_database
PG_PASSWORD=your_pg_password
PG_PORT=5432
TWITTER_CLIENT_KEY=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
NGROK_API_KEY=your_ngrok_api_key
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_tee_derived_private_key
NAME_PURCHASE_CONTRACT_ADDRESS=your_contract_address
TWITTER_LAST_TIMESTAMP=0
NEXT_PUBLIC_contractId=your_shade_agent_contract
MPC_PUBLIC_KEY_TESTNET=https://docs.near.org/...
MPC_PUBLIC_KEY_MAINNET=https://docs.near.org/...
RESTART_PASS=your_custom_password

Twitter Authentication





Create a Twitter app at developer.twitter.com.



Set permissions to "Read and Write" and enable OAuth 2.0.



Add callback URL: https://your-ngrok-domain.ngrok.io/callback.



Run authentication server:

node utils/auth.js



Navigate to http://localhost:3000, authorize, and store tokens in HoneyVault.

Deployment





Build and push Docker image:

yarn docker:build
yarn docker:push



Update docker-compose.yaml with your Docker Hub repo and SHA256 hash.



Deploy on Phala Cloud:





Go to Phala Cloud, select "Deploy from Docker Compose."



Paste docker-compose.yaml and configure resources (prod5, tdx.small).



Verify codehash via Phala’s TEE Attestation Explorer.

Database Setup





Create transaction and state tables:

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  twitter_id TEXT NOT NULL,
  desired_name TEXT NOT NULL,
  deposit_address TEXT NOT NULL,
  status TEXT NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMP NOT NULL
);
CREATE TABLE twitter_tokens (
  id SERIAL PRIMARY KEY,
  vault_path TEXT NOT NULL,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  encryption_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE bot_state (
  id SERIAL PRIMARY KEY,
  last_seen_tweet TEXT NOT NULL
);



Initialize state:

INSERT INTO bot_state (last_seen_tweet) VALUES ('0') ON CONFLICT DO NOTHING;

Running Locally





Start development server:

yarn dev



Test Twitter searches and name purchases on Base testnet.

Security Best Practices





HoneyVault: Encrypt tokens and restrict access to TEE-derived keys.



BankerBee: Use unique deposit addresses and signed wallet linking.



SweetShade: Verify TEE codehash and audit smart contracts.



Rate Limits: Store lastSeenTweet and check API limits.



ngrok: Automate IP restrictions, TLS, and token rotation.

Smart Contract

Deploy the NamePurchase contract on Base:

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NamePurchase {
    address public owner;
    uint256 public namePrice = 0.01 ether;

    constructor() {
        owner = msg.sender;
    }

    function purchaseName(string memory name, address targetAddress) external payable {
        require(msg.value >= namePrice, "Insufficient ETH");
        uint256 excess = msg.value - namePrice;

        // Call Base name registry (placeholder)
        // BaseNameRegistry.register(name, targetAddress);

        if (excess > 0) {
            (bool sent, ) = msg.sender.call{value: excess}("");
            require(sent, "Refund failed");
        }

        emit NamePurchased(name, targetAddress, namePrice);
    }

    event NamePurchased(string name, address targetAddress, uint256 price);
}

Contributing

Fork, create PRs, and join the Shade Agents Dev Group to contribute to Atlantic ADSHADE Peace!

License

MIT License

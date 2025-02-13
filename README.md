# Based Agent Template

This is a monorepo template for deploying a Based Agent on NEAR and Phala Cloud.

The template has 2 main components:

1. Worker Agent - NextJS docker app with API and UI for interactive demo. Fetches data from TEE environment, creates a unique account for the instance of the TEE and interacts with the Smart Contract.
1. Smart Contract - Verifies the Worker Agent's TEE environment and codehash. Provides example methods for Worker Agent access control based on codehash.

## Walkthough for Devs

[![Workshop Video](https://img.youtube.com/vi/MCUWLUZuqJc/0.jpg)](https://youtu.be/MCUWLUZuqJc)

# Based Agents

Based Agents are multichain crypto AI agents, verifiable from source code through to their transactions across any blockchain.

Based Agents can:

-   Verifiably access off-chain LLMs, APIs and data
-   Sign transactions for any chain
-   Custody cryptoassets
-   Preserve privacy

![image](https://github.com/user-attachments/assets/9b0e4769-ffd0-4633-a1df-fc4db64516e9)

Components of a Based Agent are:

1. Worker Agent deployment in a TEE
1. Smart Contract to verify a TEE's remote attestation and stack
1. NEAR Intents and Chain Signatures for multichain swaps and key management

## 1. Worker Agent Deployment in a TEE on Phala Cloud

### Worker Agent

Worker Agents act as a bridge between the LLMs and the Smart Contracts that open them up to any blockchains.

The template includes the following code for the Worker Agent:

1. Account derivation - derives a unique key (a NEAR Account) in the TEE instance. This key is in memory and inside the TEE, unable to be exfiltrated, verifiable by code inspection and the SHA256 hash of the docker image.
1. `register_worke` - a TEE's remote attestation, including the Phala checksum and Docker image codehash are submitted to the Smart Contract from the TEE's derived account and verified by the contract.
1. `get_worker` - a convenience method to return the checksum for the Phala attestation explorer and the codehash of the docker image the Worker Agent is running.
1. `is_verified_by_codehash(codehash)` - an example method which checks a Worker Agent is registered in the contract with the provided codehash matching the argument. **One example of how we can protect smart contract methods by only allowing access to registered Worker Agents with the correct code.**

Subsequent Worker Agent code and calls to the NEAR Contract are left to the developer and their custom smart contract development for their projects using Based Agents.

### Availability

Worker Agents can go offline. However, anyone with access to the same docker image can boot their own instance inside a TEE and register in the smart contract. This provides the new instance of the Worker Agent with access to the same methods as a previous instance.

### What can be include in the Worker Agent? (remember it's verified!):

Worker agents are stateless and ephemeral.

-   Deterministic or stochastic rules
-   Pre/post process LLM prompts/inference for smart contract method calls
-   Arbitrary offchain compute, VMs, LLMs
-   Access APIs and the web

### Phala Cloud

Phala Cloud is a TEE as a service provider to deploy multiple docker images inside a trusted execution environment. This environment exposes their dStack SDK to access the remote attestation of the TEE, derive entropy from a decentralized Key Management Service (KMS). dStack also provides the docker image codehash of the code running in the TEE.

Based Agents gather the following data from the TEE Deployment on Phala Cloud:

1. Remote attestation quote
1. Unique key derived from entropy and the TEE's KMS
1. docker-compose.yaml data which contains the SHA256 hash of the docker image

![image](https://github.com/user-attachments/assets/aae0db8a-cbcb-4a30-858b-3fcadc0f1f17)

## 2. Smart Contract

The template provides a NEAR Smart Contract for the following:

1. Registration - verify a TEE's remote attestation and store the checksum and codehash.
1. Example Method Access Control - a few helper methods demonstrating protected methods by the registered worker's codehash.

## 3. NEAR Intents and Chain Signatures

[NEAR Intents](https://docs.near.org/build/chain-abstraction/what-is#intent--solver-layer)

[NEAR Chain Signatures](https://docs.near.org/concepts/abstraction/chain-signatures)

# What can be built with Based Agents?

Pretty much anything...

## A few ideas

1. Mindshare Index Fund - Tracks mindshare metrics like Kaito. Rebalances pool of assets between any chain: BTC, XRP, SOL, ETH, HYPE.
1. Decentralized Solvers - Accepts asset deposits on any chain. Utilizes off-chain data to fulfill user intents. Rebalances across all major DEXs, bridges, etc.
1. Prediction Market for Anything - Market creators define resolution criteria and sources. Worker agents query sources, vote on resolution. Resolves immediately, no need for challenge periods.
1. Lending Optimizers - Accepts asset deposits on any chain. Matches borrow requests instantly, at better rate than any pool-based lender (by using midpoint rate between borrow and lend rates on pool-based protocols). Rebalances between various pool-based products to optimize both borrow and lend rates.
1. Twitter Bet Escrow - User can propose a bet to another user with odds. Worker agents create a market, define resolution criteria. Both users deposit funds into contract, worker agents resolve market.

## How to leverage LLMs

_LLMs running in TEEs with the Based Agent stack = verifiable inference_

LLMs deployed as docker images can easily be leveraged by other applications deployed in the same docker stack. With Based Agents, an LLM deployed as a docker image is used by the Worker Agent in the same docker stack on the Trusted Execution Environment (TEE). Based Agents can use 1 or more LLMs to provide the inference for the Worker Agent.

LLMs could be used to:

-   interpret API calls and provide reasoning and inference that translates these to more specific smart contract method calls
-   digest sentiment from realtime data and provide higher order actions
-   reason about multiple sources and provide summary insights, for example Based Agent price oracle vs. multi party computation

# How a Based Agent is Verified?

Based Agents have a Worker Agent that is running inside a trusted execution environment (TEE) and a NEAR Smart Contract deployed onchain. Here are the following steps that the Worker Agent takes to verify itself onchain, so that subsequent calls from the Worker Agent can be trusted.

## 1. Ephemeral key for a NEAR Account

The Worker Agent has an API route (`/pages/api/derive`) that creates a key derived from the TEE's hardware KMS and additional entropy. _If the TEE is rebooted, or redeployed a new account would be created and need to be funded_. Loss of funds from these accounts which are only used to pay gas for transactions can be mitigated by periodically deploying minimal funds or using NEAR's Meta Transactions to fund the smart contract calls.

A new instanct of the Worker Agent deployed with the same code will have access to the same methods in the Smart Contract, this is by design. The worker agent registration (described above) verifies the TEE and the codehash of the Worker Agent.

The Based Agent stack design pattern protects the Smart Contract methods by registered Worker Agent's with the correct codehash.

## 2. Remote Attestation (RA) quote, quote collateral and docker image hashes

The Worker Agent's register route (`/pages/api/register`) gets the remote attestation quote in hex, gets the necessary quote collateral through a Phala API call that is verified through a PCCS_URL from Intel, and lastly the `docker_compose.yaml` data for the TEE's deployment returned.

All arguments are made to the NEAR Contract's `register_worker` method. The contract checks the quote using Phala's [dcap-qvl](https://github.com/Phala-Network/dcap-qvl) Rust crate and a verified report about the TEE is returned.

Once a Worker Agent is verified, the NEAR Account of the Worker Agent is registered in the contract for future calls.

Also stored for each Worker Agent is:

-   the SHA256 hash of the Worker Agent docker image so that the code running is verifiable
-   the checksum of the RA quote which can be verified on Phala Cloud's [TEE Attesation Explorer](https://proof.t16z.com/)

# Local Development and Example UI

The Worker Agent template is a NextJS application that offers both an API via the `/pages/api` routes and an optional UI under `/pages`.

The UI found at `index.js` is intended to guide through the first steps of verifying the worker agent running in the TEE against the NEAR Contract. _Note: this is only possible when deployed on Phala Cloud._ In order to pass the verification in the NEAR Contract, your API Layer must be deployed on Phala Cloud and running on TEE hardware to get a valid remote attestation (RA) quote, that can be verified by the NEAR Contract.

However, this does not stop you from developing your Worker Agent. You can add your own API routes, call external APIs, work with data, and prepare your NEAR Contract calls. In fact, you can skip the verification step in your NEAR Contract, and make calls with the assumption that you will add in the proper logic to "allow list" these calls only by verified based agents when the NEAR Contract is deployed live.

To develop locally, you need only use:

-   `yarn`
-   `yarn dev`

For making calls to the NEAR Contract it's recommended you provide a local `.env.development.local` file with the following fields:

```bash
NEXT_PUBLIC_accountId=[YOUR_NEAR_DEV_ACCOUNT_ID]
NEXT_PUBLIC_secretKey=[YOUR_NEAR_DEV_ACCOUNT_SECRET_KEY]
NEXT_PUBLIC_contractId=[YOUR_PROTOCOL_NAME].[YOUR_NEAR_DEV_ACCOUNT_ID]
```

This dev account will be used to call the NEAR Contract. It won't be used when you deploy to Phala Cloud. The template will create an ephemeral NEAR Account and in the UI example will ask for funds before verification and subsequent calls to the contract can be made.

Unless you con

# NEAR Contract & Local Development

Local development of the NEAR Contract has a few dependencies. You will need to have Rust installed and you will also need [cargo near](https://github.com/near/cargo-near).

The contract provides only the basic methods to verify the Worker Agent's remote attesation (RA) quote coming from the TEE deployed on Phala Cloud.

This is handled by the `register_worker` method in `lib.rs`. See the Worker Agent route `pages/api/verify` for more information on where the data is gathered for this call.

## Futher Development

The NEAR Contract stores the Worker Agent's SHA256 of the docker image, and the checksum (Phala Cloud Attestation Explorer link can be generated from this).

Using the SHA256 code hash as the Worker Agent's main identifier, you can create the following:

1. `require!(worker.hash === protocol.hash)` - method calls can only be called by verified Worker Agent
1. Worker Agent group policy - multiple agents from multiple different TEE deployments can register with the same code hash
1. Upgrade a Worker Agent - create a proposal for a new code hash, cooldown period for previous code hash (withdraw window)

## Running the Smart Contract test

An e2e JavaScript test with `yarn test` is provided that will build and redeploy the contract to the sub account of your dev account.

**Quirk: add `"type":"module"` to `package.json` before running tests. You will need to remove this before using NextJS `dev` or `build` again.**

## Building the Worker Agent with YOUR Smart Contract

In the `.env` file at the root:

```bash
NEXT_PUBLIC_contractId=dcap.magical-part.testnet
```

Your docker build of your NextJS app can target this contract by including the contractId in the Dockerfile.

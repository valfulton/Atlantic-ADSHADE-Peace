# Based Agent Template

This is a monorepo template for deploying a Based Agent on NEAR and Phala Cloud.

The template has 2 main components to code and deploy: a NEAR smart contract and a NextJS docker application with API.

# Based Agents

Based Agents are multichain crypto AI agents, verifiable from their source code through to their onchain transactions.

Based Agents can:
- Sign transactions for any chain
- Custody cryptoassets
- Verifiably access off-chain LLMs, APIs and data
- Preserve privacy

<img width="691" alt="image" src="https://github.com/user-attachments/assets/9b8f3308-ae6d-4349-a312-9984e36e38c6" />

Components of a Based Agent are:
1. A verifiable TEE deployment on Phala Cloud
1. API layer as docker image (NextJS App)
1. NEAR Smart Contract to verify a TEE's remote attestation and stack
1. NEAR's Chain Signatures for multichain key management 

## 1. TEE deployment on Phala Cloud 

Phala Cloud is a TEE as a service provider to deploy multiple docker images inside a trusted execution environment. This environment exposes their dStack SDK where one can access the remote attestation of the TEE and derive keys. dStack also provides information about the docker images running inside the TEE from the docker-compose.yaml.

Based Agents use the following information from the TEE Deployment on Phala Cloud:
1. The remote attestation
1. The unique key derived from the TEE's hardware
1. The docker-compose.yaml data which contains the SHA hash of the individual docker images running on the TEE

![image](https://github.com/user-attachments/assets/aae0db8a-cbcb-4a30-858b-3fcadc0f1f17)

## 2. API Layer

Based Agents have an API Layer that acts as a bridge between the LLMs and the NEAR Smart Contract.

The template includes the following code for the API Layer:
1. The API will derive a unique key for this instance of the TEE (a NEAR Account). This key is in memory and inside the TEE, unable to be exfiltrated, verifiable by code inspection and the SHA hash of the docker image.
2. A call from the API layer to the NEAR contract to verify the TEE's remote attestation (so we know it's running in a TEE). This call includes the SHA hash of the docker images used and the checksum of the remote attestation to be viewed on the Phala Cloud explorer.
3. A call to `get_tee` which returns the SHA hashes and checksum of the TEE's instance.

Subsequent API layer code and calls to the NEAR Contract are left to the developer and their custom smart contract development for their based agent.

What to use the API layer for (remember it's verified!):
- providing offchain (but online) data to the LLM
- preprocessing LLM inference into specific smart contract method calls
- arbitrary offchain compute

## 3. NEAR Smart Contract

This template provides a NEAR Smart Contract that can do the following:
1. Registration - verify a TEE's remote attestation and store the TEE data
1. Method Calls - made from the TEE's NEAR Account, follow up method calls virtually zero cost

## 4. NEAR Chain Signatures

Using a path offset from the NEAR Smart Contract, we can have contract controlled accounts for any chain.

To derive accounts we use...

To get signatures for transactions on these accounts we call the NEAR Chain Signatures contract from our contract with the path offset of the account we'd like to receive a signature for.

# What can be done with Based Agents?

## 1. LLMs as docker image

LLMs deployed as docker images can easily be leveraged by other applications deployed in the same docker stack. With Based Agents, the LLM is used by the API Layer in the docker stack. Based Agents will typically use 1 or more LLMs to provide the inference for the API layer. 


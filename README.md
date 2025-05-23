# Decentralized Marketing Platform

A Web3-enabled decentralized application for creating and participating in marketing campaigns.

## Overview

This decentralized marketing platform allows users to:

- Connect their Web3 wallet (MetaMask)
- Create marketing campaigns with budget and rewards
- Participate in marketing campaigns
- Claim rewards from campaigns

The application uses blockchain technology to ensure transparency, security, and decentralization.

## Prerequisites

Before setting up the project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or later)
- [MetaMask](https://metamask.io/download/) browser extension
- [Git](https://git-scm.com/downloads) (optional, for cloning the repository)

## Setup Instructions

### 1. Clone or Download the Repository

```bash
git clone <repository-url>
```

Or download and extract the ZIP file from the repository.

### 2. Navigate to the Project Directory

```bash
cd decentralized-marketing-platform
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory of the project with the following content:

```
# Server Configuration
PORT=3000

# Ethereum Configuration
PRIVATE_KEY=YOUR_PRIVATE_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Contract Address
CONTRACT_ADDRESS=0x7a35277f1724c5724CBb28904B1795bC1b16ED70
```

Replace the placeholder values:

- `YOUR_PRIVATE_KEY`: Your Ethereum private key (from MetaMask)
- `YOUR_INFURA_PROJECT_ID`: Your Infura project ID (get one from [Infura](https://infura.io/))
- `YOUR_ETHERSCAN_API_KEY`: Your Etherscan API key (get one from [Etherscan](https://etherscan.io/apis))

#### How to Get Your MetaMask Private Key (IMPORTANT: Handle with Care)

1. Open MetaMask
2. Click on the account icon in the top right
3. Go to "Account Details"
4. Click "Export Private Key"
5. Enter your password
6. Copy the private key that appears

**IMPORTANT:** Never share your private key with anyone! It provides full access to your account.

### 5. Get Sepolia Test ETH

You'll need Sepolia test ETH to interact with the smart contract:

1. Go to a Sepolia faucet like [sepoliafaucet.com](https://sepoliafaucet.com/)
2. Enter your MetaMask wallet address
3. Receive test ETH (it's free)

### 6. Start the Application

```bash
node server.js
```

### 7. Access the Application

Open your web browser and go to:

```
http://localhost:3000
```

## Using the Application

### Connecting Your Wallet

1. Click the "Connect Wallet" button in the top right corner
2. MetaMask will ask for permission to connect
3. Allow the connection

### Creating a Campaign

1. Scroll to the "Create Your Campaign" section
2. Fill in the details:
   - Campaign Title
   - Description
   - Budget (in ETH)
   - Reward (in ETH) - must be less than or equal to budget
   - Duration (in days)
3. Click "Create Campaign"
4. Confirm the transaction in MetaMask

### Participating in a Campaign

1. Browse the "Active Campaigns" section
2. Find a campaign you're interested in
3. Click the "Participate" button
4. Confirm the transaction in MetaMask

### Claiming Rewards

1. Go to campaigns you've participated in that have ended
2. Click the "Claim" button
3. Confirm the transaction in MetaMask

## Troubleshooting

### MetaMask Not Connecting

- Make sure MetaMask is installed and unlocked
- Ensure you're on the Sepolia test network in MetaMask

### Transaction Errors

- Check that you have enough Sepolia test ETH for gas fees
- For campaign creation, ensure you have enough ETH to cover the budget

### Application Not Loading

- Verify that the server is running (`node server.js`)
- Check the console for any errors (F12 in most browsers)

## Security Notes

- Never share your private key
- Use a dedicated wallet for test networks
- The smart contract is deployed on Sepolia testnet and uses test ETH only

## Contact

For any questions or support, please contact [your contact information].
#   d e c e n t r a l i z e d - c a m p a i g n - a i  
 #   d e c e n t r a l i z e d - c a m p a i g n - a i  
 
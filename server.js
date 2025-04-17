require("dotenv").config();
const express = require("express");
const path = require("path");
const ethers = require("ethers");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Initialize ethers provider
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// Load wallet with private key
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Load contract ABI and address
const contractAddress = process.env.CONTRACT_ADDRESS;
const contractABI =
  require("./artifacts/contracts/MarketingPlatform.sol/MarketingPlatform.json").abi;
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// OpenAI API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Web3 authentication endpoint
app.post("/api/auth", async (req, res) => {
  try {
    const { signature, message } = req.body;
    const signerAddress = ethers.verifyMessage(message, signature);
    res.json({ success: true, address: signerAddress });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Create a new marketing campaign
app.post("/api/campaigns", async (req, res) => {
  try {
    const { title, description, budget, reward, duration, from } = req.body;

    if (!title || !description || !budget || !reward || !duration) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    // Validate budget and reward values
    if (parseFloat(reward) > parseFloat(budget)) {
      return res.status(400).json({
        success: false,
        error: "Reward cannot exceed budget",
      });
    }

    console.log(
      `Creating campaign with budget: ${budget} ETH, reward: ${reward} ETH`
    );

    // Convert string values to appropriate types
    const budgetWei = ethers.parseEther(budget.toString());
    const rewardWei = ethers.parseEther(reward.toString());
    const durationSeconds = parseInt(duration);

    // Important: Use client-side web3 to send transaction directly from user's wallet
    // We'll just return the data needed for the transaction
    return res.json({
      success: true,
      data: {
        method: "createCampaign",
        params: [
          title,
          description,
          budgetWei.toString(),
          rewardWei.toString(),
          durationSeconds,
        ],
        value: budgetWei.toString(),
      },
    });
  } catch (error) {
    console.error("Campaign preparation error:", error);

    // Extract more meaningful error message
    let errorMessage = "Failed to prepare campaign";

    if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for transaction";
    } else if (error.message.includes("execution reverted")) {
      // Try to extract custom error from smart contract
      const revertReason = error.message.match(/reason="(.*?)"/);
      if (revertReason && revertReason[1]) {
        errorMessage = revertReason[1];
      } else {
        errorMessage = "Smart contract rejected the transaction";
      }
    }

    return res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
});

// Get all campaigns
app.get("/api/campaigns", async (req, res) => {
  try {
    const count = await contract.campaignCount();
    const campaigns = [];

    for (let i = 0; i < count; i++) {
      const details = await contract.getCampaignDetails(i);
      campaigns.push({
        id: i,
        owner: details[0],
        title: details[1],
        description: details[2],
        budget: ethers.formatEther(details[3]),
        reward: ethers.formatEther(details[4]),
        startTime: details[5].toString(),
        endTime: details[6].toString(),
        isActive: details[7],
        participantCount: details[8].toString(),
      });
    }

    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Participate in a campaign
app.post("/api/campaigns/:id/participate", async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await contract.participateInCampaign(id);
    await tx.wait();
    res.json({ success: true, transactionHash: tx.hash });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Claim reward from a campaign
app.post("/api/campaigns/:id/claim", async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await contract.claimReward(id);
    await tx.wait();
    res.json({ success: true, transactionHash: tx.hash });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get campaign analytics (placeholder for third-party API integration)
app.get("/api/campaigns/:id/analytics", async (req, res) => {
  try {
    const { id } = req.params;
    // This is where we'll integrate with marketing analytics APIs
    // For now, returning mock data
    res.json({
      success: true,
      analytics: {
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        engagementRate: "10%",
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Generate campaign description using OpenAI API
app.post("/api/generate-description", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, error: "Prompt is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ success: false, error: "Gemini API key not configured" });
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a marketing expert. Write a short, compelling description for a marketing campaign about: ${prompt}. Keep it under 200 characters.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
          topP: 0.95,
          topK: 40,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the generated text from Gemini's response format
    const description =
      response.data.candidates[0].content.parts[0].text.trim();

    return res.json({ success: true, description });
  } catch (error) {
    console.error("Error generating description:", error);
    return res.status(500).json({
      success: false,
      error:
        error.response?.data?.error?.message ||
        "Failed to generate description",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

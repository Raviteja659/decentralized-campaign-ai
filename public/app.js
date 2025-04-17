let web3;
let contract;
let accounts = [];
let networkId;
let ethUsdPrice = 0;

// Contract ABI (to be updated after deployment)
const contractABI = [
  {
    inputs: [
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "uint256", name: "_budget", type: "uint256" },
      { internalType: "uint256", name: "_reward", type: "uint256" },
      { internalType: "uint256", name: "_duration", type: "uint256" },
    ],
    name: "createCampaign",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_campaignId", type: "uint256" }],
    name: "participateInCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_campaignId", type: "uint256" }],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCampaigns",
    outputs: [
      { internalType: "uint256[]", name: "ids", type: "uint256[]" },
      { internalType: "address[]", name: "owners", type: "address[]" },
      { internalType: "string[]", name: "titles", type: "string[]" },
      { internalType: "string[]", name: "descriptions", type: "string[]" },
      { internalType: "uint256[]", name: "budgets", type: "uint256[]" },
      { internalType: "uint256[]", name: "rewards", type: "uint256[]" },
      { internalType: "uint256[]", name: "startTimes", type: "uint256[]" },
      { internalType: "uint256[]", name: "endTimes", type: "uint256[]" },
      { internalType: "bool[]", name: "isActives", type: "bool[]" },
      {
        internalType: "uint256[]",
        name: "participantCounts",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_campaignId", type: "uint256" }],
    name: "getCampaignDetails",
    outputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "uint256", name: "budget", type: "uint256" },
      { internalType: "uint256", name: "reward", type: "uint256" },
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "uint256", name: "participantCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Initialize Web3
async function initWeb3() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      // Request account access
      accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Get network ID
      networkId = await web3.eth.net.getId();

      // Check if we're on Sepolia
      if (networkId !== 11155111) {
        alert("Please switch to Sepolia testnet to use this application");
        return;
      }

      // Initialize contract
      const contractAddress = "0x7a35277f1724c5724CBb28904B1795bC1b16ED70"; // Updated contract address
      contract = new web3.eth.Contract(contractABI, contractAddress);

      // Fetch ETH price
      await fetchEthPrice();

      updateUI();
      loadCampaigns();
      setupEventListeners();
    } catch (error) {
      console.error("User denied account access");
    }
  } else {
    alert("Please install MetaMask!");
  }
}

// Fetch ETH price from CoinGecko API
async function fetchEthPrice() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    const data = await response.json();
    ethUsdPrice = data.ethereum.usd;

    // Update price display
    const ethPriceElement = document.getElementById("ethPrice");
    if (ethPriceElement) {
      ethPriceElement.textContent = `1 ETH = $${ethUsdPrice.toFixed(2)}`;
    }

    console.log("Current ETH price: $" + ethUsdPrice);
  } catch (error) {
    console.error("Error fetching ETH price:", error);
  }
}

// Convert ETH to USD
function ethToUsd(ethAmount) {
  return (parseFloat(ethAmount) * ethUsdPrice).toFixed(2);
}

// Update UI based on wallet connection
function updateUI() {
  const connectWallet = document.getElementById("connectWallet");
  const userLoggedIn = document.getElementById("userLoggedIn");
  const userAddress = document.getElementById("userAddress");
  const walletAddress = accounts[0];

  if (walletAddress) {
    // User is logged in
    connectWallet.classList.add("d-none");
    userLoggedIn.classList.remove("d-none");
    userAddress.textContent = `${walletAddress.substring(
      0,
      6
    )}...${walletAddress.substring(walletAddress.length - 4)}`;

    // Show notification for successful login
    showNotification("Successfully logged in with MetaMask!", "success");

    // Enable form elements
    enableFormElements(true);
  } else {
    // User is not logged in
    connectWallet.classList.remove("d-none");
    userLoggedIn.classList.add("d-none");

    // Disable form elements
    enableFormElements(false);
  }
}

// Enable or disable form elements based on login status
function enableFormElements(enable) {
  const formElements = document.querySelectorAll(
    "#createCampaignForm input, #createCampaignForm textarea, #createCampaignForm button"
  );
  formElements.forEach((element) => {
    element.disabled = !enable;
  });

  if (!enable) {
    const createCampaignForm = document.getElementById("createCampaignForm");
    if (createCampaignForm) {
      createCampaignForm.addEventListener("click", function (e) {
        if (e.target.tagName !== "BUTTON") {
          showNotification("Please login with MetaMask first", "error");
        }
      });
    }
  }
}

// Load campaigns from the blockchain
async function loadCampaigns() {
  try {
    const campaignData = await contract.methods.getCampaigns().call();
    const campaignsList = document.getElementById("campaignsList");
    campaignsList.innerHTML = "";

    const ids = campaignData[0];
    const owners = campaignData[1];
    const titles = campaignData[2];
    const descriptions = campaignData[3];
    const budgets = campaignData[4];
    const rewards = campaignData[5];
    const startTimes = campaignData[6];
    const endTimes = campaignData[7];
    const isActives = campaignData[8];
    const participantCounts = campaignData[9];

    // Process each campaign
    for (let i = 0; i < ids.length; i++) {
      const card = createCampaignCard({
        id: ids[i],
        title: titles[i],
        description: descriptions[i],
        budget: web3.utils.fromWei(budgets[i], "ether"),
        reward: web3.utils.fromWei(rewards[i], "ether"),
        startTime: startTimes[i],
        endTime: endTimes[i],
        isActive: isActives[i],
        participantCount: participantCounts[i],
        owner: owners[i],
      });
      campaignsList.appendChild(card);
    }

    // Add a message if no campaigns exist
    if (ids.length === 0) {
      campaignsList.innerHTML =
        '<div class="col-12 text-center"><p>No campaigns created yet. Be the first to create one!</p></div>';
    }
  } catch (error) {
    console.error("Error loading campaigns:", error);
    showNotification(
      "Error loading campaigns: " + (error.message || "Unknown error"),
      "error"
    );
  }
}

// Create campaign card HTML
function createCampaignCard(campaign) {
  const card = document.createElement("div");
  card.className = "col-md-4 mb-4";

  // Calculate if campaign is active based on current time and end time
  const now = Math.floor(Date.now() / 1000);
  const isActive = campaign.isActive && now <= campaign.endTime;

  // Format dates for better readability
  const startDate = new Date(campaign.startTime * 1000).toLocaleDateString();
  const endDate = new Date(campaign.endTime * 1000).toLocaleDateString();

  // Convert ETH values to USD
  const budgetUsd = ethToUsd(campaign.budget);
  const rewardUsd = ethToUsd(campaign.reward);

  card.innerHTML = `
    <div class="card campaign-card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="card-title mb-0">${campaign.title}</h5>
          <span class="badge ${isActive ? "bg-success" : "bg-danger"}">
            ${isActive ? "Active" : "Ended"}
          </span>
        </div>
        <p class="card-text">${campaign.description}</p>
        
        <div class="row mb-3">
          <div class="col-6">
            <div class="stats-card">
              <div class="stats-number">${campaign.budget} ETH</div>
              <small>($${budgetUsd} USD)</small>
              <small>Budget</small>
            </div>
          </div>
          <div class="col-6">
            <div class="stats-card">
              <div class="stats-number">${campaign.reward} ETH</div>
              <small>($${rewardUsd} USD)</small>
              <small>Reward</small>
            </div>
          </div>
        </div>
        
        <div class="mb-3">
          <small class="text-muted">
            <i class="fas fa-calendar-alt me-1"></i> ${startDate} - ${endDate}
          </small>
        </div>
        
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <i class="fas fa-users me-2"></i>
            ${campaign.participantCount} Participants
          </div>
          <div>
            <button onclick="participateInCampaign(${
              campaign.id
            })" class="btn web3-button me-2" ${!isActive ? "disabled" : ""}>
              <i class="fas fa-hand-point-up me-2"></i>Participate
            </button>
            <button onclick="claimReward(${
              campaign.id
            })" class="btn web3-button" ${isActive ? "disabled" : ""}>
              <i class="fas fa-gift me-2"></i>Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  return card;
}

// Handle campaign creation
document
  .getElementById("createCampaignForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("campaignTitle").value;
    const description = document.getElementById("campaignDescription").value;
    const budget = document.getElementById("campaignBudget").value;
    const reward = document.getElementById("campaignReward").value;
    const duration = document.getElementById("campaignDuration").value;

    try {
      // Validate inputs
      if (!title || !description || !budget || !reward || !duration) {
        showNotification("Please fill in all fields", "error");
        return;
      }

      // Validate budget/reward relationship
      if (parseFloat(reward) > parseFloat(budget)) {
        showNotification("Reward cannot exceed budget", "error");
        return;
      }

      // Get user's balance and check if sufficient
      const balance = await web3.eth.getBalance(accounts[0]);
      const balanceEth = web3.utils.fromWei(balance, "ether");
      if (parseFloat(balanceEth) < parseFloat(budget)) {
        showNotification(
          `Insufficient ETH balance. Need ${budget} ETH, but you have ${parseFloat(
            balanceEth
          ).toFixed(4)} ETH`,
          "error"
        );
        return;
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        `You are about to create a campaign with:\n` +
          `Title: ${title}\n` +
          `Budget: ${budget} ETH (${ethToUsd(budget)} USD)\n` +
          `Reward: ${reward} ETH (${ethToUsd(reward)} USD)\n` +
          `Duration: ${duration} days\n\n` +
          `This will transfer ${budget} ETH to the contract. Continue?`
      );

      if (!confirmed) {
        showNotification("Transaction cancelled", "error");
        return;
      }

      // Start transaction
      showNotification("Preparing transaction...", "info");

      // First, get transaction data from server
      const result = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          budget,
          reward,
          duration: duration * 24 * 60 * 60, // Convert days to seconds
          from: accounts[0],
        }),
      });

      const data = await result.json();

      if (data.success) {
        showNotification(
          "Please confirm the transaction in MetaMask...",
          "info"
        );

        // Now execute the transaction directly from the browser using Web3
        const txParams = data.data;
        const budgetWei = web3.utils.toWei(budget, "ether");

        // Send transaction directly using web3
        const tx = await contract.methods[txParams.method](
          ...txParams.params
        ).send({
          from: accounts[0],
          value: budgetWei,
          gasLimit: 500000,
        });

        showNotification("Campaign created successfully!", "success");
        loadCampaigns();
        document.getElementById("createCampaignForm").reset();
      } else {
        showNotification("Error preparing campaign: " + data.error, "error");
      }
    } catch (error) {
      console.error("Error:", error);
      let errorMessage = "Error creating campaign";

      if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for this transaction";
      } else if (error.message.includes("user denied")) {
        errorMessage = "Transaction rejected in MetaMask";
      } else if (error.message.includes("revert")) {
        // Extract revert reason if available
        errorMessage = error.message.includes("revert")
          ? error.message.substring(error.message.indexOf("revert") + 7).trim()
          : "Transaction reverted by the blockchain";
      }

      showNotification(errorMessage, "error");
    }
  });

// Participate in a campaign
async function participateInCampaign(campaignId) {
  try {
    const result = await contract.methods
      .participateInCampaign(campaignId)
      .send({ from: accounts[0] });

    if (result.status) {
      showNotification("Successfully participated in the campaign!", "success");
      loadCampaigns();
    }
  } catch (error) {
    console.error("Error:", error);
    showNotification("Error participating: " + error.message, "error");
  }
}

// Claim reward from a campaign
async function claimReward(campaignId) {
  try {
    const result = await contract.methods
      .claimReward(campaignId)
      .send({ from: accounts[0] });

    if (result.status) {
      showNotification("Reward claimed successfully!", "success");
      loadCampaigns();
    }
  } catch (error) {
    console.error("Error:", error);
    showNotification("Error claiming reward: " + error.message, "error");
  }
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${
      type === "success" ? "check-circle" : "exclamation-circle"
    } me-2"></i>
    ${message}
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Setup event listeners
function setupEventListeners() {
  // Listen for account changes
  window.ethereum.on("accountsChanged", (newAccounts) => {
    accounts = newAccounts;
    updateUI();
    loadCampaigns();
  });

  // Listen for network changes
  window.ethereum.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  // Listen for budget input changes to update USD value
  const budgetInput = document.getElementById("campaignBudget");
  const rewardInput = document.getElementById("campaignReward");

  if (budgetInput) {
    budgetInput.addEventListener("input", updateBudgetUsdValue);
  }

  if (rewardInput) {
    rewardInput.addEventListener("input", updateRewardUsdValue);
  }

  // Set up refresh timer for ETH price
  setInterval(fetchEthPrice, 60000); // Refresh price every minute

  // AI description generator
  const generateAIDescription = document.getElementById(
    "generateAIDescription"
  );
  const aiGeneratorControls = document.getElementById("aiGeneratorControls");
  const submitAIPrompt = document.getElementById("submitAIPrompt");

  if (generateAIDescription) {
    generateAIDescription.addEventListener("click", function () {
      aiGeneratorControls.classList.toggle("d-none");
    });
  }

  if (submitAIPrompt) {
    submitAIPrompt.addEventListener("click", generateCampaignDescription);
  }
}

// Update USD value for budget
function updateBudgetUsdValue() {
  const budgetInput = document.getElementById("campaignBudget");
  const budgetUsdElement = document.getElementById("budgetUsd");

  if (budgetInput && budgetUsdElement && !isNaN(budgetInput.value)) {
    const budgetEth = parseFloat(budgetInput.value);
    const budgetUsd = ethToUsd(budgetEth);
    budgetUsdElement.textContent = `≈ $${budgetUsd} USD`;
  }
}

// Update USD value for reward
function updateRewardUsdValue() {
  const rewardInput = document.getElementById("campaignReward");
  const rewardUsdElement = document.getElementById("rewardUsd");

  if (rewardInput && rewardUsdElement && !isNaN(rewardInput.value)) {
    const rewardEth = parseFloat(rewardInput.value);
    const rewardUsd = ethToUsd(rewardEth);
    rewardUsdElement.textContent = `≈ $${rewardUsd} USD`;
  }
}

// Generate campaign description with OpenAI API
async function generateCampaignDescription() {
  const aiPrompt = document.getElementById("aiPrompt");
  const campaignDescription = document.getElementById("campaignDescription");
  const aiSpinner = document.getElementById("aiSpinner");

  if (!aiPrompt.value.trim()) {
    showNotification("Please enter a campaign topic", "error");
    return;
  }

  // Show loading spinner
  aiSpinner.classList.remove("d-none");

  try {
    // Call our backend which will make the OpenAI API call
    const response = await fetch("/api/generate-description", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: aiPrompt.value }),
    });

    const data = await response.json();

    if (data.success) {
      campaignDescription.value = data.description;
      showNotification(
        "AI-generated description created successfully!",
        "success"
      );
    } else {
      showNotification("Error generating description: " + data.error, "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showNotification("Error connecting to AI service", "error");
  } finally {
    // Hide loading spinner
    aiSpinner.classList.add("d-none");
  }
}

// Connect wallet button click handler
document.getElementById("connectWallet").addEventListener("click", initWeb3);

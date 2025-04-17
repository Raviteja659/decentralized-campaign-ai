// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MarketingPlatform {
    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 budget;
        uint256 reward;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        mapping(address => bool) participants;
        uint256 participantCount;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount;
    
    event CampaignCreated(uint256 campaignId, address owner, string title);
    event CampaignParticipated(uint256 campaignId, address participant);
    event RewardClaimed(uint256 campaignId, address participant, uint256 amount);

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _budget,
        uint256 _reward,
        uint256 _duration
    ) public payable {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(msg.value > 0, "Must send ETH with transaction");
        require(msg.value == _budget, "Sent ETH must match budget");
        require(_budget > 0, "Budget must be greater than 0");
        require(_reward > 0, "Reward must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(_reward <= _budget, "Reward cannot exceed budget");

        uint256 campaignId = campaignCount++;
        Campaign storage campaign = campaigns[campaignId];
        
        campaign.owner = msg.sender;
        campaign.title = _title;
        campaign.description = _description;
        campaign.budget = _budget;
        campaign.reward = _reward;
        campaign.startTime = block.timestamp;
        campaign.endTime = block.timestamp + _duration;
        campaign.isActive = true;
        
        emit CampaignCreated(campaignId, msg.sender, _title);
    }

    function participateInCampaign(uint256 _campaignId) public {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "Campaign is not active");
        require(block.timestamp >= campaign.startTime, "Campaign hasn't started");
        require(block.timestamp <= campaign.endTime, "Campaign has ended");
        require(!campaign.participants[msg.sender], "Already participated");
        
        campaign.participants[msg.sender] = true;
        campaign.participantCount++;
        
        emit CampaignParticipated(_campaignId, msg.sender);
    }

    function claimReward(uint256 _campaignId) public {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.participants[msg.sender], "Not a participant");
        require(block.timestamp > campaign.endTime, "Campaign hasn't ended");
        require(campaign.isActive, "Campaign is not active");
        require(address(this).balance >= campaign.reward, "Contract has insufficient funds");
        
        campaign.isActive = false;
        (bool success, ) = msg.sender.call{value: campaign.reward}("");
        require(success, "Reward transfer failed");
        
        emit RewardClaimed(_campaignId, msg.sender, campaign.reward);
    }

    function getCampaignDetails(uint256 _campaignId) public view returns (
        address owner,
        string memory title,
        string memory description,
        uint256 budget,
        uint256 reward,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        uint256 participantCount
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.owner,
            campaign.title,
            campaign.description,
            campaign.budget,
            campaign.reward,
            campaign.startTime,
            campaign.endTime,
            campaign.isActive,
            campaign.participantCount
        );
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getCampaigns() public view returns (
        uint256[] memory ids,
        address[] memory owners,
        string[] memory titles,
        string[] memory descriptions,
        uint256[] memory budgets,
        uint256[] memory rewards,
        uint256[] memory startTimes,
        uint256[] memory endTimes,
        bool[] memory isActives,
        uint256[] memory participantCounts
    ) {
        uint256 count = campaignCount;
        
        ids = new uint256[](count);
        owners = new address[](count);
        titles = new string[](count);
        descriptions = new string[](count);
        budgets = new uint256[](count);
        rewards = new uint256[](count);
        startTimes = new uint256[](count);
        endTimes = new uint256[](count);
        isActives = new bool[](count);
        participantCounts = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            Campaign storage campaign = campaigns[i];
            ids[i] = i;
            owners[i] = campaign.owner;
            titles[i] = campaign.title;
            descriptions[i] = campaign.description;
            budgets[i] = campaign.budget;
            rewards[i] = campaign.reward;
            startTimes[i] = campaign.startTime;
            endTimes[i] = campaign.endTime;
            isActives[i] = campaign.isActive;
            participantCounts[i] = campaign.participantCount;
        }
        
        return (ids, owners, titles, descriptions, budgets, rewards, startTimes, endTimes, isActives, participantCounts);
    }
} 
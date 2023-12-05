// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract MyNBToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit, ERC20Votes {
    mapping(address => uint256) private stakingBalance;
    mapping(address => uint256) private stakingTimestamp;
    uint256 public constant MIN_STAKING_DURATION = 30 days;
    uint256 public constant VOTING_THRESHOLD = 5;
    
    modifier canWithdraw() {
      require(
          block.timestamp >=
              stakingTimestamp[msg.sender] + MIN_STAKING_DURATION,
          "Cannot withdraw before minimum staking duration which is 2 days."
      );
      _;
    }
    
    constructor(address initialOwner)
        ERC20("MyNBToken", "NBT")
        Ownable(initialOwner)
        ERC20Permit("MyNBToken")
    {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    uint256 public constant REWARD_MULTIPLIER = 20;

    event rewardsTransferred(address indexed from, address indexed to, uint256 amount);

    function transfer(address to, uint256 amount, address utAddr) public returns (bool) {
      require(
        amount <= balanceOf(msg.sender) - getStakedBalance(msg.sender),
        "Insufficient Balance or your balance is staked."
      );

      address from = msg.sender;
      _transfer(from, to, amount);
      updateDelegate(to);

      ERC20 utilityToken = ERC20(utAddr);
      uint256 rewardAmount = amount / REWARD_MULTIPLIER;

      utilityToken.transferFrom(from, to, rewardAmount);

      emit rewardsTransferred(from, to, rewardAmount);

      return true;
    }
    
    function updateDelegate(address account) internal {
      if (stakingBalance[account] >= VOTING_THRESHOLD) {
          _delegate(account, account);
      } else {
          _delegate(account, address(0));
      }
    }

    function withdraw(uint256 amount) public canWithdraw {
      require(
          stakingBalance[msg.sender] >= amount,
          "Insufficient staked balance"
      );
      stakingBalance[msg.sender] -= amount;
      stakingTimestamp[msg.sender] = 0; // Reset staking timestamp
      updateDelegate(msg.sender);
      _transfer(address(this), msg.sender, amount); // Transfer staked tokens back to the user
    }

    function getStakedBalance(address addr) public view returns (uint256) {
        return stakingBalance[addr];
    }

    function stake(uint256 amount) public {
        stakingBalance[msg.sender] += amount;
        stakingTimestamp[msg.sender] = block.timestamp; // Set staking timestamp
        updateDelegate(msg.sender);
    }
  }

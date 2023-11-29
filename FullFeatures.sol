// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract MyNBToken is ERC20, ERC20Burnable, Ownable, ERC20Permit, ERC20Votes {
    mapping(address => uint256) private stakingBalance;
    mapping(address => uint256) private stakingTimestamp;
    uint256 public constant VOTING_THRESHOLD = 100;
    uint256 public constant MIN_STAKING_DURATION = 2 days; // Minimum staking duration
    address private myAddr = 0x000e063943E9E8574EF5De947ea00Fb6Ca01B04F;

    modifier canWithdraw() {
        require(
            block.timestamp >=
                stakingTimestamp[msg.sender] + MIN_STAKING_DURATION,
            "Cannot withdraw before minimum staking duration which is 2 days."
        );
        _;
    }

    constructor(address initialOwner)
        ERC20("MyNBToken", "MNBT")
        Ownable(initialOwner)
        ERC20Permit("MyNBToken")
    {
        _mint(msg.sender, 1000 * 10**decimals());
        if (
            msg.sender != address(0) &&
            numCheckpoints(msg.sender) == 0 &&
            delegates(msg.sender) == address(0)
        ) {
            _delegate(msg.sender, msg.sender);
        }
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        updateDelegate(to);
    }

    function transfer(address to, uint256 amount)
        public
        override
        returns (bool)
    {
        require(
            amount <= balanceOf(msg.sender) - getStakedBalance(msg.sender),
            "Insufficient Balance or your balance is staked."
        );
        _transfer(msg.sender, to, amount);
        updateDelegate(to);
        return true;
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

    function updateDelegate(address account) internal {
        if (stakingBalance[account] >= VOTING_THRESHOLD) {
            _delegate(account, account);
        } else {
            _delegate(account, myAddr);
        }
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
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
}
const fs = require("fs")
const solc = require("solc")

const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract MyNBToken is ERC20, ERC20Burnable, Ownable, ERC20Permit, ERC20Votes {
    constructor(
        address initialOwner
    )
        ERC20("MyNBToken", "MNBT")
        Ownable(initialOwner)
        ERC20Permit("MyNBToken")
    {
        _mint(msg.sender, 1000000000000 * 10 ** decimals());

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

        if (
            to != address(0) &&
            numCheckpoints(to) == 0 &&
            delegates(to) == address(0)
        ) {
            _delegate(to, to);
        }
    }

    function transfer(
        address to,
        uint256 amount
    ) public override returns (bool) {
        _transfer(msg.sender, to, amount);

        if (
            to != address(0) &&
            numCheckpoints(to) == 0 &&
            delegates(to) == address(0)
        ) {
            _delegate(to, to);
        }

        return true;
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
`

const input = {
  language: "Solidity",
  sources: {
    "MyNBToken.sol": {
      content: contractSource,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
}

function findImports(path) {
  const zeppelinPath = "node_modules/@openzeppelin/contracts"
  if (path.startsWith("MyNBToken.sol")) {
    return { contents: contractSource }
  } else if (path.startsWith("@openzeppelin/contracts")) {
    const fullPath = path.replace("@openzeppelin/contracts", zeppelinPath)
    return { contents: fs.readFileSync(fullPath, "utf-8") }
  } else {
    return { error: "File not found" }
  }
}

const output = JSON.parse(
  solc.compile(JSON.stringify(input), { import: findImports })
)

let abi
let bytecode

for (const contractName in output.contracts["MyNBToken.sol"]) {
  abi = output.contracts["MyNBToken.sol"][contractName].abi
  bytecode = output.contracts["MyNBToken.sol"][contractName].evm.bytecode.object
}

module.exports = { abi, bytecode }

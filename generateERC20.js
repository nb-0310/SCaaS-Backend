const fs = require("fs")
const solc = require("solc")
const { erc20 } = require("@openzeppelin/wizard")
// const { options } = require("./server.js")

function generateTransferFunction() {
  return `
      function transfer(address to, uint256 amount) public override returns(bool) {
          _transfer(msg.sender, to, amount);
          return true;
      }`
}

let contractSource

function generateContract(options) {
  const contract = erc20.print(options)

  const lastCurlyBraceIndex = contract.lastIndexOf("}")
  const modifiedContract =
    contract.slice(0, lastCurlyBraceIndex) +
    generateTransferFunction() +
    "\n" +
    contract.slice(lastCurlyBraceIndex)

  const finalContract = modifiedContract.replace(
    "/// @custom:oz-upgrades-unsafe-allow constructor",
    ""
  )

  fs.writeFileSync(`contracts/${options.name}.sol`, finalContract)
  contractSource = finalContract
}

const params = {
  name: "ERC20Contract",
  symbol: "ETK",
  mintable: true,
  burnable: true,
  pausable: true,
  premint: "1000000",
  access: "ownable",
}

generateContract(params)

setTimeout(() => {
    // console.log(contractSource)
  const input = {
    language: "Solidity",
    sources: {
      "contracts/ERC20Contract.sol": {
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
    if (path.startsWith("contracts/ERC20Contract.sol")) {
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

  for (const contractName in output.contracts["contracts/ERC20Contract.sol"]) {
    abi = output.contracts["contracts/ERC20Contract.sol"][contractName].abi
    bytecode =
      output.contracts["contracts/ERC20Contract.sol"][contractName].evm.bytecode.object
  }

  console.log(bytecode)

  module.exports = { abi, bytecode }
}, 5000)

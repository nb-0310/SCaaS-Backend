const fs = require("fs")
const solc = require("solc")
const { erc721 } = require("@openzeppelin/wizard")

function generateTransferFunction() {
  return `
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
            _transfer(from, to, tokenId);
    }`
}

async function generateERC721Contract(options) {
  return new Promise((resolve, reject) => {
    const contract = erc721.print(options)

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

    const filePath = `contracts/${options.name}.sol`

    fs.writeFileSync(filePath, finalContract)

    const input = {
      language: "Solidity",
      sources: {
        [filePath]: {
          content: finalContract,
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
      if (path.startsWith(filePath)) {
        return { contents: finalContract }
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

    console.log(output)

    let abi
    let bytecode

    for (const contractName in output.contracts[filePath]) {
      abi = output.contracts[filePath][contractName].abi
      bytecode = output.contracts[filePath][contractName].evm.bytecode.object
    }

    resolve({ abi, bytecode })
  })
}

module.exports = { generateERC721Contract }
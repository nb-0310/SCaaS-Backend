// server.js
const express = require("express")
const bodyParser = require("body-parser")
const { generateERC20Contract } = require("./generateERC20.js")
const { generateERC721Contract } = require("./generateERC721.js")

const app = express()
const port = 3000

app.use(bodyParser.json())

app.post("/create-erc20-contract", async (req, res) => {
  const erc20Options = req.body
  const { abi, bytecode } = await generateERC20Contract(erc20Options)
  res.status(200).json({ abi, bytecode })
})

app.post("/create-erc721-contract", async (req, res) => {
  const erc721Options = req.body
  const { abi, bytecode } = await generateERC721Contract(erc721Options)
  res.status(200).json({ abi, bytecode })
})

app.get("/", (req, res) => {
  res.send("Hello")
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

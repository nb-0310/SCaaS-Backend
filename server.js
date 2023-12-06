// server.js
const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const { generateERC20Contract } = require("./generateERC20.js")
const { generateERC721Contract } = require("./generateERC721.js")
const { generateERC1155Contract } = require("./generateERC1155.js")
const { generateGT } = require("./generateGT.js")
const { generateGovernor } = require("./generateGovernor.js")

const app = express()
const port = 5000

app.use(bodyParser.json())
app.use(cors())

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

app.post("/create-erc1155-contract", async (req, res) => {
  const erc1155Options = req.body
  const { abi, bytecode } = await generateERC1155Contract(erc1155Options)
  res.status(200).json({ abi, bytecode })
})

app.post("/create-gt-contract", async (req, res) => {
  const gtOptions = req.body
  const { abi, bytecode } = await generateGT(gtOptions)
  res.status(200).json({ abi, bytecode })
})

app.post("/create-governor-contract", async (req, res) => {
  const governorOptions = req.body
  const { abi, bytecode } = await generateGovernor(governorOptions)
  res.status(200).json({ abi, bytecode })
})

app.get("/", (req, res) => {
  res.send("Hello")
})

app.get("/secret-path", (req, res) => {
  res.status(200).send('You are at the right place!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

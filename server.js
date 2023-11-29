// server.js
const express = require("express")
const bodyParser = require("body-parser")

const app = express()
const port = 3000

app.use(bodyParser.json())

app.post("/create-erc20-contract", (req, res) => {
  const erc20Options = req.body.erc20Options
  module.exports = { erc20Options }

  res.status(200).json({ message: "ERC20 options received successfully." })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
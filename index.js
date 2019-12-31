const abi = require("./JobsManager.json")
const ethers = require("ethers")
const utils = ethers.utils

const main = async () => {
  // MAINNET
  // const provider = ethers.getDefaultProvider()
  // RINKEBY
  const provider = ethers.getDefaultProvider("rinkeby")
  // JobsManager proxy address
  // MAINNET
  // const addr = "0xbf07ff45f14c9ff0571b9fbdc7e2b62d29931224"
  // RINKEBY
  const addr = "0x0A209545bb10bC2F78713a2699795ECfEa76762D"
  const contract = new ethers.Contract(addr, abi, provider)

  let filter = contract.filters.Deposit(null, null)
  // Deployment block of Controller
  // MAINNET
  // filter.fromBlock = 5533890
  // RINKEBY
  filter.fromBlock = 1771513
  filter.toBlock = "latest"

  let depositors = {}
  let numDepositors = 0
  let totalDeposits = utils.bigNumberify(0)

  const logs = await provider.getLogs(filter)
  for (let log of logs) {
    const data = contract.interface.parseLog(log)
    const depositor = data.values.broadcaster

    // Exclude depositors that we are already keeping track of
    if (depositor in depositors) {
      continue
    }

    // Fetch current deposit
    const deposit = (await contract.broadcasters(depositor)).deposit
    // Exclude depositors that currently have a deposit of 0
    if (deposit.isZero()) {
      continue
    }

    depositors[depositor] = deposit
    numDepositors++
    totalDeposits = totalDeposits.add(deposit)

    console.log(`Address: ${depositor} Amount: ${deposit}`)

  }

  console.log(`# Depositors: ${numDepositors}`)
  console.log(`Total Deposits (ETH): ${utils.formatUnits(totalDeposits, "ether")}`)
  console.log(`Total Deposits (Wei): ${totalDeposits.toString()}`)
}

main()

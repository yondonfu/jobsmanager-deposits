const abi = require("./JobsManager.json")
const ethers = require("ethers")
const utils = ethers.utils

const NET_CONFIGS = {
  mainnet: {
    jobsManager: "0xbf07ff45f14c9ff0571b9fbdc7e2b62d29931224",
    fromBlock: 5533890
  },
  rinkeby: {
    jobsManager: "0x0A209545bb10bC2F78713a2699795ECfEa76762D",
    fromBlock: 1771513
  }
}

const main = async () => {
  const net = process.argv[2]
  const cfg = NET_CONFIGS[net]

  let provider
  if (net === "mainnet") {
    provider = ethers.getDefaultProvider()
  } else if (net === "rinkeby") {
    provider = ethers.getDefaultProvider("rinkeby")
  } else {
    throw new Error("unknown network")
  }

  const contract = new ethers.Contract(cfg.jobsManager, abi, provider)

  let filter = contract.filters.Deposit(null, null)
  // Deployment block of Controller
  filter.fromBlock = cfg.fromBlock
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

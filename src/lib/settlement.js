export function computeSettlement(entries) {
  const nets = entries.map(e => ({
    name: e.name,
    net: Math.round((e.cashout - e.totalBuyin) * 100),
  }))

  const creditors = nets.filter(p => p.net > 0).sort((a, b) => b.net - a.net)
  const debtors   = nets.filter(p => p.net < 0).sort((a, b) => a.net - b.net)

  const transactions = []
  let i = 0, j = 0

  while (i < debtors.length && j < creditors.length) {
    const debt   = -debtors[i].net
    const credit =  creditors[j].net
    const amount = Math.min(debt, credit)

    transactions.push({
      from:   debtors[i].name,
      to:     creditors[j].name,
      amount: amount / 100,
    })

    debtors[i].net   += amount
    creditors[j].net -= amount

    if (debtors[i].net === 0)   i++
    if (creditors[j].net === 0) j++
  }

  return transactions
}

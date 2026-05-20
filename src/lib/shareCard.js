export function prepareCardEntries(entries) {
  return entries
    .filter(e => e.cashout !== null)
    .map(e => ({ name: e.playerName, net: e.cashout - e.total_buyin }))
    .sort((a, b) => b.net - a.net)
}

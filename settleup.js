// utils/settleup.js

function minimizeCashFlow(balances) {
  const creditors = [];
  const debtors = [];

  // Separate creditors and debtors
  for (let i = 0; i < balances.length; i++) {
    if (balances[i] > 0.01) creditors.push({ id: i + 1, amount: balances[i] });
    else if (balances[i] < -0.01) debtors.push({ id: i + 1, amount: -balances[i] });
  }

  const result = [];
  let i = 0, j = 0;

  // Match each debtor with a creditor
  while (i < debtors.length && j < creditors.length) {
    const minAmount = Math.min(debtors[i].amount, creditors[j].amount);

    result.push({
      from: debtors[i].id,
      to: creditors[j].id,
      amount: minAmount.toFixed(2)
    });

    debtors[i].amount -= minAmount;
    creditors[j].amount -= minAmount;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return result;
}

module.exports = minimizeCashFlow;

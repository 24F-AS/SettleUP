const API = 'http://localhost:5000/api';

async function register() {
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch(`${API}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  alert(data.message);
}

async function addExpense() {
  const desc = document.getElementById('desc').value;
  const amt = parseFloat(document.getElementById('amt').value);

  const groupMembers = [1, 2, 3, 4, 5]; 
  const paidBy = 1; 

  const share = amt / groupMembers.length;

  const splits = groupMembers
    .filter(id => id !== paidBy)
    .map(id => ({ user_id: id, amount: share }));

  const res = await fetch(`${API}/expenses/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group_id: 1,
      paid_by: paidBy,
      description: desc,
      amount: amt,
      splits
    })
  });

  const data = await res.json();
  document.getElementById('result').innerText = data.message;
}


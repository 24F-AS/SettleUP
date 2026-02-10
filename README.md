# SettleUP

A lightweight web application for managing shared expenses and splitting bills among friends, roommates, or groups. SettleUP simplifies group expense tracking and automatically calculates who owes whom, making it easy to settle up after trips, dinners, or shared living situations.

## Features

- **👥 User Management** - Create and manage user profiles
- **📊 Group Management** - Organize expenses by creating groups with multiple participants
- **💰 Expense Tracking** - Record expenses with flexible splitting options
- **🔄 Automatic Debt Calculation** - Smart algorithms calculate optimal settlement paths
- **📱 Responsive Design** - Clean, mobile-friendly interface
- **💾 Persistent Storage** - SQLite database for reliable data storage

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express.js
- **Database**: SQLite (via `better-sqlite3`)
- **Architecture**: RESTful API design

## Project Structure

```
SettleUP/
├── server.js           # Main Express server
├── db.js              # Database configuration and initialization
├── users.js           # User management routes
├── groups.js          # Group management routes
├── expenses.js        # Expense tracking routes
├── settleup.js        # Debt settlement calculation logic
├── schema.sql         # Database schema definition
├── index.html         # Main application page
├── script.js          # Frontend JavaScript logic
├── style.css          # Application styling
├── package.json       # Node.js dependencies
└── LICENSE            # MIT License
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/24F-AS/SettleUP.git
   cd SettleUP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   
   The application will automatically create and initialize the SQLite database on first run using the schema defined in `schema.sql`.

4. **Start the server**
   ```bash
   node server.js
   ```

5. **Access the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

### Creating Users

Users must be created before they can participate in groups or expenses. Use the user management interface to add new participants.

### Managing Groups

1. Create a new group and give it a name
2. Add members to the group from your list of users
3. Start tracking expenses within the group

### Adding Expenses

1. Select or create a group
2. Add an expense with:
   - Description
   - Amount
   - Payer (who paid for it)
   - Participants (who should split the cost)
3. Choose how to split the expense (equally, by percentage, or custom amounts)

### Settling Up

The application automatically calculates the optimal way to settle debts:
- View who owes whom
- See simplified payment suggestions (minimizing the number of transactions)
- Mark payments as complete once settled

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update a group
- `DELETE /api/groups/:id` - Delete a group

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create a new expense
- `GET /api/expenses/:id` - Get expense details
- `PUT /api/expenses/:id` - Update an expense
- `DELETE /api/expenses/:id` - Delete an expense

### Settlement
- `GET /api/settleup/:groupId` - Calculate settlement for a group

## Development

### Database Schema

The application uses SQLite with the following main tables:
- `users` - User information
- `groups` - Group details
- `group_members` - Many-to-many relationship between users and groups
- `expenses` - Expense records
- `expense_splits` - How expenses are divided among participants

See `schema.sql` for the complete schema definition.

### Running in Development Mode

For development with auto-restart on file changes, you can use nodemon:

```bash
npm install -g nodemon
nodemon server.js
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by popular expense-splitting apps like Splitwise
- Built as a learning project for web development with Node.js and SQLite

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/24F-AS/SettleUP/issues) on GitHub.

---

**Made with ❤️ for simplifying shared expenses**

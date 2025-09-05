# Results on Chain – Blockchain-based Academic Records System

A decentralized academic result management platform that enables secure, verifiable, and easily accessible student results using **Ethereum smart contracts**, **IPFS** for storage, and **The Graph Protocol** for fast indexing.


---

## 🚀 Features

- **Role-based Access** – Separate dashboards for Admins, Lecturers, Validators, and Students.
- **Secure Storage** – Results are stored off-chain in IPFS with a Merkle root hash recorded on-chain for integrity.
- **Multi-Signature Validation** – Results must be signed by up to 3 validators before being available to students.
- **Indexed Queries** – Integration with The Graph ensures fast retrieval of validation and upload statuses without querying the entire blockchain.
- **Session & Semester Grouping** – Results are organized for easy navigation and historical access.
- **Wallet Authentication** – Users log in with Metamask or Zerion, roles are verified on-chain.

---

## 🛠️ Tech Stack

### **Frontend**
- [Next.js](https://nextjs.org/) – React-based framework for the UI
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first styling
- [Wagmi](https://wagmi.sh/) + [Ethers.js](https://docs.ethers.org/) – Wallet connection and contract interaction
- [Privy](https://www.privy.io/) – Wallet authentication layer

### **Smart Contracts**
- [Solidity](https://soliditylang.org/) – Role management, result upload, and validation logic
- [Hardhat](https://hardhat.org/) – Development & testing environment
- [OpenZeppelin](https://openzeppelin.com/contracts/) – Security-standard libraries (ERC-4337, access control)

### **Storage & Indexing**
- [IPFS](https://ipfs.tech/) – Decentralized file storage for result data
- [The Graph](https://thegraph.com/) – Event indexing for fast and efficient queries

---

## 📐 System Architecture

### **Workflow Overview**
1. **Landing Page** – Users connect their wallet.
2. **Role Verification** – Smart contract checks user role.
3. **Role-specific Dashboards**:
   - **Admin**: Add lecturers/students, assign courses, add validators.
   - **Lecturer**: Upload results (CSV/JSON), sign uploads, check status.
   - **Validator**: Review and sign results, update validation status.
   - **Student**: View validated results by session/semester, download from IPFS.
4. **Data Flow**:
   - Results → IPFS Storage → Merkle root hash on-chain
   - Events emitted → Indexed by The Graph for fast retrieval
   - Role queries & validation status pulled from The Graph

---

## 📂 Project Structure
```
├── app/ # Next.js app directory
├── components/ # UI components (dashboards, tables, buttons)
├── lib/ # Blockchain interaction functions
├── hooks/ # Custom React hooks for wallet & contract state
├── contracts/ # Solidity smart contracts
├── subgraph/ # The Graph subgraph files
├── public/ # Static assets
├── package.json # Dependencies & scripts
└── README.md
```


---

## ⚙️ Installation & Setup

1. **Clone the repository**
```
git clone https://github.com/chinedumsunday/blockchainresults.git
cd blockchainresults
```

2. **Install dependencies**
```
npm install
```
3. **Set up environment variables
Create a .env.local file:**
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContract
NEXT_PUBLIC_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/...
```
4. **Run the development server**
```
npm run dev
```

📜 Smart Contract Deployment

1. **Navigate to the contracts folder:**
```
cd contracts
```
2. **Compile contracts**
```
npx hardhat compile
```
3. **Deploy to your network:**
```
npx hardhat run scripts/deploy.js --network sepolia
```

📊 The Graph Setup

1. **Install Graph CLI:**
```
npm install -g @graphprotocol/graph-cli
```
2. **Authenticate & deploy:**
```
graph auth --product hosted-service <ACCESS_TOKEN>
graph deploy --product hosted-service username/subgraph-name
```

📌 Future Improvements

Mobile-friendly dashboard UI

Integration with additional wallet providers

Role-based notifications for pending validations

Multi-language support for broader adoption
---

🤝 Contributing

Pull requests are welcome. For major changes, please open an issue to discuss your ideas.

---

📜 License

This project is licensed under the MIT License.

---


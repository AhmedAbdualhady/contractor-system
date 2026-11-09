# Contractor System

```
contractor-system/
├── server/   Express + MySQL API
└── client/   Next.js (next step)
```

## Run the server
```bash
cd server
cp .env.example .env        # fill in DB + JWT_SECRET
mysql -u root -p < database/schema.sql
npm install
npm run db:seed             # creates the admin account
npm run dev
```
Test: http://localhost:5000/api/health

## Create the client
```bash
npx create-next-app@latest client
cd client && npm i framer-motion
```

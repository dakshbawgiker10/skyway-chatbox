# SkyWay Knowledge Chatbot

Internal RAG assistant for airport services SOPs, pass requirements, and shift procedures.

## Setup

```bash
cp .env.example .env.local
# add your Groq key to GROQ_API_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Employee chat: `/chat`
- Admin uploads: `/admin`

## Notes

- Documents are chunked (~500 characters) and stored in memory on the serverless instance.
- Retrieval uses BM25 keyword search (no extra embedding API), which fits Vercel function limits.
- On Vercel, memory does not persist across cold starts. Use Vercel KV or a vector store for production persistence.


## Website:
- The website is live at "https://skyway-chatbox.vercel.app/"

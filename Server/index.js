const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk'); // Import Groq SDK

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
}));

// Initialize Groq client
const groqClient = new Groq({ apiKey: GROQ_API_KEY });

// Endpoint to interact with Groq API
app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body;

  try {
    // Create chat completion using the SDK
    const chatCompletion = await groqClient.chat.completions.create({
      messages,
      model,
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const response = chatCompletion.choices[0]?.message?.content || 'No response generated.';
    res.json({ response });
  } catch (error) {
    console.error('Error communicating with Groq SDK:', error.message);
    res.status(500).json({ error: 'Failed to fetch response from Groq API' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

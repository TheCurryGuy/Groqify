const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk'); 
const { GoogleGenerativeAI } = require('@google/generative-ai'); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

app.use(express.json());
app.use(cors({
    origin: 'https://groqify.vercel.app',
}));
  

// Initialize Clients
const groqClient = new Groq({ apiKey: GROQ_API_KEY });

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.get("/", (req, res) => {

  res.json({
      message: "Server running"
  })
})

app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body;

  try {
    let response = '';

    if (model && model.startsWith('gemini')) {
      const geminiModel = genAI.getGenerativeModel({ model });
      const prompt = messages.map(msg => msg.content).join('\n');
      const result = await geminiModel.generateContent(prompt);
      response = result.response.text();
    } else {
      // Otherwise, will use Groq as usual
      const chatCompletion = await groqClient.chat.completions.create({
        messages,
        model,
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });
      response = chatCompletion.choices[0]?.message?.content || 'No response generated.';
    }

    res.json({ response });
  } catch (error) {
    console.error('Error communicating with APIs:', error.message);
    res.status(500).json({ error: 'Failed to fetch response from API' });
  }
});

app.listen(3000, () => {
  console.log(`Server is running `);
});

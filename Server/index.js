const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk'); 
const { GoogleGenerativeAI } = require('@google/generative-ai'); 
const OpenAI = require('openai');

dotenv.config();

const app = express();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BACKUP_API_KEY = process.env.BACKUP_API_KEY;

app.use(express.json());
app.use(cors({
    origin: 'https://groqify.vercel.app'
}));
  
const backupModel = "Llama-3.3-70b-versatile";

// Initialize Clients
const groqClient = new Groq({ apiKey: GROQ_API_KEY });
const groqClient2 = new Groq({ apiKey: BACKUP_API_KEY });


const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

//gpt
const token = OPENAI_API_KEY; // Fetch OpenAI API key from environment
const endpoint = "https://models.inference.ai.azure.com";
const openAIClient = new OpenAI({ baseURL: endpoint, apiKey: token });

app.get("/", (req, res) => {

  res.json({
      message: "Server running"
  })
})

app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body;
  let response = '';

  const invokeBackupAssistant = async () => {
    try {
      const backupCompletion = await groqClient2.chat.completions.create({
        messages: [
          { role: "system", content: "You are a Backup Assistant, activated because the primary model could not fulfill the task. Please assist the user efficiently." },
          ...messages
        ],
        model: backupModel,
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });
      return backupCompletion.choices[0]?.message?.content || 'Backup Assistant: No response generated.';
    } catch (backupError) {
      console.error('Error with backup API:', backupError.message);
      throw new Error('Backup Assistant also failed.');
    }
  };

  const validateResponse = (output) => {
    return output && output.trim() !== ''; // Ensures non-empty and meaningful content
  };

  try {
    if (model && model.startsWith('gemini')) {
      const geminiModel = genAI.getGenerativeModel({ model });
      const prompt = messages.map(msg => msg.content).join('\n');
      const result = await geminiModel.generateContent(prompt);
      const geminiResponse = result.response?.text();

      // Validate Gemini response
      if (!validateResponse(geminiResponse)) {
        throw new Error('Gemini model produced an invalid or empty response.');
      }

      response = geminiResponse;
    } else if (model && model.startsWith('gpt')) {
      const result = await openAIClient.chat.completions.create({
        messages: messages,
        temperature: 1.0,
        top_p: 1.0,
        max_tokens: 1000,
        model: model
      });
      const gptResponse = result.choices[0]?.message?.content;

      // Validate GPT response
      if (!validateResponse(gptResponse)) {
        throw new Error('GPT model produced an invalid or empty response.');
      }

      response = gptResponse;
    } else {
      // Use Groq by default
      const chatCompletion = await groqClient.chat.completions.create({
        messages,
        model,
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });
      const groqResponse = chatCompletion.choices[0]?.message?.content;

      // Validate Groq response
      if (!validateResponse(groqResponse)) {
        throw new Error('Groq model produced an invalid or empty response.');
      }

      response = groqResponse;
    }

    // Send response if valid
    res.json({ response });
  } catch (error) {
    console.error('Primary model error:', error.message);

    try {
      // Invoke the backup assistant
      response = await invokeBackupAssistant();
      res.json({ response });
    } catch (backupError) {
      console.error('Backup model error:', backupError.message);
      res.status(500).json({ error: 'Both primary and backup models failed.' });
    }
  }
});


app.listen(3000, () => {
  console.log(`Server is running `);
});
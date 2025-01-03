const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk'); 
const { GoogleGenerativeAI } = require('@google/generative-ai'); 
const OpenAI = require('openai');
const { HfInference } = require("@huggingface/inference");

dotenv.config();

const app = express();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BACKUP_API_KEY = process.env.BACKUP_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

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

//hfclient
const hfclient = new HfInference(HF_API_KEY);

app.get("/", (req, res) => {

  res.json({
      message: "Server running"
  })
})

app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body;
  let response = '';

  try {

    if (model && model.startsWith('gemini')) {
      const geminiModel = genAI.getGenerativeModel({ model });
      const prompt = messages.map(msg => msg.content).join('\n');
      const result = await geminiModel.generateContent(prompt);
      response = result.response.text();
    } else if (model && model.startsWith('gpt')) {
      const result = await openAIClient.chat.completions.create({
        messages: messages,
        temperature: 1.0,
        top_p: 1.0,
        max_tokens: 1024,
        model: model
      });
      response = result.choices[0]?.message?.content || 'No response generated.';
    } else if(model === 'Qwen2.5-Coder-32B-Instruct'){
      const chatCompletion = await hfclient.chatCompletion({
        model: "Qwen/Qwen2.5-Coder-32B-Instruct",
        messages,
        max_tokens: 500
      });
      response = chatCompletion.choices[0]?.message?.content || 'No response generated.';
    } else {
      // Otherwise, will use Groq as usual
      const result = await groqClient.chat.completions.create({
        messages,
        model,
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });
      response = result.choices[0]?.message?.content || 'No response generated.';
    }

    res.json({ response });
  } catch (error) {
    console.error('Error communicating with APIs:', error.message);
    res.status(500).json({ error: 'Failed to fetch response from primary APIs.' });
  }
});


app.post('/api/chat/v2', async (req, res) => {
  const { messages, model } = req.body;
  let response = '';
  try{
    const result = await groqClient2.chat.completions.create({
      messages: [
        { role: "system", content: "You are a Backup Assistant - Of TheCurryGuy please mention it as a HEADING of your response also please let the user know their chosen model failed to generate , hence you are activated because the LLM the user was trying to access is currently unreachable. Your task is to assist the user in completing their respective tasks. Make sure to acknowledge your role at the beginning of each response and continue to help them efficiently." },
        ...messages 
      ],
      model: backupModel,
      temperature: 1.5,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });
    response = result.choices[0]?.message?.content || 'No response generated.';
    res.json({ response });
    }
    catch(error){
      console.error('Error with backup API:', error.message);
      res.status(500).json({ error: 'Failed to fetch response from both primary and backup APIs.' });
    }
});

app.listen(3000, () => {
  console.log(`Server is running `);
});
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
const generationConfig = {
  temperature: 1,
  topP: 1,
  topK: 40,
  maxOutputTokens: 3072,
  responseMimeType: "text/plain",
};

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
      const prompt = messages.map(msg => msg.content).join('\n'); // Extract input from messages array
      const chatSession = geminiModel.startChat({ generationConfig });
      const result = await chatSession.sendMessage(prompt);
      response = result.response.text();
    } else if (model && model.startsWith('gpt')) {
      const result = await openAIClient.chat.completions.create({
        messages: messages,
        temperature: 1.0,
        top_p: 1.0,
        max_tokens: 2048,
        model: model
      });
      response = result.choices[0]?.message?.content || 'No response generated.';
    } else if(model === 'Qwen2.5-1.5B-Instruct'){
      let out = "";
      const stream = hfclient.chatCompletionStream({
        model: "Qwen/Qwen2.5-1.5B-Instruct",
        messages,
        temperature: 1,
        max_tokens: 1024,
        top_p: 0.7
      });

      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices.length > 0) {
          const newContent = chunk.choices[0].delta.content;
          out += newContent;
        }
      }

      response = out || 'No response generated.';
    } else if(model === 'Phi-3.5-mini-instruct'){
      let out = "";
      const stream = hfclient.chatCompletionStream({
        model: "microsoft/Phi-3.5-mini-instruct",
        messages,
        temperature: 1,
        max_tokens: 1024,
        top_p: 0.7
      });

      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices.length > 0) {
          const newContent = chunk.choices[0].delta.content;
          out += newContent;
        }
      }

      response = out || 'No response generated.';
    } else {
      // Otherwise, will use Groq as usual
      const result = await groqClient.chat.completions.create({
        messages,
        model,
        temperature: 1,
        max_tokens: 2048,
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

app.post('/api/chat/v3', async (req, res) => {
  const { messages, image_url } = req.body;
  let response = '';
  try{
    const result = await groqClient2.chat.completions.create({
      "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": messages
          },
          {
            "type": "image_url",
            "image_url": {
              "url": image_url
            }
          }
        ]
      }
    ],
    "model": "llama-3.2-11b-vision-preview",
    "temperature": 1,
    "max_tokens": 2048,
    "top_p": 1,
    "stream": false,
    "stop": null
    });
    response = result.choices[0]?.message?.content || 'No response generated.';
    res.json({ response });
    }
    catch(error){
      console.error('Error with backup API:', error.message);
      res.status(500).json({ error: 'Failed to fetch response from the image reasoning model' });
    }
});

app.listen(3000, () => {
  console.log(`Server is running `);
});
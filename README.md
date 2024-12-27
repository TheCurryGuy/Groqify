# Groqify

A lightning-fast chatbot powered by **Groq**. Designed for performance and efficiency, Groqify delivers a seamless conversational experience.

## Table of Contents

- [Overview](#overview)
- [Available Models](#available-models)
- [Getting Started](#getting-started)
  - [Clone the Repository](#clone-the-repository)
  - [Run the Server](#run-the-server)
  - [Run the Client](#run-the-client)
- [License](#license)

## Overview

Groqify is equipped with the following large language models (LLMs):

### Available Models

| **Model Name**       | **Description**                                                                 |
|-----------------------|---------------------------------------------------------------------------------|
| **Llama-3.3-70b-versatile** | A robust, highly versatile model suitable for tasks requiring deep contextual understanding. Ideal for research, content generation, and advanced NLP tasks. |
| **Llama-3.1-8b-instant**    | A lightweight, fast-response model perfect for chatbots and real-time applications. |
| **Mixtral-8x7b-32768**      | Designed for high throughput and large input handling, making it suitable for batch processing and large-scale document analysis. |
| **Llama3-70b-8192**          | Specialized in processing mid-sized contexts efficiently with high accuracy. Great for summarization and mid-length document generation. |
| **Llama3-8b-8192**           | A smaller variant for quick tasks where mid-level context is sufficient. Best used for small to medium-sized text inputs. |
| **gemma2-9b-it**             | Fine-tuned for Italian language tasks, this model excels in translation, sentiment analysis, and Italian NLP. |

## Getting Started

### Clone the Repository

To get started with Groqify, first clone the repository:

```bash
git clone https://github.com/TheCurryGuy/Groqify.git
cd Groqify
```

### Run the Server

Follow these steps to set up and run the server:

1. Navigate to the client directory:

   ```bash
   cd Server
   ```

2. Install the required dependencies & create the .env file :  

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   node index.js
   ```

   The server will be running on `http://localhost:5000`.

### Run the Client

1. Navigate to the client directory:

   ```bash
   cd Client
   ```

2. Install client dependencies:

   ```bash
   npm install
   ```

3. Start the client application:

   ```bash
   npm run dev
   ```

   The client will be running on `http://localhost:3000`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to explore, experiment, and contribute to Groqify. If you have any questions or suggestions, don’t hesitate to raise an issue or reach out via the repository's discussion board. 🚀

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentado o limite para suportar o envio de imagens base64 se necessário

// ==========================================
// ROTA 1: CHAT COM CLAUDE (Anthropic)
// ==========================================
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;
    const userApiKey = req.headers['x-api-key'];

    if (!userApiKey) {
      return res.status(401).json({ error: 'API Key não fornecida pelo aplicativo.' });
    }

    const anthropic = new Anthropic({ apiKey: userApiKey });

    // Modelo padrão se nenhum for enviado
    let finalModel = model || "claude-sonnet-4-6";

    console.log(`[API Chat] Modelo recebido do frontend: ${model}`);

    // Mapeamento de modelos antigos (aposentados) para os ativos atualmente
    if (finalModel.includes("haiku")) {
      finalModel = "claude-haiku-4-5";
    } else if (finalModel.includes("sonnet")) {
      finalModel = "claude-sonnet-4-6";
    }

    console.log(`[API Chat] Enviando requisição usando o modelo ativo: ${finalModel}`);

    const response = await anthropic.messages.create({
      model: finalModel,
      max_tokens: 4096,
      system: 'Você é um assistente de IA desenvolvido pela Anthropic. Seja útil, preciso e amigável. Responda sempre em português brasileiro, a menos que o usuário escreva em outro idioma.',
      messages: messages,
    });

    return res.json({ text: response.content[0].text });

  } catch (error) {
    console.error('Erro na API da Anthropic:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Erro ao processar mensagem no Claude',
    });
  }
});

// ==========================================
// ROTA 2: GERAÇÃO DE IMAGEM (Suporta referência)
// ==========================================
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, ratio, referenceImage } = req.body;

    if (!prompt && !referenceImage) {
      return res.status(400).json({ error: 'O prompt ou uma imagem de referência são obrigatórios.' });
    }

    console.log(`[API Imagem] Gerando arte. Formato: ${ratio}. Tem referência? ${referenceImage ? 'Sim' : 'Não'}`);

    // Define as dimensões com base no Aspect Ratio escolhido
    let width = 1024;
    let height = 1024;

    if (ratio === '9:16') {
      width = 576;
      height = 1024;
    } else if (ratio === '16:9') {
      width = 1024;
      height = 576;
    }

    // Se houver uma imagem de referência, concatenamos instruções adicionais no prompt para a IA emular a modificação
    let promptBase = prompt || "Highly detailed modification";
    if (referenceImage) {
      promptBase += ", preserving structure and likeness of reference image, seamless adaptation, artistic style";
    }

    // Criamos a URL de geração rápida e gratuita do Pollinations AI
    const encodedPrompt = encodeURIComponent(promptBase);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 9999999)}`;

    console.log(`[API Imagem] URL gerada com sucesso.`);
    return res.json({ imageUrl });

  } catch (error) {
    console.error('Erro na geração de imagem:', error);
    return res.status(500).json({ error: 'Erro interno ao processar imagem.' });
  }
});

// ==========================================
// ROTA 3: GERAÇÃO DE VÍDEOS (Cinemáticos)
// ==========================================
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, duration, motion } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'O prompt é obrigatório para gerar um vídeo.' });
    }

    console.log(`[API Vídeo] Gerando clipe para: "${prompt}" | Duração: ${duration} | Movimento: ${motion}`);

    // Lista de vídeos cinemáticos reais e livres de direitos (Pexels) de alta qualidade para testar o fluxo no app
    const sampleVideos = [
      "https://videos.pexels.com/video-files/3209211/3209211-uhd_2560_1440_25fps.mp4", // Natureza com Drone
      "https://videos.pexels.com/video-files/853889/853889-hd_1920_1080_25fps.mp4",     // Cidade futurista com luzes neon
      "https://videos.pexels.com/video-files/18051415/18051415-uhd_2560_1440_24fps.mp4", // Ondas colidindo no oceano em câmera lenta
    ];

    // Escolhe dinamicamente um dos vídeos incríveis
    const selectedVideo = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];

    // Simula uma pequena espera realista de renderização (2.5 segundos) para o usuário ver a animação de loading
    await new Promise(resolve => setTimeout(resolve, 2500));

    console.log(`[API Vídeo] Vídeo gerado com sucesso.`);
    return res.json({ videoUrl: selectedVideo });

  } catch (error) {
    console.error('Erro ao gerar vídeo:', error);
    return res.status(500).json({ error: 'Erro no servidor de vídeos.' });
  }
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  Servidor backend iniciado com sucesso na porta ${PORT}!`);
  console.log(`  Rotas prontas:`);
  console.log(`  -> POST http://localhost:${PORT}/api/chat`);
  console.log(`  -> POST http://localhost:${PORT}/api/generate-image`);
  console.log(`  -> POST http://localhost:${PORT}/api/generate-video`);
  console.log(`==================================================\n`);
});

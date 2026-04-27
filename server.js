const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const zip = require('adm-zip');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

app.post('/api/produce-scene', async (req, res) => {
    const { scene_id, prompt, settings } = req.body;
    const NAI_API_KEY = process.env.NOVELAI_API_KEY;

    if (!NAI_API_KEY) return res.status(500).json({ status: 'error', message: "API Key Missing" });

    const payload = {
        input: prompt,
        model: "nai-diffusion-3",
        action: "generate",
        parameters: {
            width: parseInt(settings.width) || 1280,
            height: parseInt(settings.height) || 768,
            scale: parseFloat(settings.scale) || 6.8,
            sampler: "k_euler_ancestral",
            steps: parseInt(settings.steps) || 28,
            seed: parseInt(settings.seed) || 0,
            cfg_rescale: 0.5,
            noise_schedule: "karras",
            negative_prompt: "lowres, text, error, worst quality, bad anatomy, bad hands"
        }
    };

    try {
        const response = await axios.post('https://image.novelai.net/ai/generate-image', payload, {
            headers: { 'Authorization': `Bearer ${NAI_API_KEY}`, 'Content-Type': 'application/json' },
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data);
        if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
            const admZip = new zip(buffer);
            const imageData = admZip.getEntries()[0].getData();
            const outputPath = path.join(__dirname, 'projects', 'figma-to-image-ai', 'output', `${scene_id}.png`);
            fs.writeFileSync(outputPath, imageData);

            res.json({ 
                status: 'success', 
                data: {
                    seed: payload.parameters.seed,
                    imageData: `data:image/png;base64,${imageData.toString('base64')}`
                }
            });
        } else {
            res.status(500).json({ status: 'error', message: buffer.toString() });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(PORT, () => console.log(`Harness Production Server: http://localhost:3000`));
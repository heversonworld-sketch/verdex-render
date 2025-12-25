const express = require('express');
const formidable = require('formidable');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static('public'));

// ✅ ROTA ROOT ADICIONADA AQUI
app.get('/', (req, res) => {
  res.json({ 
    status: 'VERDEX API LIVE ✅', 
    endpoints: ['/', '/api/health', '/api/plantnet'],
    url: 'https://verdex-render.onrender.com'
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'VERDEX OK' }));

app.post('/api/plantnet', (req, res) => {
  const form = formidable({ maxFileSize: 50 * 1024 * 1024 });
  
  form.parse(req, async (err, fields, files) => {
    if (err || !files.image) {
      return res.status(400).json({ error: 'Imagem obrigatória (key=image)' });
    }

    try {
      const file = Array.isArray(files.image) ? files.image[0] : files.image;
      
      const plantnetForm = new FormData();
      plantnetForm.append('api-key', process.env.PLANTNET_API_KEY || 'demo');
      plantnetForm.append('images[0]', fs.createReadStream(file.filepath));
      plantnetForm.append('organs[]', 'auto');
      plantnetForm.append('lang', 'pt');

      const response = await fetch('https://my-api.plantnet.org/v2/identify/all', {
        method: 'POST',
        body: plantnetForm
      });

      const data = await response.json();
      const bestMatch = data.results?.[0];

      res.json({
        success: true,
        plant: bestMatch,
        confidence: Math.round((bestMatch?.score || 0) * 100),
        name: bestMatch?.species?.commonNames?.[0] || bestMatch?.species?.scientificNameWithoutAuthor || 'Desconhecida',
        xp: Math.floor((bestMatch?.score || 0) * 250)
      });

      fs.unlinkSync(file.filepath);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 VERDEX on port ${port}`));

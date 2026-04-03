const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend is connected and running!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/log', (req, res) => {
  console.log('BROWSER LOG:', req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

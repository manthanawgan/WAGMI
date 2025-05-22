const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'WAGMI-9000 Echo Unit Online', timestamp: new Date().toISOString() });
});

app.post('/wagmi', (req, res) => {
  try {
    const body = req.body;

    if (!body || Object.keys(body).length === 0 || (!body.hasOwnProperty('a') && !body.hasOwnProperty('b'))) {
      return res.json({
        message: "wagmi",
        timestamp: new Date().toISOString(),
        lang: "Node.js"
      });
    }

    if (body.hasOwnProperty('a') || body.hasOwnProperty('b')) {
      const { a, b } = body;

      if (a === undefined || b === undefined) {
        return res.status(400).json({ error: "Invalid input" });
      }
 
      if (typeof a !== 'number' || typeof b !== 'number') {
        return res.status(400).json({ error: "Invalid input" });
      }

      if (a < 0 || b < 0) {
        return res.status(400).json({ error: "Invalid input" });
      }

      if (a + b > 100) {
        return res.status(400).json({ error: "Invalid input" });
      }

      return res.json({
        result: a + b,
        a: a,
        b: b,
        status: "success"
      });
    }

    return res.status(400).json({ error: "Invalid input" });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({ error: "Route not found. Use POST /wagmi" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`WAGMI-9000 online on port ${PORT}`);
  console.log(`Ready to receive transmissions at POST /wagmi`);
});
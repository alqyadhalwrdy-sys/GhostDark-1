const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req,res) => res.send('GhostDark Online 👻 - '+new Date().toISOString()));
app.get('/health', (req,res) => res.json({status:'ok', time: new Date().toISOString(), uptime: process.uptime()}));

app.get('/api/ping', (req,res) => res.json({pong:true}));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`GhostDark server listening on 0.0.0.0:${PORT}`));

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const projetRoutes = require('./routes/projetRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const exportRoutes = require('./routes/exportRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the GDT application API!' });
});
app.use('/api/users', userRoutes);
app.use('/api/projets', projetRoutes);
app.use('/api/logs', activityLogRoutes);
app.use('/api/exports', exportRoutes);

module.exports = app;

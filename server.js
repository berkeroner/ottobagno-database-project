const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => res.redirect('/login.html'));

app.listen(3000, () => console.log('Server running: http://localhost:3000'));

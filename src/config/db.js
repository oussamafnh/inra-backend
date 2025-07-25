const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,

    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB Connection Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB Disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB Reconnected');
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;

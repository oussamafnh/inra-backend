const User = require('../models/User');

const userMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.json({ message: 'No auth token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.json({ message: 'No auth token provided' });
    }

    const user = await User.findOne({ auth_token: token });

    if (!user) {
      return res.json({ message: 'User not found' });
    }
    if (user.status == 'disabled') {
      return res.json({ message: 'User not found' });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = userMiddleware;

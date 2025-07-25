const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = {

  getChercheurs: async (req, res) => {
    try {
      const chercheurs = await User.find({ role: 'chercheur' }).select('-password -auth_token');
      res.json(chercheurs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getChercheur: async (req, res) => {
    try {
      const { id } = req.params;
      const chercheur = await User.findById(id).select('-password -auth_token');
      if (!chercheur) return res.status(404).json({ error: 'User not found' });
      res.json(chercheur);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createChercheur: async (req, res) => {
    try {
      let { fullName, password, codeCentre, code } = req.body;

      fullName = fullName.trim();

      const utilisateurExistant = await User.findOne({
        fullName: { $regex: new RegExp(`^${fullName}$`, 'i') },
      });

      if (utilisateurExistant) {
        return res.json({ message: 'Un utilisateur existe déjà avec ce nom.' });
      }

      const utilisateurAvecCodeExistant = await User.findOne({
        codeCentre: { $regex: new RegExp(`^${codeCentre}$`, 'i') },
        code: { $regex: new RegExp(`^${code}$`, 'i') }
      });

      if (utilisateurAvecCodeExistant) {
        return res.json({ message: 'Un utilisateur existe déjà avec ce code et codeCentre.' });
      }

      const motDePasseHache = await bcrypt.hash(password, 10);

      const nouvelUtilisateur = new User({
        fullName,
        password: motDePasseHache,
        codeCentre,
        code,
      });

      await nouvelUtilisateur.save();
      res.json({ message: 'Chercheur créé avec succès' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  activateChercheur: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedUser = await User.findByIdAndUpdate(id, { status: 'active' }, { new: true });
      if (!updatedUser) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'Chercheur activated successfully', user: updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deactivateChercheur: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedUser = await User.findByIdAndUpdate(id, { status: 'disabled' }, { new: true });
      if (!updatedUser) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'Chercheur deactivated successfully', user: updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      let { fullName, password } = req.body;

      fullName = fullName.trim();

      let user = await User.findOne({
        fullName: { $regex: new RegExp(`^${fullName}$`, 'i') }
      });

      if (!user) {

        if (fullName === 'admin' && password === 'applicationGDT') {

          user = await User.findOne({ fullName });
          if (!user) {
            user = new User({
              fullName: 'admin',
              password: await bcrypt.hash(password, 10),
              role: 'admin',
            });
            await user.save();
          }
        } else {
          return res.json({ status: "nonloged", message: "Nom d'utilisateur non trouvé." });
        }
      }
      if (user.status === 'disabled') {
        return res.json({ status: "nonloged", message: "Votre compte est désactivé." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.json({ status: "nonloged", message: "Mot de passe incorrect." });
      }

      const authToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT,
        { expiresIn: '7d' }
      );

      user.auth_token = authToken;
      await user.save();

      res.json({
        status: "loged",
        message: 'Login successful',
        authToken,
        role: user.role,
        id: user._id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  validateToken: async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        return res.json({ status: "non logged" });
      }

      const token = authHeader.split(' ')[1];

      const user = await User.findOne({ auth_token: token });
      if (!user) {
        return res.json({ status: "non logged", message: "Token non trouvé dans la base de données." });
      }

      try {
        jwt.verify(token, process.env.JWT);
      } catch (error) {
        return res.json({ status: "non logged", message: "Token invalide." });
      }

      res.json({
        status: "logged",
        id: user._id,
        fullName: user.fullName,
        role: user.role,
      });
    } catch (error) {
      console.error(error);
      res.json({ status: "non logged", message: "Erreur serveur." });
    }
  },

  logout: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      user.auth_token = null;
      await user.save();

      res.json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAllCodeCentres: async (req, res) => {
    try {

      const codeCentres = await User.distinct('codeCentre', { role: 'chercheur' });

      if (codeCentres.length === 0) {
        return res.status(404).send({ message: 'No codeCentres found for chercheurs.' });
      }

      res.status(200).json({ codeCentres });
    } catch (error) {
      res.status(500).send({
        message: `Error: ${error.message}`
      });
    }
  }
};

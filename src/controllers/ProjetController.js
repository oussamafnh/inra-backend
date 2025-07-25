const Megaprojet = require('../models/MegaProjet');
const Axe = require('../models/Axe');
const Activite = require('../models/Activite');
const mongoose = require('mongoose');

const ProjetController = {

  createMegaprojet: async (req, res) => {
    try {
      const { MEGAPROJET, filiere, CRRA, COORDINATEUR } = req.body;

      const newMegaprojet = new Megaprojet({
        MEGAPROJET,
        filiere,
        CRRA,
        COORDINATEUR,
      });

      await newMegaprojet.save();

      res.status(201).json({ message: 'MEGAPROJET created successfully', data: newMegaprojet });
    } catch (error) {
      res.status(500).json({ message: 'Error creating MEGAPROJET', error: error.message });
    }
  },

  createAxe: async (req, res) => {
    try {
      const { megaprojet_id, AXE } = req.body;

      const megaprojet = await Megaprojet.findById(megaprojet_id);
      if (!megaprojet) {
        return res.status(404).json({ message: 'No MEGAPROJET found with that ID' });
      }

      const newAxe = new Axe({
        megaprojet_id,
        AXE,
      });

      await newAxe.save();

      res.status(201).json({
        message: 'AXE created successfully',
        data: newAxe,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating AXE', error: error.message });
    }
  },

  createActivite: async (req, res) => {
    try {
      const { megaprojet_id, axe_id, ACTIVITE, CodeActivite } = req.body;

      const existingActivite = await Activite.findOne({ CodeActivite });
      if (existingActivite) {
        return res.status(201).json({ message: "Le Code d'activité est déjà utilisé par une autre activité." });
      }

      const megaprojet = await Megaprojet.findById(megaprojet_id);
      if (!megaprojet) {
        return res.status(404).json({ message: 'MEGAPROJET not found' });
      }

      const axe = await Axe.findById(axe_id);
      if (!axe) {
        return res.status(404).json({ message: 'AXE not found' });
      }

      const newActivite = new Activite({
        megaprojet_id,
        axe_id,
        ACTIVITE,
        CodeActivite,
      });

      await newActivite.save();

      res.status(201).json({ message: 'ACTIVITE created successfully', data: newActivite });
    } catch (error) {
      res.status(500).json({ message: 'Error creating ACTIVITE', error: error.message });
    }
  },

  getMegaprojets: async (req, res) => {
    try {
      const megaprojets = await Megaprojet.find().lean().exec();
      res.status(200).json({ message: 'MEGAPROJETs retrieved successfully', data: megaprojets });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving MEGAPROJETs', error: error.message });
    }
  },

  getAxesByMegaprojet: async (req, res) => {
    try {
      const { megaprojet_id } = req.params;

      const megaprojet = await Megaprojet.findById(megaprojet_id).lean().exec();
      if (!megaprojet) {
        return res.status(404).json({ message: 'MEGAPROJET not found' });
      }

      const axes = await Axe.find({ megaprojet_id }).lean().exec();
      res.status(200).json({ message: 'AXEs retrieved successfully', megaprojet: megaprojet.MEGAPROJET, data: axes });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving AXEs', error: error.message });
    }
  },

  getActivitesByAxe: async (req, res) => {
    try {
      const { axe_id } = req.params;

      const axe = await Axe.findById(axe_id).lean().exec();
      if (!axe) {
        return res.status(404).json({ message: 'AXE not found' });
      }

      const megaprojet = await Megaprojet.findById(axe.megaprojet_id).lean().exec();
      if (!megaprojet) {
        return res.status(404).json({ message: 'Megaprojet not found' });
      }

      const activites = await Activite.find({ axe_id }).lean().exec();

      res.status(200).json({
        message: 'ACTIVITEs retrieved successfully',
        megaprojet_id: megaprojet._id,
        megaprojet: megaprojet.MEGAPROJET,
        axe_id: axe._id,
        axe: axe.AXE,
        data: activites,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving ACTIVITEs', error: error.message });
    }
  },

  searchByCodeActivite: async (req, res) => {
    try {
      const { CodeActivite } = req.params;

      const activite = await Activite.findOne({ CodeActivite });
      if (!activite) {
        return res.status(404).json({ message: 'No activity found with this code.' });
      }

      if (!activite.megaprojet_id || !activite.axe_id) {
        return res.status(400).json({
          message: 'Activity is missing associated Megaprojet or Axe ID.',
        });
      }

      const megaprojet = await Megaprojet.findById(activite.megaprojet_id);
      const axe = await Axe.findById(activite.axe_id);

      if (!megaprojet || !axe) {
        return res.status(404).json({ message: 'Megaprojet or Axe not found.' });
      }

      const megaprojetName = megaprojet.MEGAPROJET || 'Unknown Megaprojet Name';
      const axeName = axe.AXE || 'Unknown Axe Name';

      res.status(200).json({
        message: 'Activity retrieved successfully',
        data: {
          ...activite.toObject(),
          megaprojetName,
          axeName,
        },
      });
    } catch (error) {
      console.error('Error in searchByCodeActivite:', error);
      res.status(500).json({ message: 'Error searching for activity', error: error.message });
    }
  },

  editMegaProjet: async (req, res) => {
    const { id } = req.params;
    const { MEGAPROJET, filiere, COORDINATEUR, CRRA, status } = req.body;
    try {
      const updatedMegaProjet = await Megaprojet.findByIdAndUpdate(
        id,
        { MEGAPROJET, filiere, COORDINATEUR, CRRA, status },
        { new: true }
      );
      if (!updatedMegaProjet) {
        return res.status(404).json({ message: 'MegaProjet not found' });
      }
      res.status(200).json({ message: 'MegaProjet a été modifié avec succès', updatedMegaProjet });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  toggleMegaProjetStatus: async (req, res) => {
    const { id } = req.params;
    try {
      const megaprojet = await Megaprojet.findById(id);
      if (!megaprojet) {
        return res.status(404).json({ message: 'MegaProjet not found' });
      }

      megaprojet.status = megaprojet.status === 'active' ? 'disabled' : 'active';
      await megaprojet.save();

      res.status(200).json({
        message: `MegaProjet ${megaprojet.status === 'active' ? 'activated' : 'disabled'}`,
        megaprojet,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteMegaProjet: async (req, res) => {
    const { id } = req.params;

    try {

      await Activite.deleteMany({ megaprojet_id: id });

      await Axe.deleteMany({ megaprojet_id: id });

      const megaprojet = await Megaprojet.findByIdAndDelete(id);

      if (!megaprojet) {
        return res.status(404).json({ message: 'MegaProjet not found' });
      }

      res.status(200).json({ message: 'MegaProjet, Activities, and Axes deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  editAxes: async (req, res) => {
    const { id } = req.params;
    const { megaprojet_id, AXE, status } = req.body;
    try {
      const updatedAxes = await Axe.findByIdAndUpdate(
        id,
        { megaprojet_id, AXE, status },
        { new: true }
      );
      if (!updatedAxes) {
        res.status(200).json({ message: 'Axe a été modifié avec succès', updatedAxes });
      }
      res.status(200).json(updatedAxes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  toggleAxesStatus: async (req, res) => {
    const { id } = req.params;
    try {
      const axes = await Axe.findById(id);
      if (!axes) {
        return res.status(404).json({ message: 'Axes not found' });
      }

      axes.status = axes.status === 'active' ? 'disabled' : 'active';
      await axes.save();

      res.status(200).json({
        message: `Axes ${axes.status === 'active' ? 'activated' : 'disabled'}`,
        axes,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteAxes: async (req, res) => {
    const { id } = req.params;
    try {
      await Activite.deleteMany({ axe_id: id });
      const axes = await Axe.findByIdAndDelete(id);
      if (!axes) {
        return res.status(404).json({ message: 'Axes not found' });
      }
      res.status(200).json({ message: 'Axes deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  editActi: async (req, res) => {
    const { id } = req.params;
    const { megaprojet_id, axe_id, ACTIVITE, CodeActivite, status } = req.body;

    try {

      const existingActi = await Activite.findOne({ CodeActivite, _id: { $ne: id } });

      if (existingActi) {

        return res.json({ message: 'Le Code d\'activité est déjà utilisé par une autre activité.' });
      }

      const updatedActi = await Activite.findByIdAndUpdate(
        id,
        { megaprojet_id, axe_id, ACTIVITE, CodeActivite, status },
        { new: true }
      );

      if (!updatedActi) {
        return res.status(404).json({ message: 'Activité non trouvée.' });
      }

      res.status(200).json({ message: 'Activité a été modifiée avec succès.', updatedActi });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  toggleActiStatus: async (req, res) => {
    const { id } = req.params;
    try {
      const acti = await Activite.findById(id);
      if (!acti) {
        return res.status(404).json({ message: 'Acti not found' });
      }

      acti.status = acti.status === 'active' ? 'disabled' : 'active';
      await acti.save();

      res.status(200).json({
        message: `Acti ${acti.status === 'active' ? 'activated' : 'disabled'}`,
        acti,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteActi: async (req, res) => {
    const { id } = req.params;
    try {
      const acti = await Activite.findByIdAndDelete(id);
      if (!acti) {
        return res.status(404).json({ message: 'Acti not found' });
      }
      res.status(200).json({ message: 'Acti deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

};

module.exports = ProjetController;

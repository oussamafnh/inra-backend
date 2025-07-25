const ActivityLog = require('../models/ActivityLog');
const Activite = require('../models/Activite');

exports.addActivityLog = async (req, res) => {
  const { activite_id, day, user_id, user_full_name, value, megaprojet_id, axe_id } = req.body;

  try {
    if (!activite_id || !day || !user_id || !user_full_name || value === undefined || !megaprojet_id || !axe_id) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (typeof value !== 'number') {
      return res.status(400).json({ message: 'Value must be a number.' });
    }
    const activityLog = new ActivityLog({
      activite_id,
      day,
      user_id,
      user_full_name,
      value,
      megaprojet_id,
      axe_id,
    });
    await activityLog.save();
    return res.status(201).json({
      message: 'Activity log created successfully.',
      activityLog,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.' });
  }
};
exports.checkActivityLog = async (req, res) => {
  const { activite_id, day, user_id, megaprojet_id, axe_id } = req.query;

  try {
    if (!activite_id || !day || !user_id || !megaprojet_id || !axe_id) {
      return res.status(400).json({ message: 'All query parameters are required.' });
    }
    const existingLog = await ActivityLog.findOne({
      activite_id,
      day,
      user_id,
      megaprojet_id,
      axe_id,
    });
    if (existingLog) {
      return res.status(200).json({
        message: 'not allowed',
        data: existingLog,
      });
    } else {
      return res.status(200).json({
        message: 'allowed',
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAllLogsForUser = async (req, res) => {
  const { user_id } = req.query;

  try {
    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const logs = await ActivityLog.find({ user_id })
      .sort({ day: -1 })
      .exec();
    const logsWithActivityDetails = await Promise.all(
      logs.map(async (log) => {
        const activite = await Activite.findById(log.activite_id);
        return {
          ...log.toObject(),
          activite_name: activite ? activite.ACTIVITE : 'Unknown Activity',
          activite_code: activite ? activite.CodeActivite : 'Unknown Code',
        };
      })
    );

    res.status(200).json({
      message: 'Logs retrieved successfully.',
      data: logsWithActivityDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getLogsForLast7Days = async (req, res) => {
  const { user_id } = req.query;

  try {
    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await ActivityLog.find({
      user_id,
      day: { $gte: sevenDaysAgo },
    })
      .sort({ day: -1 })
      .exec();
    const logsWithActivityDetails = await Promise.all(
      logs.map(async (log) => {
        const activite = await Activite.findById(log.activite_id);
        return {
          ...log.toObject(),
          activite_name: activite ? activite.ACTIVITE : 'Unknown Activity',
          activite_code: activite ? activite.CodeActivite : 'Unknown Code',
        };
      })
    );

    res.status(200).json({
      message: 'Logs for the last 7 days retrieved successfully.',
      data: logsWithActivityDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getLogsForLast15Days = async (req, res) => {
  const { user_id } = req.query;

  try {
    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const logs = await ActivityLog.find({
      user_id,
      day: { $gte: fifteenDaysAgo },
    })
      .sort({ day: -1 })
      .exec();
    const logsWithActivityDetails = await Promise.all(
      logs.map(async (log) => {
        const activite = await Activite.findById(log.activite_id);
        return {
          ...log.toObject(),
          activite_name: activite ? activite.ACTIVITE : 'Unknown Activity',
          activite_code: activite ? activite.CodeActivite : 'Unknown Code',
        };
      })
    );

    res.status(200).json({
      message: 'Logs for the last 15 days retrieved successfully.',
      data: logsWithActivityDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getTotalHoursForLast7Days = async (req, res) => {
  const { user_id } = req.query;

  try {
    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const logs = await ActivityLog.aggregate([
      {
        $match: {
          user_id,
          day: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: "$day",
          totalHours: { $sum: "$value" },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.status(200).json({
      message: 'Total hours for the last 7 days retrieved successfully.',
      data: logs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

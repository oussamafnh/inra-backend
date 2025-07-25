const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt');
const ActivityLog = require('../models/ActivityLog');
const Activite = require('../models/Activite');
const User = require('../models/User');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const ExportController = {

  exportUsers: async (req, res) => {
    try {

      const users = await User.find({ role: 'chercheur' }).select('code codeCentre fullName password');

      if (!users.length) {
        return res.status(404).json({ message: 'Aucun utilisateur trouvé avec le rôle "chercheur".' });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Users');

      worksheet.columns = [
        { header: 'Code', key: 'code', width: 20 },
        { header: 'Code Centre', key: 'codeCentre', width: 20 },
        { header: 'Nom Complet', key: 'fullName', width: 30 },
        { header: 'Mot de Passe dans l application', key: 'password', width: 30 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'c6f6d5' }
      };

      worksheet.getRow(1).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };

      for (const [index, user] of users.entries()) {

        const password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10));

        const row = worksheet.addRow({
          code: user.code || 'N/A',
          codeCentre: user.codeCentre || 'N/A',
          fullName: user.fullName,
          password: password,
        });

        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF' },
          };
        } else {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'edf2f7' },
          };
        }

        row.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
          bottom: { style: 'thin' },
        };
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=utilisateurs_chercheurs.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur lors de la génération du fichier Excel.' });
    }
  },

  exportChercheurMonthlyReport: async (req, res) => {
    try {
      const { chercheur, month } = req.params;

      const user = await User.findOne({ _id: chercheur });
      if (!user) return res.status(404).send('Chercheur not found');

      const startDate = moment(month, 'YYYY-MM').startOf('month').toDate();
      const endDate = moment(month, 'YYYY-MM').endOf('month').toDate();

      const logs = await ActivityLog.find({
        user_id: user._id,
        day: { $gte: startDate, $lte: endDate }
      }).populate('activite_id');

      const activities = await Activite.find({ _id: { $in: logs.map(log => log.activite_id) } });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Monthly Report');

      worksheet.getColumn('A').width = 25;
      worksheet.getColumn('B').width = 20;
      worksheet.columns.forEach((column, i) => {
        if (i > 1) column.width = 30;
      });

      const lastColumn = String.fromCharCode(67 + activities.length);
      worksheet.mergeCells('A1:' + lastColumn + '1');
      worksheet.getCell('A1').value = `Récap de : ${user.fullName} | Code Centre: ${user.codeCentre || 'N/A'} | Code: ${user.code || 'N/A'} | Mois: ${month}`;
      worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getCell('A1').font = { bold: true, size: 12 };
      worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'bee3f8' }
      };
      worksheet.getCell('A1').border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      worksheet.mergeCells('A2:A3');
      worksheet.mergeCells('B2:B3');
      worksheet.mergeCells(`${lastColumn}2:${lastColumn}3`);

      worksheet.getCell('A2').value = 'Jour';
      worksheet.getCell('B2').value = 'Date';
      worksheet.getCell(`${lastColumn}2`).value = 'TOTAL';

      ['A2', 'B2', `${lastColumn}2`].forEach(cell => {
        worksheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getCell(cell).font = { bold: true, size: 12 };
        worksheet.getCell(cell).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '81e6d9' }
        };
        worksheet.getCell(cell).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      activities.forEach((activity, index) => {
        const col = String.fromCharCode(67 + index);
        worksheet.getColumn(col).width = 30;

        worksheet.getCell(`${col}2`).value = activity.ACTIVITE;
        worksheet.getCell(`${col}2`).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        worksheet.getCell(`${col}2`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'c6f6d5' }
        };
        worksheet.getCell(`${col}2`).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        worksheet.getCell(`${col}3`).value = activity.CodeActivite || 'N/A';
        worksheet.getCell(`${col}3`).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        worksheet.getCell(`${col}3`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'c6f6d5' }
        };
        worksheet.getCell(`${col}3`).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      const daysInMonth = moment(month, 'YYYY-MM').daysInMonth();
      const daysInFrench = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

      for (let i = 1; i <= daysInMonth; i++) {
        const dayDate = moment(month, 'YYYY-MM').date(i);
        const dayName = daysInFrench[dayDate.day()];

        const row = [dayName, dayDate.format('DD/MM/YYYY')];
        let totalForDay = 0;

        activities.forEach(activity => {
          const log = logs.find(log =>
            moment(log.day).isSame(dayDate, 'day') &&
            log.activite_id.toString() === activity._id.toString()
          );
          const value = log ? log.value : 0;
          row.push(value);
          totalForDay += value;
        });

        row.push(totalForDay);
        const dataRow = worksheet.addRow(row);

        dataRow.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }

      const totalsRow = ['TOTAL', ''];
      activities.forEach((activity, index) => {
        const col = String.fromCharCode(67 + index);
        const sumFormula = `SUM(${col}4:${col}${3 + daysInMonth})`;
        totalsRow.push({ formula: sumFormula });
      });

      const grandTotalCol = String.fromCharCode(67 + activities.length);
      const grandTotalFormula = `SUM(${grandTotalCol}4:${grandTotalCol}${3 + daysInMonth})`;
      totalsRow.push({ formula: grandTotalFormula });

      const totalRow = worksheet.addRow(totalsRow);

      totalRow.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { bold: true, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'feebc8' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      worksheet.mergeCells(`A${3 + daysInMonth + 1}:B${3 + daysInMonth + 1}`);

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${user.fullName}_${month}.xlsx`);

      res.end(buffer);

    } catch (error) {
      console.error('Error generating Excel file:', error);
      res.status(500).send(`Failed to generate Excel file. Error: ${error.message}`);
    }
  },

  exportChercheurYearlyReport: async (req, res) => {
    try {
      const { chercheur, year } = req.params;

      const user = await User.findOne({ _id: chercheur });
      if (!user) return res.status(404).send('Chercheur not found');

      const startDate = moment(year, 'YYYY').startOf('year').toDate();
      const endDate = moment(year, 'YYYY').endOf('year').toDate();

      const logs = await ActivityLog.find({
        user_id: user._id,
        day: { $gte: startDate, $lte: endDate }
      }).populate('activite_id');

      const activities = await Activite.find({ _id: { $in: logs.map(log => log.activite_id) } });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Yearly Report');

      worksheet.getColumn('A').width = 25;
      worksheet.getColumn('B').width = 20;
      worksheet.columns.forEach((column, i) => {
        if (i > 1) column.width = 30;
      });

      const lastColumn = String.fromCharCode(67 + activities.length);

      worksheet.mergeCells('A1:' + lastColumn + '1');
      worksheet.getCell('A1').value = `Récap de : ${user.fullName} | Code Centre: ${user.codeCentre || 'N/A'} | Code: ${user.code || 'N/A'} | Année: ${year}`;
      worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getCell('A1').font = { bold: true, size: 12 };
      worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'bee3f8' }
      };

      worksheet.mergeCells('A2:A3');
      worksheet.mergeCells('B2:B3');
      worksheet.mergeCells(`${lastColumn}2:${lastColumn}3`);

      worksheet.getCell('A2').value = 'Jour';
      worksheet.getCell('B2').value = 'Date';
      worksheet.getCell(`${lastColumn}2`).value = 'TOTAL';

      ['A2', 'B2', `${lastColumn}2`].forEach(cell => {
        worksheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getCell(cell).font = { bold: true, size: 12 };
        worksheet.getCell(cell).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '81e6d9' }
        };
      });

      activities.forEach((activity, index) => {
        const col = String.fromCharCode(67 + index);
        worksheet.getColumn(col).width = 30;

        worksheet.getCell(`${col}2`).value = activity.ACTIVITE;
        worksheet.getCell(`${col}2`).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        worksheet.getCell(`${col}2`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'c6f6d5' }
        };

        worksheet.getCell(`${col}3`).value = activity.CodeActivite || 'N/A';
        worksheet.getCell(`${col}3`).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        worksheet.getCell(`${col}3`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'c6f6d5' }
        };
      });

      const daysInFrench = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const monthsInFrench = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

      let currentRow = 4;
      let grandTotalForYear = 0;

      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {

        worksheet.mergeCells(`A${currentRow}:${lastColumn}${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = `${monthsInFrench[monthIndex]} ${year}`;
        worksheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        worksheet.getCell(`A${currentRow}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'f4cccc' }
        };
        currentRow++;

        const monthStart = moment([year, monthIndex]);
        const daysInMonth = monthStart.daysInMonth();
        let totalForMonth = 0;

        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = moment([year, monthIndex, day]);
          const dayName = daysInFrench[currentDate.day()];

          const row = [dayName, currentDate.format('DD/MM/YYYY')];
          let totalForDay = 0;

          activities.forEach(activity => {
            const log = logs.find(log =>
              moment(log.day).isSame(currentDate, 'day') &&
              log.activite_id.toString() === activity._id.toString()
            );
            const value = log ? log.value : 0;
            row.push(value);
            totalForDay += value;
          });

          row.push(totalForDay);
          worksheet.addRow(row);
          totalForMonth += totalForDay;
          currentRow++;
        }

        const monthTotalRow = worksheet.getRow(currentRow);

        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = 'TOTAL';

        for (let col = 1; col <= activities.length + 3; col++) {
          const cell = monthTotalRow.getCell(col);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'feebc8' }
          };
          cell.font = { bold: true };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        activities.forEach((activity, index) => {
          const col = String.fromCharCode(67 + index);
          const totalForActivityInMonth = logs.filter(log =>
            moment(log.day).month() === monthIndex && log.activite_id.toString() === activity._id.toString()
          ).reduce((sum, log) => sum + log.value, 0);
          worksheet.getCell(`${col}${currentRow}`).value = totalForActivityInMonth;
        });

        worksheet.getCell(`${lastColumn}${currentRow}`).value = totalForMonth;
        grandTotalForYear += totalForMonth;
        currentRow++;
      }

      worksheet.addRow([]);
      currentRow++;

      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'TOTAL ANNUEL';
      worksheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ffb366' }
      };

      activities.forEach((activity, index) => {
        const col = String.fromCharCode(67 + index);
        const totalForActivityForYear = logs.filter(log =>
          log.activite_id.toString() === activity._id.toString()
        ).reduce((sum, log) => sum + log.value, 0);
        worksheet.getCell(`${col}${currentRow}`).value = totalForActivityForYear;
        worksheet.getCell(`${col}${currentRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getCell(`${col}${currentRow}`).font = { bold: true };
      });

      worksheet.getCell(`${lastColumn}${currentRow}`).value = grandTotalForYear;
      worksheet.getCell(`${lastColumn}${currentRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getCell(`${lastColumn}${currentRow}`).font = { bold: true };
      worksheet.getCell(`${lastColumn}${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ffb366' }
      };

      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${user.fullName}_${year}.xlsx`);

      res.end(buffer);

    } catch (error) {
      console.error('Error generating Excel file:', error);
      res.status(500).send(`Failed to generate Excel file. Error: ${error.message}`);
    }
  },

  exportChercheurYearlyActivitySummary: async (req, res) => {
    try {
      const { chercheur, year } = req.params;

      const user = await User.findOne({ _id: chercheur });
      if (!user) return res.status(404).send('Chercheur not found');

      const startDate = moment(year, 'YYYY').startOf('year').toDate();
      const endDate = moment(year, 'YYYY').endOf('year').toDate();

      const logs = await ActivityLog.find({
        user_id: user._id,
        day: { $gte: startDate, $lte: endDate }
      }).populate('activite_id');

      const activities = await Activite.find({ _id: { $in: logs.map(log => log.activite_id) } });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Yearly Activity Summary');

      worksheet.getColumn('A').width = 25;
      activities.forEach((_, index) => {
        const col = String.fromCharCode(66 + index);
        worksheet.getColumn(col).width = 25;
      });

      const lastColumn = String.fromCharCode(66 + activities.length);
      worksheet.mergeCells('A1:' + lastColumn + '1');
      worksheet.getCell('A1').value = `Récap de : ${user.fullName} | Code Centre: ${user.codeCentre || 'N/A'} | Code: ${user.code || 'N/A'} | Année: ${year}`;
      worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getCell('A1').font = { bold: true, size: 12 };
      worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'bee3f8' }
      };

      worksheet.mergeCells('A2:A3');
      worksheet.mergeCells(`${lastColumn}2:${lastColumn}3`);
      worksheet.getCell('A2').value = 'Mois';
      worksheet.getCell(`${lastColumn}2`).value = 'TOTAL';

      ['A2', `${lastColumn}2`].forEach(cell => {
        worksheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getCell(cell).font = { bold: true, size: 12 };
        worksheet.getCell(cell).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '81e6d9' }
        };
      });

      activities.forEach((activity, index) => {
        const col = String.fromCharCode(66 + index);
        worksheet.getCell(`${col}2`).value = activity.ACTIVITE;
        worksheet.getCell(`${col}2`).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        worksheet.getCell(`${col}2`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'c6f6d5' }
        };
        worksheet.getCell(`${col}3`).value = activity.CodeActivite || 'N/A';
        worksheet.getCell(`${col}3`).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        worksheet.getCell(`${col}3`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'c6f6d5' }
        };
      });

      const monthsInFrench = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

      let currentRow = 4;

      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthLogs = logs.filter(log => moment(log.day).month() === monthIndex);

        let row = [monthsInFrench[monthIndex]];
        let totalForMonth = 0;

        activities.forEach(activity => {
          const activityLogs = monthLogs.filter(log => log.activite_id.toString() === activity._id.toString());
          const totalHours = activityLogs.reduce((sum, log) => sum + log.value, 0);

          row.push(totalHours);
          totalForMonth += totalHours;
        });

        row.push(totalForMonth);
        worksheet.addRow(row);
        currentRow++;
      }

      const totalRow = ['TOTAL ACTIVITÉS'];

      activities.forEach((activity) => {
        const totalForActivity = logs
          .filter(log => log.activite_id.toString() === activity._id.toString())
          .reduce((sum, log) => sum + log.value, 0);

        totalRow.push(totalForActivity);
      });

      const grandTotal = totalRow.slice(1).reduce((sum, total) => sum + total, 0);
      totalRow.push(grandTotal);

      const totalsRow = worksheet.addRow(totalRow);
      totalsRow.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { bold: true, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'feebc8' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${user.fullName}_Yearly_Activity_Summary_${year}.xlsx`);

      await workbook.xlsx.write(res);

    } catch (error) {
      console.error('Error generating Excel file:', error);
      res.status(500).send(`Failed to generate Excel file. Error: ${error.message}`);
    }
  },

  exportChercheurMonthlyGeneral: async (req, res) => {
    function getColumnLetter(index) {
      let letter = '';
      while (index >= 0) {
        letter = String.fromCharCode(index % 26 + 65) + letter;
        index = Math.floor(index / 26) - 1;
      }
      return letter;
    }

    try {
      const { month, codeCentre } = req.params;

      if (!moment(month, 'YYYY-MM', true).isValid()) {
        return res.status(400).send({
          message: 'Format de mois invalide. Veuillez utiliser le format YYYY-MM.'
        });
      }

      const startDate = moment(month, 'YYYY-MM').startOf('month').toDate();
      const endDate = moment(month, 'YYYY-MM').endOf('month').toDate();

      let usersQuery = { role: 'chercheur' };
      if (codeCentre) {
        const codeCentres = codeCentre.split(',');
        usersQuery.codeCentre = { $in: codeCentres };
      }

      const users = await User.find(usersQuery);

      if (users.length === 0) {
        return res.status(404).send({ message: 'Aucun chercheur trouvé pour le codeCentre spécifié.' });
      }

      const activityLogs = await ActivityLog.find({
        day: { $gte: startDate, $lte: endDate },
        user_id: { $in: users.map(user => user._id) }
      });

      const activityIds = [...new Set(activityLogs.map(log => log.activite_id))];
      const activities = await Activite.find({ _id: { $in: activityIds } });

      const userActivityTotals = {};
      activities.forEach(activity => {
        userActivityTotals[activity.CodeActivite] = users.map(user => ({
          userId: user._id,
          total: 0
        }));
      });

      activityLogs.forEach(log => {
        const activity = activities.find(a => a._id.toString() === log.activite_id.toString());
        if (activity) {
          const userTotal = userActivityTotals[activity.CodeActivite].find(
            ut => ut.userId.toString() === log.user_id.toString()
          );
          if (userTotal) {
            userTotal.total += log.value;
          }
        }
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Activity Report');

      worksheet.mergeCells('A1:B1');
      let title = `Recap Generale du Mois : ${month}`;
      if (codeCentre) {
        title += ` pour centres : ${codeCentre}`;
      }

      worksheet.getCell('A1').value = title;
      worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('A1').font = { bold: true, size: 14 };
      worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'bee3f8' }
      };

      worksheet.mergeCells('A2:A4');
      worksheet.getCell('A2').value = 'Code';
      worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('A2').font = { bold: true };
      worksheet.getCell('A2').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '81e6d9' }
      };

      worksheet.mergeCells('B2:B4');
      worksheet.getCell('B2').value = 'Activite';
      worksheet.getCell('B2').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('B2').font = { bold: true };
      worksheet.getCell('B2').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '81e6d9' }
      };

      worksheet.getColumn('A').width = 25;
      worksheet.getColumn('B').width = 25;

      let columnIndex = 3;
      users.forEach(user => {
        const colLetter = getColumnLetter(64 + columnIndex);
        worksheet.getColumn(colLetter).width = 25;

        worksheet.getCell(2, columnIndex).value = user.fullName;
        worksheet.getCell(2, columnIndex).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(2, columnIndex).font = { bold: true };
        worksheet.getCell(2, columnIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '81e6d9' } };

        worksheet.getCell(3, columnIndex).value = user.codeCentre || 'N/A';
        worksheet.getCell(3, columnIndex).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getCell(4, columnIndex).value = user.code || 'N/A';
        worksheet.getCell(4, columnIndex).alignment = { horizontal: 'center', vertical: 'middle' };

        columnIndex++;
      });

      const totalColumnLetter = getColumnLetter(64 + columnIndex);
      worksheet.getColumn(totalColumnLetter).width = 25;

      worksheet.mergeCells(`${totalColumnLetter}2:${totalColumnLetter}4`);
      worksheet.getCell(2, columnIndex).value = 'TOTAL';
      worksheet.getCell(2, columnIndex).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(2, columnIndex).font = { bold: true };
      worksheet.getCell(2, columnIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'fbd38d' } };

      let rowIndex = 5;
      const chercheurTotals = new Array(users.length).fill(0);
      let grandTotal = 0;

      activities.forEach(activity => {
        let rowTotal = 0;
        worksheet.getCell(rowIndex, 1).value = activity.CodeActivite;
        worksheet.getCell(rowIndex, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'c6f6d5' } };
        worksheet.getCell(rowIndex, 2).value = activity.ACTIVITE;
        worksheet.getCell(rowIndex, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'c6f6d5' } };

        columnIndex = 3;
        users.forEach((user, userIndex) => {
          const total = userActivityTotals[activity.CodeActivite].find(
            userTotal => userTotal.userId.toString() === user._id.toString()
          ).total;
          worksheet.getCell(rowIndex, columnIndex).value = total;
          rowTotal += total;
          chercheurTotals[userIndex] += total;
          columnIndex++;
        });

        worksheet.getCell(rowIndex, columnIndex).value = rowTotal;
        worksheet.getCell(rowIndex, columnIndex).font = { bold: true };
        grandTotal += rowTotal;
        rowIndex++;
      });

      worksheet.getCell(rowIndex, 1).value = 'TOTAL';
      worksheet.getCell(rowIndex, 2).value = '';
      worksheet.getCell(rowIndex, 1).font = { bold: true };
      worksheet.getCell(rowIndex, 1).alignment = { horizontal: 'center', vertical: 'middle' };

      for (let col = 1; col <= columnIndex; col++) {
        const cell = worksheet.getCell(rowIndex, col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'fbd38d' }
        };
        cell.font = { bold: true };
      }

      columnIndex = 3;
      chercheurTotals.forEach(total => {
        worksheet.getCell(rowIndex, columnIndex).value = total;
        columnIndex++;
      });

      worksheet.getCell(rowIndex, columnIndex).value = grandTotal;

      worksheet.eachRow(row => {
        row.eachCell(cell => {
          cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Disposition', `attachment; filename=${month}_Activity_Report.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      res.send(buffer);
    } catch (error) {
      res.status(500).send({
        message: `Erreur: ${error.message}`
      });
    }
  },
  exportChercheurYearlyGeneral: async (req, res) => {
    function getColumnLetter(index) {
      let letter = '';
      while (index >= 0) {
        letter = String.fromCharCode(index % 26 + 65) + letter;
        index = Math.floor(index / 26) - 1;
      }
      return letter;
    }

    try {
      const { year, codeCentre } = req.params;

      if (!moment(year, 'YYYY', true).isValid()) {
        return res.status(400).send({
          message: 'Format d\'année invalide. Veuillez utiliser le format YYYY.'
        });
      }

      const startDate = moment(year, 'YYYY').startOf('year').toDate();
      const endDate = moment(year, 'YYYY').endOf('year').toDate();

      let usersQuery = { role: 'chercheur' };
      if (codeCentre) {
        const codeCentres = codeCentre.split(',');
        usersQuery.codeCentre = { $in: codeCentres };
      }

      const users = await User.find(usersQuery);

      if (users.length === 0) {
        return res.status(404).send({ message: 'Aucun chercheur trouvé pour le codeCentre spécifié.' });
      }

      const activityLogs = await ActivityLog.find({
        day: { $gte: startDate, $lte: endDate },
        user_id: { $in: users.map(user => user._id) }
      });

      const activityIds = [...new Set(activityLogs.map(log => log.activite_id))];
      const activities = await Activite.find({ _id: { $in: activityIds } });

      const userActivityTotals = {};
      activities.forEach(activity => {
        userActivityTotals[activity.CodeActivite] = users.map(user => ({
          userId: user._id,
          total: 0
        }));
      });

      activityLogs.forEach(log => {
        const activity = activities.find(a => a._id.toString() === log.activite_id.toString());
        if (activity) {
          const userTotal = userActivityTotals[activity.CodeActivite].find(
            ut => ut.userId.toString() === log.user_id.toString()
          );
          if (userTotal) {
            userTotal.total += log.value;
          }
        }
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Activity Report');

      worksheet.mergeCells('A1:B1');
      let title = `Recap Generale de l'Année : ${year}`;
      if (codeCentre) {
        title += ` pour centres : ${codeCentre}`;
      }

      worksheet.getCell('A1').value = title;
      worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('A1').font = { bold: true, size: 14 };
      worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'bee3f8' }
      };

      worksheet.mergeCells('A2:A4');
      worksheet.getCell('A2').value = 'Code';
      worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('A2').font = { bold: true };
      worksheet.getCell('A2').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '81e6d9' }
      };

      worksheet.mergeCells('B2:B4');
      worksheet.getCell('B2').value = 'Activite';
      worksheet.getCell('B2').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('B2').font = { bold: true };
      worksheet.getCell('B2').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '81e6d9' }
      };

      worksheet.getColumn('A').width = 25;
      worksheet.getColumn('B').width = 25;

      let columnIndex = 3;
      users.forEach(user => {
        const colLetter = getColumnLetter(64 + columnIndex);
        worksheet.getColumn(colLetter).width = 25;

        worksheet.getCell(2, columnIndex).value = user.fullName;
        worksheet.getCell(2, columnIndex).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(2, columnIndex).font = { bold: true };
        worksheet.getCell(2, columnIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '81e6d9' } };

        worksheet.getCell(3, columnIndex).value = user.codeCentre || 'N/A';
        worksheet.getCell(3, columnIndex).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getCell(4, columnIndex).value = user.code || 'N/A';
        worksheet.getCell(4, columnIndex).alignment = { horizontal: 'center', vertical: 'middle' };

        columnIndex++;
      });

      const totalColumnLetter = getColumnLetter(64 + columnIndex);
      worksheet.getColumn(totalColumnLetter).width = 25;

      worksheet.mergeCells(`${totalColumnLetter}2:${totalColumnLetter}4`);
      worksheet.getCell(2, columnIndex).value = 'TOTAL';
      worksheet.getCell(2, columnIndex).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(2, columnIndex).font = { bold: true };
      worksheet.getCell(2, columnIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'fbd38d' } };

      let rowIndex = 5;
      const chercheurTotals = new Array(users.length).fill(0);
      let grandTotal = 0;

      activities.forEach(activity => {
        let rowTotal = 0;
        worksheet.getCell(rowIndex, 1).value = activity.CodeActivite;
        worksheet.getCell(rowIndex, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'c6f6d5' } };
        worksheet.getCell(rowIndex, 2).value = activity.ACTIVITE;
        worksheet.getCell(rowIndex, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'c6f6d5' } };

        columnIndex = 3;
        users.forEach((user, userIndex) => {
          const total = userActivityTotals[activity.CodeActivite].find(
            userTotal => userTotal.userId.toString() === user._id.toString()
          ).total;
          worksheet.getCell(rowIndex, columnIndex).value = total;
          rowTotal += total;
          chercheurTotals[userIndex] += total;
          columnIndex++;
        });

        worksheet.getCell(rowIndex, columnIndex).value = rowTotal;
        worksheet.getCell(rowIndex, columnIndex).font = { bold: true };
        grandTotal += rowTotal;
        rowIndex++;
      });

      worksheet.getCell(rowIndex, 1).value = 'TOTAL';
      worksheet.getCell(rowIndex, 2).value = '';
      worksheet.getCell(rowIndex, 1).font = { bold: true };
      worksheet.getCell(rowIndex, 1).alignment = { horizontal: 'center', vertical: 'middle' };

      for (let col = 1; col <= columnIndex; col++) {
        const cell = worksheet.getCell(rowIndex, col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'fbd38d' }
        };
        cell.font = { bold: true };
      }

      columnIndex = 3;
      chercheurTotals.forEach(total => {
        worksheet.getCell(rowIndex, columnIndex).value = total;
        columnIndex++;
      });

      worksheet.getCell(rowIndex, columnIndex).value = grandTotal;

      worksheet.eachRow(row => {
        row.eachCell(cell => {
          cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Disposition', `attachment; filename=${year}_Activity_Report.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      res.send(buffer);
    } catch (error) {
      res.status(500).send({
        message: `Erreur: ${error.message}`
      });
    }
  },

};

module.exports = ExportController;

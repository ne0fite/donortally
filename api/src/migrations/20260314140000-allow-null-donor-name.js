'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.changeColumn('donor', 'firstName', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn('donor', 'lastName', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.changeColumn('donor', 'firstName', {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('donor', 'lastName', {
      type: DataTypes.STRING,
      allowNull: false,
    });
  },
};

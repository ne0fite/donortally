'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user', 'inviteToken', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('user', 'inviteTokenExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.changeColumn('user', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user', 'inviteToken');
    await queryInterface.removeColumn('user', 'inviteTokenExpiresAt');
    await queryInterface.changeColumn('user', 'password', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};

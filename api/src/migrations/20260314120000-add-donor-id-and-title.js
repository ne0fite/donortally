'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('donor', 'donorId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('donor', 'title', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addIndex('donor', ['donorId', 'organizationId'], {
      unique: true,
      name: 'donor_donor_id_organization_id_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('donor', 'donor_donor_id_organization_id_unique');
    await queryInterface.removeColumn('donor', 'donorId');
    await queryInterface.removeColumn('donor', 'title');
  },
};

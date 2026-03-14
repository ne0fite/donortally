'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('donation', 'donationId', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('donation', 'paymentType', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('donation', 'gift', { type: Sequelize.TEXT, allowNull: true });

    await queryInterface.sequelize.query(`
      UPDATE donation SET "donationId" = 'DN-' || SUBSTRING(id::text, 1, 8)
      WHERE "donationId" IS NULL
    `);

    await queryInterface.changeColumn('donation', 'donationId', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addIndex('donation', ['donationId', 'organizationId'], {
      unique: true,
      name: 'donation_donation_id_organization_id_unique',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex('donation', 'donation_donation_id_organization_id_unique');
    await queryInterface.removeColumn('donation', 'donationId');
    await queryInterface.removeColumn('donation', 'paymentType');
    await queryInterface.removeColumn('donation', 'gift');
  },
};

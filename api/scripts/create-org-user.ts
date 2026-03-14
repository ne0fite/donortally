import 'reflect-metadata';
import * as readline from 'readline';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import { Organization } from '../src/models/organization.model';
import { User } from '../src/models/user.model';
import { Donor } from '../src/models/donor.model';
import { DonorContact } from '../src/models/donor-contact.model';
import { Campaign } from '../src/models/campaign.model';
import { Group } from '../src/models/group.model';
import { Donation } from '../src/models/donation.model';

dotenv.config();

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function generatePassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from(crypto.randomBytes(length))
    .map((b) => chars[b % chars.length])
    .join('');
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const orgName   = await prompt(rl, 'Organization name: ');
  const email     = await prompt(rl, 'User email:        ');
  const firstName = await prompt(rl, 'First name:        ');
  const lastName  = await prompt(rl, 'Last name:         ');

  rl.close();

  if (!orgName || !email || !firstName || !lastName) {
    console.error('All fields are required.');
    process.exit(1);
  }

  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    models: [Organization, User, Donor, DonorContact, Campaign, Group, Donation],
    logging: false,
  });

  await sequelize.authenticate();

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  let slug = slugify(orgName);

  // Ensure slug uniqueness by appending a suffix if needed
  const existing = await Organization.findOne({ where: { slug } });
  if (existing) {
    slug = `${slug}-${crypto.randomBytes(3).toString('hex')}`;
  }

  const org = await Organization.create({ name: orgName, slug, isActive: true });

  await User.create({
    email,
    password: passwordHash,
    firstName,
    lastName,
    isSuperAdmin: false,
    isActive: true,
    organizationId: org.id,
  });

  await sequelize.close();

  console.log('\n✓ Organization and user created successfully.\n');
  console.log(`  Organization : ${org.name}`);
  console.log(`  Slug         : ${org.slug}`);
  console.log(`  Email        : ${email}`);
  console.log(`  Password     : ${password}`);
  console.log('\n  Store the password now — it will not be shown again.\n');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});

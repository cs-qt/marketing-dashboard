import mongoose from 'mongoose';
import { User } from '../models';
import { UserRole, AuthMethod } from '@expertmri/shared';
import { env } from '../config/env';

async function seedUsers() {
  try {
    await mongoose.connect(env.mongodb.uri);
    console.log('Connected to MongoDB');

    const adminEmail = process.argv[2] || 'admin@expertmri.com';
    const adminName = process.argv[3] || 'Admin';

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log(`Admin user already exists: ${adminEmail} (role: ${existing.role})`);
      if (existing.role !== UserRole.ADMIN) {
        existing.role = UserRole.ADMIN;
        await existing.save();
        console.log(`Updated role to admin`);
      }
    } else {
      await User.create({
        email: adminEmail,
        name: adminName,
        role: UserRole.ADMIN,
        authMethod: AuthMethod.GOOGLE,
      });
      console.log(`✅ Admin user created: ${adminEmail}`);
    }

    console.log('\nAll users:');
    const users = await User.find().select('email name role authMethod isActive');
    users.forEach((u) => {
      console.log(`  ${u.email} | ${u.role} | ${u.authMethod} | active: ${u.isActive}`);
    });

    await mongoose.disconnect();
    console.log('\nDone');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedUsers();

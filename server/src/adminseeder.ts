import { envConfig } from "./config/config";
import User from "./database/models/userModel";
import bcrypt from 'bcrypt';

const adminSeeder = async () => {
    const [existingAdmin] = await User.findAll({ where: { role: 'admin' } });
    if (existingAdmin) {
        console.log('Admin already seeded.');
        return;
    }

    await User.create({
        username : envConfig.adminUsername,
        email : envConfig.adminEmail,
        password : await bcrypt.hash(envConfig.adminPassword as string, 10),
        role : 'admin'
    })

    console.log('Admin seeded successfully.');
}     

export default adminSeeder
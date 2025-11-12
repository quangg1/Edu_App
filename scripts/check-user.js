/**
 * Script để kiểm tra user trong MongoDB
 * Chạy: node scripts/check-user.js <email hoặc firebaseUID>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${process.env.MONGODB_URI}`);
    console.log(`📊 Database name: ${mongoose.connection.db.databaseName}\n`);

    // Lấy argument từ command line
    const searchTerm = process.argv[2];
    
    if (!searchTerm) {
      console.log('Usage: node scripts/check-user.js <email hoặc firebaseUID>');
      console.log('Example: node scripts/check-user.js nmpquang123@gmail.com');
      console.log('Example: node scripts/check-user.js FIEA9OifwwV3sJ9efzJhNam0v402\n');
      
      // List all users
      const allUsers = await User.find({}).select('email fullName firebaseUID authProvider createdAt').limit(10);
      console.log(`📋 Found ${allUsers.length} users (showing first 10):`);
      allUsers.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email} - ${u.fullName} - FirebaseUID: ${u.firebaseUID || 'N/A'}`);
      });
      process.exit(0);
    }

    // Tìm user
    let user = null;
    
    // Thử tìm theo email
    user = await User.findOne({ email: searchTerm.toLowerCase() });
    if (user) {
      console.log('✅ Found user by email:');
    } else {
      // Thử tìm theo firebaseUID
      user = await User.findOne({ firebaseUID: searchTerm });
      if (user) {
        console.log('✅ Found user by firebaseUID:');
      }
    }

    if (user) {
      console.log('\n📋 User Details:');
      console.log(JSON.stringify(user.toObject(), null, 2));
      
      // Kiểm tra collection
      const collection = mongoose.connection.db.collection('users');
      const count = await collection.countDocuments({ _id: user._id });
      console.log(`\n📊 User exists in 'users' collection: ${count > 0 ? '✅ YES' : '❌ NO'}`);
      
      // List all collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`\n📚 Available collections: ${collections.map(c => c.name).join(', ')}`);
    } else {
      console.log(`❌ User not found with: ${searchTerm}`);
      console.log('\n🔍 Searching similar...');
      
      // Tìm tương tự
      const similar = await User.find({
        $or: [
          { email: { $regex: searchTerm, $options: 'i' } },
          { fullName: { $regex: searchTerm, $options: 'i' } }
        ]
      }).limit(5);
      
      if (similar.length > 0) {
        console.log(`Found ${similar.length} similar users:`);
        similar.forEach((u, i) => {
          console.log(`  ${i + 1}. ${u.email} - ${u.fullName}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUser();


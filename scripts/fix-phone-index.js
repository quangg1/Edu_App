/**
 * Script để sửa index phone trong MongoDB
 * Chạy: node scripts/fix-phone-index.js
 * 
 * Script này sẽ:
 * 1. Xóa index phone_1 cũ (nếu có)
 * 2. Tạo lại index với sparse: true để cho phép nhiều null values
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function fixPhoneIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // 1. Xóa index cũ nếu có
    try {
      const indexes = await collection.indexes();
      const phoneIndex = indexes.find(idx => idx.name === 'phone_1');
      
      if (phoneIndex) {
        console.log('📋 Found existing phone index:', phoneIndex);
        await collection.dropIndex('phone_1');
        console.log('✅ Dropped old phone_1 index');
      } else {
        console.log('ℹ️ No existing phone_1 index found');
      }
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ Index phone_1 does not exist');
      } else {
        throw error;
      }
    }

    // 2. Tạo lại index với sparse: true
    await collection.createIndex(
      { phone: 1 },
      { 
        unique: true, 
        sparse: true,
        name: 'phone_1'
      }
    );
    console.log('✅ Created new phone index with sparse: true');

    // 3. Verify index
    const newIndexes = await collection.indexes();
    const newPhoneIndex = newIndexes.find(idx => idx.name === 'phone_1');
    console.log('📋 New phone index:', JSON.stringify(newPhoneIndex, null, 2));

    console.log('\n✨ Done! Phone index has been fixed.');
    console.log('   Now multiple users can have phone: null without duplicate key error.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixPhoneIndex();


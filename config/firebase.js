const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Đảm bảo dotenv đã được load (nếu chưa có)
if (!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY && !process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  } catch (e) {
    // Ignore nếu dotenv không có hoặc đã được load
  }
}

// Khởi tạo Firebase Admin SDK
// Có thể dùng service account key hoặc environment variables
let firebaseApp;

try {
  // Debug: Kiểm tra các biến môi trường (chỉ khi cần debug)
  // Uncomment để debug:
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('🔍 Debug Firebase config:');
  //   console.log('   FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Có' : '❌ Không có');
  //   console.log('   FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? `✅ Có (${process.env.FIREBASE_PRIVATE_KEY.length} ký tự)` : '❌ Không có');
  //   console.log('   FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL || '❌ Không có');
  //   console.log('   FIREBASE_SERVICE_ACCOUNT_KEY:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '✅ Có' : '❌ Không có');
  //   console.log('   FIREBASE_SERVICE_ACCOUNT_PATH:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '❌ Không có');
  // }
  // Option 1: Sử dụng file service account (ưu tiên nhất - dễ nhất và an toàn nhất)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      // Resolve đường dẫn tuyệt đối từ thư mục config
      let configPath = path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH.replace(/^\.\//, ''));
      
      // Kiểm tra file có tồn tại không
      if (!fs.existsSync(configPath)) {
        // Thử đường dẫn tương đối từ root của project
        configPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH.replace(/^\.\//, ''));
      }
      
      if (fs.existsSync(configPath)) {
        // Đọc file JSON bằng fs thay vì require để xử lý lỗi tốt hơn
        const fileContent = fs.readFileSync(configPath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
        console.log('✅ Firebase Admin đã được khởi tạo từ file:', configPath);
      } else {
        console.warn(`⚠️ File không tồn tại tại các đường dẫn sau:`);
        console.warn(`   1. ${path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH.replace(/^\.\//, ''))}`);
        console.warn(`   2. ${path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH.replace(/^\.\//, ''))}`);
        console.warn(`   Giá trị FIREBASE_SERVICE_ACCOUNT_PATH: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`);
      }
    } catch (fileError) {
      console.error('❌ Lỗi đọc file service account:', fileError.message);
      console.error('   Đường dẫn:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fileError.stack) {
        console.error('   Stack:', fileError.stack);
      }
    }
  }
  // Option 2: Sử dụng service account key (JSON string từ .env)
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log('✅ Firebase Admin đã được khởi tạo từ FIREBASE_SERVICE_ACCOUNT_KEY');
    } catch (parseError) {
      console.error('❌ Lỗi parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message);
    }
  }
  // Option 3: Sử dụng default credentials (cho production trên GCP)
  else if (process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_PRIVATE_KEY) {
    try {
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('✅ Firebase Admin đã được khởi tạo với default credentials');
    } catch (error) {
      console.error('❌ Lỗi khởi tạo với default credentials:', error.message);
    }
  }
  // Option 4: Sử dụng environment variables riêng lẻ
  else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      // Xử lý private key: loại bỏ dấu ngoặc kép và chuyển \n thành newline thực sự
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // Loại bỏ dấu ngoặc kép nếu có
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }
      
      // Chuyển đổi \n thành newline thực sự
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
      });
      console.log('✅ Firebase Admin đã được khởi tạo từ environment variables');
    } catch (error) {
      console.error('❌ Lỗi khởi tạo từ env vars:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
    }
  }
  
  // Kiểm tra xem đã khởi tạo thành công chưa
  if (!firebaseApp) {
    console.warn('⚠️ Firebase Admin chưa được cấu hình.');
    console.warn('   Vui lòng thiết lập một trong các options sau:');
    console.warn('   1. FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)');
    console.warn('   2. FIREBASE_SERVICE_ACCOUNT_PATH (đường dẫn đến file JSON)');
    console.warn('   3. FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL');
  }
} catch (error) {
  console.error('❌ Lỗi khởi tạo Firebase Admin:', error.message);
  console.warn('⚠️ Firebase Authentication sẽ không hoạt động. Vui lòng kiểm tra cấu hình.');
}

// Verify Firebase ID Token
exports.verifyIdToken = async (idToken) => {
  if (!firebaseApp) {
    throw new Error('Firebase Admin chưa được khởi tạo');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('❌ Lỗi verify Firebase token:', error.message);
    throw error;
  }
};

// Get user by Firebase UID
exports.getUserByUID = async (uid) => {
  if (!firebaseApp) {
    throw new Error('Firebase Admin chưa được khởi tạo');
  }

  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('❌ Lỗi lấy user từ Firebase:', error.message);
    throw error;
  }
};

module.exports = {
  admin,
  verifyIdToken: exports.verifyIdToken,
  getUserByUID: exports.getUserByUID
};


const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/setAdminClaim.cjs user@example.com');
  process.exit(1);
}

admin.auth().getUserByEmail(email)
  .then(user => {
    return admin.auth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log(`✅ ${email} is now an admin.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error setting admin claim:', err);
    process.exit(1);
  }); 
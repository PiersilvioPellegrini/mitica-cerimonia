/* eslint-disable */
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeFields() {
    const collectionRef = db.collection('products');
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
        console.log('No matching documents.');
        return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
        const docRef = collectionRef.doc(doc.id);
        batch.update(docRef, {
            site_link: admin.firestore.FieldValue.delete(),
            image_link: admin.firestore.FieldValue.delete()
        });
        count++;
    });

    await batch.commit();
    console.log(`Successfully updated ${count} documents.`);
}

removeFields().catch(console.error);

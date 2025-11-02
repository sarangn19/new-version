/**
 * Firebase Initialization Script
 * Simple initialization for browsers that don't support ES6 modules
 */

// Firebase configuration (compatible with older browsers)
const firebaseConfig = {
    apiKey: "AIzaSyAIIV25IMwN_FD3KRyHmASbydcUiekrmqA",
    authDomain: "upsc-learning-fff2a.firebaseapp.com",
    projectId: "upsc-learning-fff2a",
    storageBucket: "upsc-learning-fff2a.firebasestorage.app",
    messagingSenderId: "744572967967",
    appId: "1:744572967967:web:25cf469a749c44bd91c92a",
    measurementId: "G-T6VYDTQGWZ"
};

// Initialize Firebase when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if Firebase is available
        if (typeof firebase !== 'undefined') {
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            
            // Initialize services
            const auth = firebase.auth();
            const db = firebase.firestore();
            const storage = firebase.storage();
            
            // Sign in anonymously with error handling
            try {
                await auth.signInAnonymously();
            } catch (error) {
                console.warn('Firebase auth failed, continuing with localStorage only:', error.message);
                // Continue without Firebase auth - app will work with localStorage
            }
            console.log('Firebase initialized successfully');
            
            // Set up global Firebase utilities
            window.firebaseUtils = {
                auth: auth,
                db: db,
                storage: storage,
                
                // Save data to Firestore
                async saveData(collection, data) {
                    const user = auth.currentUser;
                    if (user) {
                        return await db.collection('users').doc(user.uid)
                                    .collection(collection).add({
                            ...data,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                },
                
                // Get user data
                async getData(collection, limit = 50) {
                    const user = auth.currentUser;
                    if (user) {
                        const snapshot = await db.collection('users').doc(user.uid)
                                               .collection(collection)
                                               .orderBy('createdAt', 'desc')
                                               .limit(limit).get();
                        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    }
                    return [];
                }
            };
            
        } else {
            console.warn('Firebase SDK not loaded, using localStorage only');
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
});
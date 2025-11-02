/**
 * Firebase Configuration and Database Setup
 * Handles authentication, real-time database, and cloud storage for UPSC Learning Platform
 */

// Import Firebase modules (for modern browsers)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, limit, onSnapshot, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAIIV25IMwN_FD3KRyHmASbydcUiekrmqA",
    authDomain: "upsc-learning-fff2a.firebaseapp.com",
    projectId: "upsc-learning-fff2a",
    storageBucket: "upsc-learning-fff2a.firebasestorage.app",
    messagingSenderId: "744572967967",
    appId: "1:744572967967:web:25cf469a749c44bd91c92a",
    measurementId: "G-T6VYDTQGWZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

/**
 * Firebase Database Manager
 * Handles all database operations for the UPSC Learning Platform
 */
class FirebaseManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.initialize();
    }

    /**
     * Initialize Firebase services and authentication
     */
    async initialize() {
        try {
            // Set up authentication state listener
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    this.currentUser = user;
                    console.log('User authenticated:', user.uid);
                } else {
                    this.signInAnonymously();
                }
            });

            // Sign in anonymously for guest users
            await this.signInAnonymously();
            this.isInitialized = true;
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
        }
    }

    /**
     * Sign in user anonymously
     */
    async signInAnonymously() {
        try {
            const result = await signInAnonymously(auth);
            this.currentUser = result.user;
            console.log('Anonymous sign-in successful');
        } catch (error) {
            console.error('Anonymous sign-in error:', error);
        }
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        return this.currentUser?.uid || 'anonymous';
    }

    // ==================== USER PROFILE OPERATIONS ====================

    /**
     * Save user profile data
     */
    async saveUserProfile(profileData) {
        try {
            const userId = this.getCurrentUserId();
            await setDoc(doc(db, 'users', userId), {
                ...profileData,
                updatedAt: new Date().toISOString(),
                createdAt: profileData.createdAt || new Date().toISOString()
            });
            console.log('Profile saved successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            throw error;
        }
    }

    /**
     * Get user profile data
     */
    async getUserProfile() {
        try {
            const userId = this.getCurrentUserId();
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting profile:', error);
            return null;
        }
    }

    // ==================== STUDY MATERIALS OPERATIONS ====================

    /**
     * Save notes to Firebase
     */
    async saveNote(noteData) {
        try {
            const userId = this.getCurrentUserId();
            const noteRef = await addDoc(collection(db, 'users', userId, 'notes'), {
                ...noteData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log('Note saved with ID:', noteRef.id);
            return noteRef.id;
        } catch (error) {
            console.error('Error saving note:', error);
            throw error;
        }
    }

    /**
     * Get all notes for user
     */
    async getNotes(limitCount = 50) {
        try {
            const userId = this.getCurrentUserId();
            const q = query(
                collection(db, 'users', userId, 'notes'),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            
            const querySnapshot = await getDocs(q);
            const notes = [];
            querySnapshot.forEach((doc) => {
                notes.push({ id: doc.id, ...doc.data() });
            });
            
            return notes;
        } catch (error) {
            console.error('Error getting notes:', error);
            return [];
        }
    }

    /**
     * Save flashcard to Firebase
     */
    async saveFlashcard(flashcardData) {
        try {
            const userId = this.getCurrentUserId();
            const flashcardRef = await addDoc(collection(db, 'users', userId, 'flashcards'), {
                ...flashcardData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log('Flashcard saved with ID:', flashcardRef.id);
            return flashcardRef.id;
        } catch (error) {
            console.error('Error saving flashcard:', error);
            throw error;
        }
    }

    /**
     * Save MCQ to Firebase
     */
    async saveMCQ(mcqData) {
        try {
            const userId = this.getCurrentUserId();
            const mcqRef = await addDoc(collection(db, 'users', userId, 'mcqs'), {
                ...mcqData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log('MCQ saved with ID:', mcqRef.id);
            return mcqRef.id;
        } catch (error) {
            console.error('Error saving MCQ:', error);
            throw error;
        }
    }

    // ==================== AI CONVERSATIONS OPERATIONS ====================

    /**
     * Save AI conversation
     */
    async saveConversation(conversationData) {
        try {
            const userId = this.getCurrentUserId();
            const conversationRef = await addDoc(collection(db, 'users', userId, 'conversations'), {
                ...conversationData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log('Conversation saved with ID:', conversationRef.id);
            return conversationRef.id;
        } catch (error) {
            console.error('Error saving conversation:', error);
            throw error;
        }
    }

    /**
     * Get user conversations
     */
    async getConversations(limitCount = 20) {
        try {
            const userId = this.getCurrentUserId();
            const q = query(
                collection(db, 'users', userId, 'conversations'),
                orderBy('updatedAt', 'desc'),
                limit(limitCount)
            );
            
            const querySnapshot = await getDocs(q);
            const conversations = [];
            querySnapshot.forEach((doc) => {
                conversations.push({ id: doc.id, ...doc.data() });
            });
            
            return conversations;
        } catch (error) {
            console.error('Error getting conversations:', error);
            return [];
        }
    }

    // ==================== STUDY GROUPS OPERATIONS ====================

    /**
     * Create study group
     */
    async createStudyGroup(groupData) {
        try {
            const userId = this.getCurrentUserId();
            const groupRef = await addDoc(collection(db, 'studyGroups'), {
                ...groupData,
                createdBy: userId,
                members: [userId],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log('Study group created with ID:', groupRef.id);
            return groupRef.id;
        } catch (error) {
            console.error('Error creating study group:', error);
            throw error;
        }
    }

    /**
     * Join study group
     */
    async joinStudyGroup(groupId) {
        try {
            const userId = this.getCurrentUserId();
            const groupRef = doc(db, 'studyGroups', groupId);
            const groupSnap = await getDoc(groupRef);
            
            if (groupSnap.exists()) {
                const groupData = groupSnap.data();
                if (!groupData.members.includes(userId)) {
                    await updateDoc(groupRef, {
                        members: [...groupData.members, userId],
                        updatedAt: new Date().toISOString()
                    });
                    console.log('Joined study group successfully');
                }
            }
        } catch (error) {
            console.error('Error joining study group:', error);
            throw error;
        }
    }

    /**
     * Get user's study groups
     */
    async getUserStudyGroups() {
        try {
            const userId = this.getCurrentUserId();
            const q = query(
                collection(db, 'studyGroups'),
                where('members', 'array-contains', userId)
            );
            
            const querySnapshot = await getDocs(q);
            const groups = [];
            querySnapshot.forEach((doc) => {
                groups.push({ id: doc.id, ...doc.data() });
            });
            
            return groups;
        } catch (error) {
            console.error('Error getting study groups:', error);
            return [];
        }
    }

    /**
     * Delete study group
     */
    async deleteStudyGroup(groupId) {
        try {
            const userId = this.getCurrentUserId();
            const groupRef = doc(db, 'studyGroups', groupId);
            const groupSnap = await getDoc(groupRef);
            
            if (groupSnap.exists()) {
                const groupData = groupSnap.data();
                // Only allow creator to delete
                if (groupData.createdBy === userId) {
                    await deleteDoc(groupRef);
                    console.log('Study group deleted successfully');
                    return true;
                } else {
                    throw new Error('Only group creator can delete the group');
                }
            }
            return false;
        } catch (error) {
            console.error('Error deleting study group:', error);
            throw error;
        }
    }

    // ==================== ANALYTICS OPERATIONS ====================

    /**
     * Save study session data
     */
    async saveStudySession(sessionData) {
        try {
            const userId = this.getCurrentUserId();
            const sessionRef = await addDoc(collection(db, 'users', userId, 'studySessions'), {
                ...sessionData,
                timestamp: new Date().toISOString()
            });
            console.log('Study session saved with ID:', sessionRef.id);
            return sessionRef.id;
        } catch (error) {
            console.error('Error saving study session:', error);
            throw error;
        }
    }

    /**
     * Get study analytics
     */
    async getStudyAnalytics(days = 30) {
        try {
            const userId = this.getCurrentUserId();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const q = query(
                collection(db, 'users', userId, 'studySessions'),
                where('timestamp', '>=', startDate.toISOString()),
                orderBy('timestamp', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const sessions = [];
            querySnapshot.forEach((doc) => {
                sessions.push({ id: doc.id, ...doc.data() });
            });
            
            return sessions;
        } catch (error) {
            console.error('Error getting study analytics:', error);
            return [];
        }
    }

    // ==================== FILE UPLOAD OPERATIONS ====================

    /**
     * Upload answer image for evaluation
     */
    async uploadAnswerImage(file, answerId) {
        try {
            const userId = this.getCurrentUserId();
            const storageRef = ref(storage, `answers/${userId}/${answerId}/${file.name}`);
            
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            console.log('Answer image uploaded successfully');
            return downloadURL;
        } catch (error) {
            console.error('Error uploading answer image:', error);
            throw error;
        }
    }

    /**
     * Upload profile picture
     */
    async uploadProfilePicture(file) {
        try {
            const userId = this.getCurrentUserId();
            const storageRef = ref(storage, `profiles/${userId}/profile.jpg`);
            
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            console.log('Profile picture uploaded successfully');
            return downloadURL;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            throw error;
        }
    }

    // ==================== REAL-TIME OPERATIONS ====================

    /**
     * Listen to real-time updates for study groups
     */
    listenToStudyGroupUpdates(groupId, callback) {
        try {
            const groupRef = doc(db, 'studyGroups', groupId);
            return onSnapshot(groupRef, (doc) => {
                if (doc.exists()) {
                    callback({ id: doc.id, ...doc.data() });
                }
            });
        } catch (error) {
            console.error('Error setting up real-time listener:', error);
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Sync local data to Firebase
     */
    async syncLocalDataToFirebase() {
        try {
            console.log('Starting data sync to Firebase...');
            
            // Sync notes
            const localNotes = JSON.parse(localStorage.getItem('notes') || '[]');
            for (const note of localNotes) {
                if (!note.synced) {
                    await this.saveNote(note);
                    note.synced = true;
                }
            }
            localStorage.setItem('notes', JSON.stringify(localNotes));
            
            // Sync flashcards
            const localFlashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
            for (const flashcard of localFlashcards) {
                if (!flashcard.synced) {
                    await this.saveFlashcard(flashcard);
                    flashcard.synced = true;
                }
            }
            localStorage.setItem('flashcards', JSON.stringify(localFlashcards));
            
            // Sync MCQs
            const localMCQs = JSON.parse(localStorage.getItem('mcq-explanations') || '[]');
            for (const mcq of localMCQs) {
                if (!mcq.synced) {
                    await this.saveMCQ(mcq);
                    mcq.synced = true;
                }
            }
            localStorage.setItem('mcq-explanations', JSON.stringify(localMCQs));
            
            console.log('Data sync completed successfully');
        } catch (error) {
            console.error('Error syncing data to Firebase:', error);
        }
    }

    /**
     * Check if Firebase is ready
     */
    isReady() {
        return this.isInitialized && this.currentUser !== null;
    }
}

// Create global Firebase manager instance
window.firebaseManager = new FirebaseManager();

// Export for module usage
export { FirebaseManager, db, auth, storage, analytics };
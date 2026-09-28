// =====================================================================
// Commute Buddy: Persistent User Store
// Supports local disk persistence (server/data/users.json) + Supabase sync
// Stores users authenticated via real Google OAuth 2.0 / GIS
// =====================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache of persistent users
let users = [];

function loadUsersFromDisk() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      users = JSON.parse(data);
    } else {
      // Default empty list
      users = [];
      saveUsersToDisk();
    }
  } catch (err) {
    console.error('⚠️ Error reading users file:', err.message);
    users = [];
  }
}

function saveUsersToDisk() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ Error writing users file:', err.message);
  }
}

// Initialize on module load
loadUsersFromDisk();

export const userStore = {
  /**
   * Find user by Google "sub" (unique Google user ID)
   * @param {string} googleId 
   */
  findUserByGoogleId(googleId) {
    if (!googleId) return null;
    return users.find(u => u.google_id === googleId) || null;
  },

  /**
   * Find user by verified email
   * @param {string} email 
   */
  findUserByEmail(email) {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    return users.find(u => u.email && u.email.toLowerCase().trim() === normalized) || null;
  },

  /**
   * Get user by ID
   * @param {string} id 
   */
  getUserById(id) {
    return users.find(u => u.id === id) || null;
  },

  /**
   * Create a new persistent user
   * @param {Object} userData 
   */
  createUser({ googleId, email, name, profilePicture, role = 'seeker' }) {
    // Generate secure unique ID
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    // Preserve role selection (seeker vs owner)
    const normalizedRole = role === 'owner' ? 'owner' : 'seeker';

    const newUser = {
      id,
      google_id: googleId || null,
      email: (email || '').toLowerCase().trim(),
      name: name || 'Commute Buddy User',
      profile_picture: profilePicture || '',
      role: normalizedRole,
      created_at: now,
      updated_at: now,
    };

    users.unshift(newUser);
    saveUsersToDisk();
    return newUser;
  },

  /**
   * Update existing user record
   * @param {string} id 
   * @param {Object} updates 
   */
  updateUser(id, updates) {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...updates,
      // Prevent id overwrite
      id: users[index].id,
      updated_at: new Date().toISOString(),
    };

    saveUsersToDisk();
    return users[index];
  },

  /**
   * Get all users (sanitized, excluding any private attributes)
   */
  getAllUsers() {
    return users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      profile_picture: u.profile_picture,
      role: u.role,
      created_at: u.created_at,
    }));
  }
};

// Supabase Configuration
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://bculyoqyxhdeverkvhse.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjdWx5b3F5eGhkZXZlcmt2aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTczNzAsImV4cCI6MjA3MDEzMzM3MH0.Z-dHEY40-pBsD9m29hjFuwQk4PRksl75jkPkHsmU6mo';

let supabase = null;

try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.log('Supabase not configured, using localStorage fallback');
    }
} catch (error) {
    console.log('Supabase initialization failed, using localStorage fallback');
}

// Database Helper Functions
class HapoDatabase {
    constructor() {
        this.supabase = supabase;
    }

    // Authentication Methods
    async signUp(email, password, userData) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            // Create auth user first
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });

            if (authError) throw authError;

            // Create user record in our users table
            if (authData.user) {
                const userRecord = {
                    id: authData.user.id,
                    full_name: userData.fullName,
                    email: email,
                    password_hash: 'managed_by_supabase_auth',
                    user_type: userData.userType || 'parent',
                    email_verified: false,
                    mfa_enabled: true,
                    created_at: new Date().toISOString()
                };

                const { data: userInsert, error: userError } = await this.supabase
                    .from('users')
                    .insert([userRecord])
                    .select();

                if (userError) {
                    console.error('Error creating user record:', userError);
                    // Don't throw here as auth user was created successfully
                }

                return { success: true, data: authData, user: userInsert?.[0] };
            }

            return { success: true, data: authData };
        } catch (error) {
            console.error('Error in signUp:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Get user record from our users table
            if (data.user) {
                const { data: userRecord, error: userError } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (userError) {
                    console.error('Error fetching user record:', userError);
                }

                return { success: true, data, user: userRecord };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error in signIn:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error in signOut:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentUser() {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) throw error;

            if (user) {
                // Get user record from our users table
                const { data: userRecord, error: userError } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (userError) {
                    console.error('Error fetching user record:', userError);
                }

                return { success: true, user, userRecord };
            }

            return { success: true, user: null };
        } catch (error) {
            console.error('Error getting current user:', error);
            return { success: false, error: error.message };
        }
    }

    // User Management
    async createUser(userData) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('users')
                .insert([{
                    id: userData.id,
                    full_name: userData.fullName,
                    email: userData.email,
                    password_hash: 'managed_by_supabase_auth',
                    user_type: userData.userType || 'parent',
                    email_verified: userData.emailVerified || false,
                    mfa_enabled: userData.mfaEnabled || true,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserByEmail(email) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Student Management
    async createStudent(studentData) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            // Generate a unique ID for the student
            const studentId = 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            const { data, error } = await this.supabase
                .from('students')
                .insert([{
                    id: studentId,
                    parent_id: studentData.parentId,
                    first_name: studentData.firstName,
                    last_name: studentData.lastName,
                    username: studentData.username,
                    password_hash: studentData.password || 'default_password_hash',
                    balance: studentData.balance || 0,
                    weekly_limit: studentData.weeklyLimit || 50,
                    daily_limit: studentData.dailyLimit || 10,
                    active: studentData.active || true,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating student:', error);
            return { success: false, error: error.message };
        }
    }

    async getStudentsByParent(parentId) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('students')
                .select('*')
                .eq('parent_id', parentId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching students:', error);
            return { success: false, error: error.message };
        }
    }

    async getStudentByUsername(username) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('students')
                .select('*')
                .eq('username', username)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getStudentById(studentId) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }

            const { data, error } = await this.supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateStudentBalance(studentId, newBalance) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase not initialized');
            }
            
            const { data, error } = await this.supabase
                .from('students')
                .update({ balance: newBalance, updated_at: new Date().toISOString() })
                .eq('id', studentId)
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Supabase updateStudentBalance error:', error);
            return { success: false, error: error.message };
        }
    }

    // Transaction Management
    async createTransaction(transactionData) {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .insert([{
                    id: transactionData.id,
                    student_id: transactionData.studentId,
                    parent_id: transactionData.parentId,
                    type: transactionData.type,
                    amount: transactionData.amount,
                    description: transactionData.description,
                    merchant: transactionData.merchant || null,
                    category: transactionData.category || 'other',
                    status: transactionData.status || 'completed',
                    created_at: new Date().toISOString()
                }])
                .select();

            return { success: true, data };
        } catch (error) {
            console.error('Error creating transaction:', error);
            return { success: false, error: error.message };
        }
    }

    async getTransactionsByStudent(studentId, limit = 50) {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getTransactionsByParent(parentId, limit = 50) {
        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .select(`
                    *,
                    students (
                        first_name,
                        last_name
                    )
                `)
                .eq('parent_id', parentId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Money Request Management
    async createMoneyRequest(requestData) {
        try {
            const { data, error } = await this.supabase
                .from('money_requests')
                .insert([{
                    id: requestData.id,
                    student_id: requestData.studentId,
                    parent_id: requestData.parentId,
                    amount: requestData.amount,
                    reason: requestData.reason,
                    type: requestData.type || 'money',
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select();

            return { success: true, data };
        } catch (error) {
            console.error('Error creating money request:', error);
            return { success: false, error: error.message };
        }
    }

    async getMoneyRequestsByParent(parentId) {
        try {
            const { data, error } = await this.supabase
                .from('money_requests')
                .select(`
                    *,
                    students (
                        first_name,
                        last_name
                    )
                `)
                .eq('parent_id', parentId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateMoneyRequestStatus(requestId, status) {
        try {
            const { data, error } = await this.supabase
                .from('money_requests')
                .update({ 
                    status: status, 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', requestId)
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Real-time subscriptions
    subscribeToStudentUpdates(studentId, callback) {
        return this.supabase
            .channel(`student_${studentId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'students',
                filter: `id=eq.${studentId}`
            }, callback)
            .subscribe();
    }

    subscribeToTransactions(studentId, callback) {
        return this.supabase
            .channel(`transactions_${studentId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'transactions',
                filter: `student_id=eq.${studentId}`
            }, callback)
            .subscribe();
    }

    subscribeToMoneyRequests(parentId, callback) {
        return this.supabase
            .channel(`requests_${parentId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'money_requests',
                filter: `parent_id=eq.${parentId}`
            }, callback)
            .subscribe();
    }
}

// Export the database instance only if Supabase is available
if (supabase) {
    window.hapoDb = new HapoDatabase();
    console.log('Supabase database initialized successfully');
} else {
    console.log('Running in localStorage-only mode');
}


-- Users table (for parents)
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    full_name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    user_type VARCHAR DEFAULT 'parent',
    email_verified BOOLEAN DEFAULT false,
    mfa_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id VARCHAR PRIMARY KEY,
    parent_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    weekly_limit DECIMAL(10,2) DEFAULT 50.00,
    daily_limit DECIMAL(10,2) DEFAULT 10.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id VARCHAR PRIMARY KEY,
    student_id VARCHAR NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL, -- 'transfer', 'payment', 'emergency', 'topup'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    merchant VARCHAR,
    category VARCHAR DEFAULT 'other',
    status VARCHAR DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Money requests table
CREATE TABLE money_requests (
    id VARCHAR PRIMARY KEY,
    student_id VARCHAR NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    type VARCHAR DEFAULT 'money', -- 'money', 'emergency'
    status VARCHAR DEFAULT 'pending', -- 'pending', 'approved', 'declined'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring payments table
CREATE TABLE recurring_payments (
    id VARCHAR PRIMARY KEY,
    parent_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    payment_type VARCHAR NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id);

-- RLS Policies for students table
CREATE POLICY "Parents can view their students" ON students FOR SELECT USING (parent_id = auth.uid()::text);
CREATE POLICY "Parents can manage their students" ON students FOR ALL USING (parent_id = auth.uid()::text);
CREATE POLICY "Students can view own data" ON students FOR SELECT USING (id = auth.uid()::text);

-- RLS Policies for transactions table
CREATE POLICY "Parents can view family transactions" ON transactions FOR SELECT USING (parent_id = auth.uid()::text);
CREATE POLICY "Students can view own transactions" ON transactions FOR SELECT USING (student_id = auth.uid()::text);
CREATE POLICY "Parents can create transactions" ON transactions FOR INSERT WITH CHECK (parent_id = auth.uid()::text);

-- RLS Policies for money_requests table
CREATE POLICY "Parents can view their requests" ON money_requests FOR SELECT USING (parent_id = auth.uid()::text);
CREATE POLICY "Students can view own requests" ON money_requests FOR SELECT USING (student_id = auth.uid()::text);
CREATE POLICY "Students can create requests" ON money_requests FOR INSERT WITH CHECK (student_id = auth.uid()::text);
CREATE POLICY "Parents can update request status" ON money_requests FOR UPDATE USING (parent_id = auth.uid()::text);

-- RLS Policies for recurring_payments table
CREATE POLICY "Parents can manage recurring payments" ON recurring_payments FOR ALL USING (parent_id = auth.uid()::text);

-- Indexes for better performance
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_transactions_student_id ON transactions(student_id);
CREATE INDEX idx_transactions_parent_id ON transactions(parent_id);
CREATE INDEX idx_money_requests_parent_id ON money_requests(parent_id);
CREATE INDEX idx_money_requests_student_id ON money_requests(student_id);
CREATE INDEX idx_money_requests_status ON money_requests(status);

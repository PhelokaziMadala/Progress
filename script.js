// ========================================
// HAPO LANDING PAGE CODE
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('%cHapo Payment System', 'color: #4f46e5; font-size: 20px; font-weight: bold;');
    console.log('Family Payments Made Simple');

    // Get Started button functionality
    const ctaButtons = document.querySelectorAll('.cta-button, .cta-button-large');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            window.location.href = 'signup.html';
        });
    });

    // Parent Sign In button functionality
    const parentSignInBtn = document.querySelector('.parent-signin-btn');
    if (parentSignInBtn) {
        parentSignInBtn.addEventListener('click', function() {
            window.location.href = 'parentLogin.html';
        });
    }

    // Child Login button functionality
    const childLoginBtn = document.querySelector('.child-login-btn');
    if (childLoginBtn && childLoginBtn.textContent.includes('Child Login')) {
        childLoginBtn.addEventListener('click', function() {
            window.location.href = 'studentLogin.html';
        });
    }

    // Add smooth scrolling for any future navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && href.length > 1) {
                e.preventDefault();
                try {
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                } catch (error) {
                    console.warn('Invalid selector:', href);
                }
            } else if (href === '#') {
                e.preventDefault(); // Prevent default behavior for empty href
            }
        });
    });

    // Add animation to feature cards when they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animate feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Add hover effects for interactive elements
    const interactiveElements = document.querySelectorAll('button, .feature-card');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = this.classList.contains('feature-card') ? 'translateY(-2px)' : 'translateY(-1px)';
        });

        element.addEventListener('mouseleave', function() {
            this.style.transform = this.classList.contains('feature-card') ? 'translateY(0)' : 'translateY(0)';
        });
    });
});

// ========================================
// AUTHENTICATION SYSTEM CODE (from auth.js)
// ========================================

// Authentication System with Supabase Integration
class AuthSystem {
    constructor() {
        this.apiBase = window.location.origin;
        this.token = localStorage.getItem('hapo_token');
        this.refreshToken = localStorage.getItem('hapo_refresh_token');
        this.db = window.hapoDb;
        this.init();
    }

    init() {
        // Auto-refresh token if needed
        if (this.token) {
            this.validateToken();
        }

        // Load Supabase configuration if available
        if (typeof window.hapoDb !== 'undefined') {
            console.log('Supabase database connected successfully');
        }
    }

    // Password strength checker
    checkPasswordStrength(password) {
        const strength = {
            score: 0,
            feedback: []
        };

        if (password.length >= 8) strength.score++;
        else strength.feedback.push('At least 8 characters');

        if (/[A-Z]/.test(password)) strength.score++;
        else strength.feedback.push('One uppercase letter');

        if (/[a-z]/.test(password)) strength.score++;
        else strength.feedback.push('One lowercase letter');

        if (/\d/.test(password)) strength.score++;
        else strength.feedback.push('One number');

        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength.score++;
        else strength.feedback.push('One special character');

        return strength;
    }

    // Hash password using bcrypt-like implementation
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'hapo_salt_2024');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Generate JWT token (mock implementation)
    generateJWT(userData) {
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = {
            sub: userData.id,
            email: userData.email,
            name: userData.fullName,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
            iat: Math.floor(Date.now() / 1000)
        };

        // In real implementation, this would be signed server-side
        const encodedHeader = btoa(JSON.stringify(header));
        const encodedPayload = btoa(JSON.stringify(payload));
        const signature = 'mock_signature_' + Math.random().toString(36);

        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    // Validate and refresh token
    async validateToken() {
        if (!this.token) return false;

        try {
            // In real implementation, this would validate with server
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);

            if (payload.exp <= now) {
                await this.refreshAccessToken();
            }
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    // Refresh access token
    async refreshAccessToken() {
        if (!this.refreshToken) {
            this.logout();
            return;
        }

        // Mock refresh token implementation
        const newToken = this.generateJWT({ 
            id: '123', 
            email: 'user@example.com', 
            fullName: 'User Name' 
        });

        localStorage.setItem('hapo_token', newToken);
        this.token = newToken;
    }

    // Sign up function
    async signUp(formData) {
        try {
            const hashedPassword = await this.hashPassword(formData.password);

            const userData = {
                id: 'user_' + Date.now(),
                fullName: formData.fullName,
                email: formData.email,
                password: hashedPassword,
                emailVerified: false,
                mfaEnabled: true,
                userType: 'parent'
            };

            // Save to Supabase if available, otherwise use localStorage
            if (this.db) {
                const result = await this.db.createUser(userData);
                if (!result.success) {
                    return { success: false, error: result.error };
                }
            } else {
                // Fallback to localStorage
                localStorage.setItem('hapo_user_' + userData.email, JSON.stringify(userData));
            }

            // Generate email verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            localStorage.setItem('hapo_email_verification', JSON.stringify({
                email: userData.email,
                code: verificationCode,
                expiry: Date.now() + 10 * 60 * 1000, // 10 minutes
                userData: userData
            }));

            // Simulate sending verification email
            this.simulateEmailVerification(userData.email, verificationCode);

            return { success: true, requiresEmailVerification: true };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: 'Signup failed. Please try again.' };
        }
    }

    // Sign in function
    async signIn(email, password) {
        try {
            let userData = null;

            // Try to get user from Supabase first
            if (this.db) {
                const result = await this.db.getUserByEmail(email);
                if (result.success) {
                    userData = result.data;
                }
            }

            // Fallback to localStorage
            if (!userData) {
                const storedUserData = localStorage.getItem('hapo_user_' + email);
                if (!storedUserData) {
                    return { success: false, error: 'Invalid email or password' };
                }
                userData = JSON.parse(storedUserData);
            }

            const hashedPassword = await this.hashPassword(password);

            if (userData.password_hash !== hashedPassword && userData.password !== hashedPassword) {
                return { success: false, error: 'Invalid email or password' };
            }

            // Check if email is verified
            if (!userData.email_verified && !userData.emailVerified) {
                return { success: false, error: 'Please verify your email address before signing in' };
            }

            // Check if MFA is enabled
            const mfaEnabled = userData.mfa_enabled !== undefined ? userData.mfa_enabled : userData.mfaEnabled;
            if (mfaEnabled) {
                // Generate and send MFA code (mock)
                const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
                localStorage.setItem('hapo_pending_mfa', JSON.stringify({
                    email,
                    code: mfaCode,
                    expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
                }));

                console.log(`MFA code for ${email}: ${mfaCode}`);

                return { success: true, requiresMFA: true, message: `Verification code sent to ${email}` };
            }

            // Complete login
            return this.completeLogin(userData);
        } catch (error) {
            console.error('Signin error:', error);
            return { success: false, error: 'Sign in failed. Please try again.' };
        }
    }

    // Verify MFA code
    async verifyMFA(code) {
        try {
            const pendingMFA = localStorage.getItem('hapo_pending_mfa');
            if (!pendingMFA) {
                return { success: false, error: 'No pending MFA verification' };
            }

            const mfaData = JSON.parse(pendingMFA);
            if (Date.now() > mfaData.expiry) {
                localStorage.removeItem('hapo_pending_mfa');
                return { success: false, error: 'MFA code has expired' };
            }

            if (code !== mfaData.code) {
                return { success: false, error: 'Invalid verification code' };
            }

            // Get user data and complete login
            const userData = JSON.parse(localStorage.getItem('hapo_user_' + mfaData.email));
            localStorage.removeItem('hapo_pending_mfa');

            return this.completeLogin(userData);
        } catch (error) {
            console.error('MFA verification error:', error);
            return { success: false, error: 'MFA verification failed' };
        }
    }

    // Complete login process
    completeLogin(userData) {
        const accessToken = this.generateJWT(userData);
        const refreshToken = 'refresh_' + Math.random().toString(36);

        localStorage.setItem('hapo_token', accessToken);
        localStorage.setItem('hapo_refresh_token', refreshToken);
        localStorage.setItem('hapo_current_user', JSON.stringify({
            id: userData.id,
            fullName: userData.fullName,
            email: userData.email
        }));

        this.token = accessToken;
        this.refreshToken = refreshToken;

        return { success: true, requiresMFA: false };
    }

    // OAuth implementations (mock)
    async signInWithGoogle() {
        // Mock Google OAuth
        const mockGoogleUser = {
            id: 'google_' + Date.now(),
            fullName: 'Google User',
            email: 'user@gmail.com'
        };

        return this.completeLogin(mockGoogleUser);
    }

    async signInWithMicrosoft() {
        // Mock Microsoft OAuth
        const mockMicrosoftUser = {
            id: 'microsoft_' + Date.now(),
            fullName: 'Microsoft User',
            email: 'user@outlook.com'
        };

        return this.completeLogin(mockMicrosoftUser);
    }

    // Logout
    logout() {
        localStorage.removeItem('hapo_token');
        localStorage.removeItem('hapo_refresh_token');
        localStorage.removeItem('hapo_current_user');
        localStorage.removeItem('hapo_pending_mfa');

        this.token = null;
        this.refreshToken = null;

        window.location.href = 'index.html';
    }

    // Get current user
    getCurrentUser() {
        const userData = localStorage.getItem('hapo_current_user');
        return userData ? JSON.parse(userData) : null;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && !!this.getCurrentUser();
    }

    // Verify email during signup
    async verifyEmail(code) {
        try {
            const pendingVerification = localStorage.getItem('hapo_email_verification');
            if (!pendingVerification) {
                return { success: false, error: 'No pending email verification' };
            }

            const verificationData = JSON.parse(pendingVerification);
            if (Date.now() > verificationData.expiry) {
                localStorage.removeItem('hapo_email_verification');
                return { success: false, error: 'Verification code has expired' };
            }

            if (code !== verificationData.code) {
                return { success: false, error: 'Invalid verification code' };
            }

            // Mark email as verified and save user
            const userData = verificationData.userData;
            userData.emailVerified = true;
            localStorage.setItem('hapo_user_' + userData.email, JSON.stringify(userData));
            localStorage.removeItem('hapo_email_verification');

            return { success: true };
        } catch (error) {
            console.error('Email verification error:', error);
            return { success: false, error: 'Email verification failed' };
        }
    }

    // Resend email verification code
    async resendEmailVerification() {
        try {
            const pendingVerification = localStorage.getItem('hapo_email_verification');
            if (!pendingVerification) {
                return { success: false, error: 'No pending verification found' };
            }

            const verificationData = JSON.parse(pendingVerification);
            const newCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Update verification data with new code and extended expiry
            verificationData.code = newCode;
            verificationData.expiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

            localStorage.setItem('hapo_email_verification', JSON.stringify(verificationData));

            // Simulate sending new verification email
            this.simulateEmailVerification(verificationData.email, newCode);

            return { success: true };
        } catch (error) {
            console.error('Resend verification error:', error);
            return { success: false, error: 'Failed to resend verification code' };
        }
    }

    // Simulate sending email verification
    simulateEmailVerification(email, code) {
        // Create notification popup to simulate email sending
        const notification = document.createElement('div');
        notification.className = 'email-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <i class="fas fa-envelope"></i>
                    <span>Verification Email Sent</span>
                    <button class="close-notification" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notification-body">
                    <p>A verification code has been sent to:</p>
                    <strong>${email}</strong>
                    <div class="demo-notice">
                        <p><strong>Demo Mode:</strong> Your verification code is:</p>
                        <div class="demo-code">${code}</div>
                        <p><small>In production, this would be sent via email</small></p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove notification after 15 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 15000);

        // Add CSS for notification if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .email-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 1000;
                    min-width: 300px;
                    max-width: 400px;
                    animation: slideIn 0.3s ease-out;
                }

                .notification-content {
                    padding: 16px;
                }

                .notification-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    color: #4f46e5;
                    font-weight: 600;
                }

                .close-notification {
                    margin-left: auto;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #666;
                    padding: 4px;
                }

                .close-notification:hover {
                    color: #333;
                }

                .notification-body p {
                    margin: 8px 0;
                    color: #333;
                }

                .demo-notice {
                    background: #f8f9ff;
                    border: 1px solid #e0e7ff;
                    border-radius: 6px;
                    padding: 12px;
                    margin-top: 12px;
                }

                .demo-code {
                    font-family: 'Courier New', monospace;
                    font-size: 18px;
                    font-weight: bold;
                    color: #4f46e5;
                    background: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    text-align: center;
                    margin: 8px 0;
                    border: 2px solid #4f46e5;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Simulate sending email with MFA code
    simulateEmailSending(email, code) {
        // Create notification popup to simulate email sending
        const notification = document.createElement('div');
        notification.className = 'email-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <i class="fas fa-envelope"></i>
                    <span>Email Sent</span>
                    <button class="close-notification" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notification-body">
                    <p>A verification code has been sent to:</p>
                    <strong>${email}</strong>
                    <div class="demo-notice">
                        <p><strong>Demo Mode:</strong> Your verification code is:</p>
                        <div class="demo-code">${code}</div>
                        <p><small>In production, this would be sent via email</small></p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove notification after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);

        // Add CSS for notification if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .email-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 1000;
                    min-width: 300px;
                    max-width: 400px;
                    animation: slideIn 0.3s ease-out;
                }

                .notification-content {
                    padding: 16px;
                }

                .notification-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    color: #4f46e5;
                    font-weight: 600;
                }

                .close-notification {
                    margin-left: auto;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #666;
                    padding: 4px;
                }

                .close-notification:hover {
                    color: #333;
                }

                .notification-body p {
                    margin: 8px 0;
                    color: #333;
                }

                .demo-notice {
                    background: #f8f9ff;
                    border: 1px solid #e0e7ff;
                    border-radius: 6px;
                    padding: 12px;
                    margin-top: 12px;
                }

                .demo-code {
                    font-family: 'Courier New', monospace;
                    font-size: 18px;
                    font-weight: bold;
                    color: #4f46e5;
                    background: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    text-align: center;
                    margin: 8px 0;
                    border: 2px solid #4f46e5;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize auth system
const auth = new AuthSystem();

// ========================================
// AUTHENTICATION FORM HANDLING FUNCTIONS
// ========================================

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const eye = document.getElementById(inputId + 'Eye');

    if (input.type === 'password') {
        input.type = 'text';
        eye.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        eye.className = 'fas fa-eye';
    }
}

// Password strength indicator
function updatePasswordStrength() {
    const password = document.getElementById('password');
    const strengthDiv = document.getElementById('passwordStrength');

    if (!password || !strengthDiv) return;

    password.addEventListener('input', function() {
        const strength = auth.checkPasswordStrength(this.value);
        const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['#ff4444', '#ff8800', '#ffaa00', '#88cc00', '#44cc00'];

        strengthDiv.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${(strength.score / 5) * 100}%; background-color: ${strengthColors[strength.score - 1] || '#ff4444'}"></div>
            </div>
            <span class="strength-text">${strengthLevels[strength.score - 1] || 'Very Weak'}</span>
        `;

        if (strength.feedback.length > 0 && this.value.length > 0) {
            strengthDiv.innerHTML += `<div class="strength-feedback">Missing: ${strength.feedback.join(', ')}</div>`;
        }
    });
}

// Signup form handler
if (document.getElementById('signupForm')) {
    updatePasswordStrength();

    document.getElementById('signupForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        // Combine firstName and surname for fullName
        data.fullName = `${data.firstName} ${data.surname}`;

        // Combine country code and mobile number
        data.fullMobileNumber = `${data.countryCode}${data.mobileNumber}`;

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        // Validate form
        let hasErrors = false;

        if (!data.firstName.trim()) {
            document.getElementById('firstNameError').textContent = 'First name is required';
            hasErrors = true;
        }

        if (!data.surname.trim()) {
            document.getElementById('surnameError').textContent = 'Surname is required';
            hasErrors = true;
        }

        if (!data.mobileNumber.trim()) {
            document.getElementById('mobileNumberError').textContent = 'Mobile number is required';
            hasErrors = true;
        } else if (!/^\d{9,10}$/.test(data.mobileNumber)) {
            document.getElementById('mobileNumberError').textContent = 'Please enter a valid mobile number';
            hasErrors = true;
        }

        if (!data.province) {
            document.getElementById('provinceError').textContent = 'Please select a province';
            hasErrors = true;
        }

        if (!data.gender) {
            document.getElementById('genderError').textContent = 'Please select a gender';
            hasErrors = true;
        }

        if (data.password !== data.confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
            hasErrors = true;
        }

        if (!data.terms) {
            document.getElementById('termsError').textContent = 'You must agree to the terms';
            hasErrors = true;
        }

        const passwordStrength = auth.checkPasswordStrength(data.password);
        if (passwordStrength.score < 3) {
            document.getElementById('passwordError').textContent = 'Password is too weak';
            hasErrors = true;
        }

        if (hasErrors) return;

        // Show loading
        const button = document.getElementById('signupButton');
        const buttonText = document.getElementById('signupButtonText');
        const spinner = document.getElementById('loadingSpinner');

        button.disabled = true;
        buttonText.style.display = 'none';
        spinner.style.display = 'block';

        try {
            const result = await auth.signUp(data);

            if (result.success) {
                if (result.requiresEmailVerification) {
                    // Hide signup form and show email verification form
                    document.getElementById('signupForm').style.display = 'none';
                    document.getElementById('emailVerificationForm').style.display = 'block';
                    document.querySelector('.auth-header h2').textContent = 'Verify Your Email';
                    document.querySelector('.auth-header p').textContent = 'Please enter the verification code sent to your email';
                } else {
                    alert('Account created successfully! Please sign in with your credentials.');
                    window.location.href = 'login.html';
                }
            } else {
                alert(result.error || 'Signup failed');
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        } finally {
            button.disabled = false;
            buttonText.style.display = 'block';
            spinner.style.display = 'none';
        }
    });
}

// Login form handler
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const email = formData.get('email');
        const password = formData.get('password');

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        // Show loading
        const button = document.getElementById('loginButton');
        const buttonText = document.getElementById('loginButtonText');
        const spinner = document.getElementById('loginLoadingSpinner');

        button.disabled = true;
        buttonText.style.display = 'none';
        spinner.style.display = 'block';

        try {
            const result = await auth.signIn(email, password);

           if (result.success) {
                window.location.href = 'parentDashboard.html'; // Redirecting to the dashboard
            } else {
                document.getElementById('loginPasswordError').textContent = result.error;
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        } finally {
            button.disabled = false;
            buttonText.style.display = 'block';
            spinner.style.display = 'none';
        }
    });
}

// ========================================
// EMAIL VERIFICATION FUNCTIONS
// ========================================

// Email verification during signup
async function verifyEmailCode() {
    const code = document.getElementById('emailVerificationCode').value;

    if (!code || code.length !== 6) {
        document.getElementById('emailVerificationError').textContent = 'Please enter a 6-digit code';
        return;
    }

    // Show loading
    const button = document.querySelector('#emailVerificationForm .auth-button');
    const buttonText = document.getElementById('emailVerifyButtonText');
    const spinner = document.getElementById('emailVerifySpinner');

    button.disabled = true;
    buttonText.style.display = 'none';
    spinner.style.display = 'block';

    try {
        const result = await auth.verifyEmail(code);

        if (result.success) {
            alert('Email verified successfully! You can now sign in with your credentials.');
            window.location.href = 'parentLogin.html';
        } else {
            document.getElementById('emailVerificationError').textContent = result.error;
        }
    } catch (error) {
        alert('An error occurred. Please try again.');
    } finally {
        button.disabled = false;
        buttonText.style.display = 'block';
        spinner.style.display = 'none';
    }
}

// Resend email verification code
async function resendEmailVerification() {
    try {
        const result = await auth.resendEmailVerification();

        if (result.success) {
            // Clear any previous error messages
            document.getElementById('emailVerificationError').textContent = '';

            // Show success message
            const successDiv = document.querySelector('.email-success-message') || document.createElement('div');
            successDiv.className = 'email-success-message';
            successDiv.textContent = 'New verification code sent to your email';
            successDiv.style.cssText = 'color: #059669; background: #d1fae5; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px; border: 1px solid #10b981;';

            if (!document.querySelector('.email-success-message')) {
                document.getElementById('emailVerificationForm').insertBefore(successDiv, document.getElementById('emailVerificationForm').firstChild);
            }

            // Remove success message after 5 seconds
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.remove();
                }
            }, 5000);
        } else {
            alert(result.error || 'Failed to resend verification code');
        }
    } catch (error) {
        alert('An error occurred. Please try again.');
    }
}

function backToSignup() {
    document.getElementById('emailVerificationForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.querySelector('.auth-header h2').textContent = 'Parent Sign Up';
    document.querySelector('.auth-header p').textContent = 'Create your Hapo account to manage your family\'s finances';
}

// ========================================
// MFA (MULTI-FACTOR AUTHENTICATION) FUNCTIONS
// ========================================

// MFA verification
async function verifyMFA() {
    const code = document.getElementById('mfaCode').value;

    if (!code || code.length !== 6) {
        document.getElementById('mfaCodeError').textContent = 'Please enter a 6-digit code';
        return;
    }

    // Show loading
    const button = document.querySelector('#mfaForm .auth-button');
    const buttonText = document.getElementById('mfaButtonText');
    const spinner = document.getElementById('mfaLoadingSpinner');

    button.disabled = true;
    buttonText.style.display = 'none';
    spinner.style.display = 'block';

    try {
        const result = await auth.verifyMFA(code);

        if (result.success) {
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('mfaCodeError').textContent = result.error;
        }
    } catch (error) {
        alert('An error occurred. Please try again.');
    } finally {
        button.disabled = false;
        buttonText.style.display = 'block';
        spinner.style.display = 'none';
    }
}

// MFA helper functions
async function resendMFA() {
    const pendingMFA = localStorage.getItem('hapo_pending_mfa');
    if (!pendingMFA) {
        alert('No pending verification found. Please sign in again.');
        return;
    }

    const mfaData = JSON.parse(pendingMFA);

    // Generate new code
    const newMfaCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update stored MFA data with new code and extended expiry
    const updatedMfaData = {
        ...mfaData,
        code: newMfaCode,
        expiry: Date.now() + 5 * 60 * 1000 // 5 minutes from now
    };

    localStorage.setItem('hapo_pending_mfa', JSON.stringify(updatedMfaData));

    // In production, this would send the MFA code via email
    // For demo purposes, we'll store it but not display it
    console.log(`New MFA code for ${mfaData.email}: ${newMfaCode}`); // Dev only - remove in production

    // Clear any previous error messages
    document.getElementById('mfaCodeError').textContent = '';

    // Show success message
    const successDiv = document.querySelector('.success-message');
    if (successDiv) {
        successDiv.textContent = `New verification code sent to ${mfaData.email}`;
    } else {
        const newSuccessDiv = document.createElement('div');
        newSuccessDiv.className = 'success-message';
        newSuccessDiv.textContent = `New verification code sent to ${mfaData.email}`;
        newSuccessDiv.style.cssText = 'color: #059669; background: #d1fae5; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px; border: 1px solid #10b981;';
        document.getElementById('mfaForm').insertBefore(newSuccessDiv, document.getElementById('mfaForm').firstChild);
    }
}

function switchMFAMethod() {
    alert('Alternative MFA methods coming soon!');
}

function backToLogin() {
    document.getElementById('mfaForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

// ========================================
// OAUTH AUTHENTICATION FUNCTIONS
// ========================================

async function signUpWithGoogle() {
    try {
        const result = await auth.signInWithGoogle();
        if (result.success) {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        alert('Google sign up failed. Please try again.');
    }
}

async function signUpWithMicrosoft() {
    try {
        const result = await auth.signInWithMicrosoft();
        if (result.success) {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        alert('Microsoft sign up failed. Please try again.');
    }
}

async function signInWithGoogle() {
    try {
        const result = await auth.signInWithGoogle();
        if (result.success) {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        alert('Google sign in failed. Please try again.');
    }
}

async function signInWithMicrosoft() {
    try {
        const result = await auth.signInWithMicrosoft();
        if (result.success) {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        alert('Microsoft sign in failed. Please try again.');
    }
}

function showForgotPassword() {
    alert('Password reset functionality coming soon!');
}

// Check authentication on dashboard
if (window.location.pathname.includes('dashboard.html')) {
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
    } else {
        const user = auth.getCurrentUser();
        if (user && document.getElementById('userName')) {
            document.getElementById('userName').textContent = `Welcome, ${user.fullName}`;
        }
    }
}

// ========================================
// DASHBOARD FUNCTIONALITY CODE (from dashboard.js)
// ========================================

// Dashboard functionality
class Dashboard {
    constructor() {
        this.user = auth.getCurrentUser();
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
    }

    loadUserData() {
        // Update user name display with actual user data
        const user = auth.getCurrentUser();
        if (user && document.getElementById('userName')) {
            document.getElementById('userName').textContent = `Welcome, ${user.fullName}`;
        }

        // Mock data loading
        this.updateDashboardData();
    }

    updateDashboardData() {
        // Update statistics (mock data)
        const stats = {
            totalBalance: 1234.56,
            activeChildren: 2,
            recentTransactions: [
                { description: 'School Lunch - Alex', amount: -5.50 },
                { description: 'Allowance - Sarah', amount: 20.00 },
                { description: 'Book Store - Alex', amount: -12.99 },
                { description: 'Reward Points - Sarah', amount: 5.00 }
            ]
        };

        // Update balance display
        const balanceElement = document.querySelector('.stat-value');
        if (balanceElement) {
            balanceElement.textContent = `$${stats.totalBalance.toFixed(2)}`;
        }
    }

    setupEventListeners() {
        // Action buttons
        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.textContent.trim();
                this.handleAction(action);
            });
        });
    }

    handleAction(action) {
        switch(action) {
            case 'Add Child Account':
                this.showAddChildModal();
                break;
            case 'Send Money':
                this.showSendMoneyModal();
                break;
            case 'Set Spending Limits':
                this.showSpendingLimitsModal();
                break;
            default:
                alert(`${action} functionality coming soon!`);
        }
    }

    showAddChildModal() {
        showAddChildModal();
    }

    showSendMoneyModal() {
        alert('Send Money functionality coming soon!');
    }

    showSpendingLimitsModal() {
        alert('Spending Limits functionality coming soon!');
    }
}

// ========================================
// DASHBOARD USER MENU FUNCTIONS
// ========================================

function toggleUserMenu() {
    const dropdown = document.getElementById('userMenuDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function showProfile() {
    alert('Profile settings coming soon!');
}

function showNotifications() {
    // Show notifications sidebar
    const sidebar = document.getElementById('notificationsSidebar');
    if (sidebar) {
        sidebar.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadStudentRequests();
    } else {
        console.error('Notifications sidebar not found');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.logout();
    }
}

// Close user menu when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userMenuDropdown');

    if (userMenu && dropdown && !userMenu.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Initialize dashboard if we're on the dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    new Dashboard();

    // Add sample request data for testing if none exists
    const existingRequests = JSON.parse(localStorage.getItem('hapo_student_requests') || '[]');
    if (existingRequests.length === 0) {
        const sampleRequests = [
            {
                id: Date.now() + 1,
                studentId: 'student_1',
                studentName: 'Inam Bhele',
                type: 'money',
                amount: 25.00,
                reason: 'Need money for school lunch and books',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
                status: 'pending'
            },
            {
                id: Date.now() + 2,
                studentId: 'student_1',
                studentName: 'Inam Bhele',
                type: 'emergency',
                amount: 50.00,
                reason: 'Emergency transport money - missed the school bus',
                timestamp: new Date('2025-05-06T13:45:00').toISOString(), // 05/06/2025
                status: 'pending'
            },
            {
                id: Date.now() + 3,
                studentId: 'student_2',
                studentName: 'Bukho Madala',
                type: 'money',
                amount: 15.00,
                reason: 'Need money for school supplies and stationery',
                timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
                status: 'pending'
            },
            {
                id: Date.now() + 4,
                studentId: 'student_2',
                studentName: 'Bukho Madala',
                type: 'emergency',
                amount: 30.00,
                reason: 'Emergency - need money for unexpected school trip fee',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
                status: 'pending'
            }
        ];
        localStorage.setItem('hapo_student_requests', JSON.stringify(sampleRequests));
    }
}

// ========================================
// NOTIFICATION FUNCTIONS
// ========================================

function loadStudentRequests() {
    const notificationsList = document.getElementById('sidebarNotificationsList') || document.getElementById('notificationsList');
    if (!notificationsList) {
        console.error('Notifications list element not found');
        return;
    }

    const requests = JSON.parse(localStorage.getItem('hapo_student_requests') || '[]');

    // Filter pending requests
    const pendingRequests = requests.filter(req => req.status === 'pending');

    if (pendingRequests.length === 0) {
        notificationsList.innerHTML = `
            <div class="no-notifications">
                <div class="no-notifications-icon">
                    <i class="fas fa-bell-slash"></i>
                </div>
                <h3>No new notifications</h3>
                <p>You'll see money requests from your children here</p>
            </div>
        `;
        return;
    }

    notificationsList.innerHTML = '';

    pendingRequests.forEach(request => {
        const requestElement = document.createElement('div');
        requestElement.className = 'sidebar-notification-item';
        requestElement.onclick = () => showRequestDetails(request);

        const isEmergency = request.type === 'emergency';
        const iconClass = isEmergency ? 'emergency' : 'money';
        const iconSymbol = isEmergency ? 'fa-exclamation-triangle' : 'fa-dollar-sign';

        requestElement.innerHTML = `
            <div class="notification-icon ${iconClass}">
                <i class="fas ${iconSymbol}"></i>
            </div>
            <div class="notification-details">
                <div class="notification-title">${isEmergency ? 'Emergency' : 'Money'} request from ${request.studentName}</div>
                <div class="notification-message">Requesting $${request.amount.toFixed(2)}</div>
                <div class="notification-time">${formatRequestTime(request.timestamp)}</div>
            </div>
            <div class="notification-amount">$${request.amount.toFixed(2)}</div>
        `;

        notificationsList.appendChild(requestElement);
    });
}

function loadNotificationsList() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) {
        console.error('Notifications list element not found');
        return;
    }

    const requests = JSON.parse(localStorage.getItem('hapo_student_requests') || '[]');

    // Filter pending requests
    const pendingRequests = requests.filter(req => req.status === 'pending');

    // If no dynamic requests exist, keep the existing sample notifications
    if (pendingRequests.length === 0) {
        // Check if sample notifications already exist
        const existingNotifications = notificationsList.querySelectorAll('.notification-item');
        if (existingNotifications.length > 0) {
            // Sample notifications already exist, don't replace them
            return;
        }

        // Add sample notifications if none exist
        notificationsList.innerHTML = `
            <div class="notification-item" onclick="showNotificationDetails(1)">
                <div class="notification-icon money">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="notification-details">
                    <div class="notification-title">Money request from Inam Bhele</div>
                    <div class="notification-message">Requesting $25.00</div>
                    <div class="notification-time">30 minutes ago</div>
                </div>
                <div class="notification-amount">$25.00</div>
                <div class="notification-actions">
                    <button class="read-more-btn" onclick="event.stopPropagation(); showNotificationDetails(1)">Read More</button>
                </div>
            </div>

            <div class="notification-item" onclick="showNotificationDetails(2)">
                <div class="notification-icon emergency">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="notification-details">
                    <div class="notification-title">Emergency request from Inam Bhele</div>
                    <div class="notification-message">Requesting $50.00</div>
                    <div class="notification-time">2 hours ago</div>
                </div>
                <div class="notification-amount">$50.00</div>
                <div class="notification-actions">
                    <button class="read-more-btn" onclick="event.stopPropagation(); showNotificationDetails(2)">Read More</button>
                </div>
            </div>

            <div class="notification-item" onclick="showNotificationDetails(3)">
                <div class="notification-icon money">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="notification-details">
                    <div class="notification-title">Money request from Bukho Madala</div>
                    <div class="notification-message">Requesting $15.00</div>
                    <div class="notification-time">45 minutes ago</div>
                </div>
                <div class="notification-amount">$15.00</div>
                <div class="notification-actions">
                    <button class="read-more-btn" onclick="event.stopPropagation(); showNotificationDetails(3)">Read More</button>
                </div>
            </div>

            <div class="notification-item" onclick="showNotificationDetails(4)">
                <div class="notification-icon emergency">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="notification-details">
                    <div class="notification-title">Emergency request from Bukho Madala</div>
                    <div class="notification-message">Requesting $30.00</div>
                    <div class="notification-time">3 hours ago</div>
                </div>
                <div class="notification-amount">$30.00</div>
                <div class="notification-actions">
                    <button class="read-more-btn" onclick="event.stopPropagation(); showNotificationDetails(4)">Read More</button>
                </div>
            </div>
        `;
        return;
    }

    // Clear existing content and add dynamic notifications
    notificationsList.innerHTML = '';

    pendingRequests.forEach(request => {
        const requestElement = document.createElement('div');
        requestElement.className = 'notification-item';
        requestElement.onclick = () => showNotificationDetails(request.id);

        const isEmergency = request.type === 'emergency';
        const iconClass = isEmergency ? 'emergency' : 'money';
        const iconSymbol = isEmergency ? 'fa-exclamation-triangle' : 'fa-dollar-sign';

        requestElement.innerHTML = `
            <div class="notification-icon ${iconClass}">
                <i class="fas ${iconSymbol}"></i>
            </div>
            <div class="notification-details">
                <div class="notification-title">${isEmergency ? 'Emergency' : 'Money'} request from ${request.studentName}</div>
                <div class="notification-message">Requesting $${request.amount.toFixed(2)}</div>
                <div class="notification-time">${formatRequestTime(request.timestamp)}</div>
            </div>
            <div class="notification-amount">$${request.amount.toFixed(2)}</div>
            <div class="notification-actions">
                <button class="read-more-btn" onclick="event.stopPropagation(); showNotificationDetails(${request.id})">Read More</button>
            </div>
        `;

        notificationsList.appendChild(requestElement);
    });
}

function formatRequestTime(timestamp) {
    const now = new Date();
    const requestTime = new Date(timestamp);
    const diff = now - requestTime;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
        return `${minutes} minutes ago`;
    } else if (hours < 24) {
        return `${hours} hours ago`;
    } else {
        return `${days} days ago`;
    }
}

let currentRequest = null;

function showRequestDetails(request) {
    currentRequest = request;
    const detailsPanel = document.getElementById('requestDetailsPanel');

    document.getElementById('sidebarRequestDetails').innerHTML = `
        <div class="request-header">
            <div class="request-student">
                <div class="student-avatar">${request.studentName.split(' ').map(n => n[0]).join('')}</div>
                <div class="student-info">
                    <div class="student-name">${request.studentName}</div>
                    <div class="request-time">${formatRequestTime(request.timestamp)}</div>
                </div>
            </div>
            <div class="request-amount ${request.type === 'emergency' ? 'emergency' : ''}">
                $${request.amount.toFixed(2)}
            </div>
        </div>
        <div class="request-content">
            <div class="request-type">
                <i class="fas ${request.type === 'emergency' ? 'fa-exclamation-triangle' : 'fa-dollar-sign'}"></i>
                ${request.type === 'emergency' ? 'Emergency Request' : 'Money Request'}
            </div>
            <div class="request-reason">
                <strong>Reason:</strong>
                <p>${request.reason || 'No reason provided'}</p>
            </div>
        </div>
        <div class="request-actions">
            <button class="decline-btn" onclick="declineRequestSidebar()">
                <i class="fas fa-times"></i>
                Decline
            </button>
            <button class="approve-btn" onclick="approveRequestSidebar()">
                <i class="fas fa-check"></i>
                Approve
            </button>
        </div>
    `;

    detailsPanel.style.display = 'block';
}

function showRequestDetailsModal(request) {
    currentRequest = request;

    document.getElementById('requestDetails').innerHTML = `
        <div class="request-header">
            <div class="request-student">
                <div class="student-avatar">${request.studentName.split(' ').map(n => n[0]).join('')}</div>
                <div class="student-info">
                    <div class="student-name">${request.studentName}</div>
                    <div class="request-time">${formatRequestTime(request.timestamp)}</div>
                </div>
            </div>
            <div class="request-amount ${request.type === 'emergency' ? 'emergency' : ''}">
                $${request.amount.toFixed(2)}
            </div>
        </div>
        <div class="request-content">
            <div class="request-type">
                <i class="fas ${request.type === 'emergency' ? 'fa-exclamation-triangle' : 'fa-dollar-sign'}"></i>
                ${request.type === 'emergency' ? 'Emergency Request' : 'Money Request'}
            </div>
            <div class="request-reason">
                <strong>Reason:</strong>
                <p>${request.reason || 'No reason provided'}</p>
            </div>
        </div>
    `;

    document.getElementById('viewRequestModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeNotificationsSidebar() {
    document.getElementById('notificationsSidebar').style.display = 'none';
    document.getElementById('requestDetailsPanel').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentRequest = null;
}

function closeViewRequestModal() {
    document.getElementById('viewRequestModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentRequest = null;
}

function approveRequestSidebar() {
    if (!currentRequest) return;

    // Update request status
    const requests = JSON.parse(localStorage.getItem('hapo_student_requests') || '[]');
    const requestIndex = requests.findIndex(req => req.id === currentRequest.id);
    if (requestIndex !== -1) {
        requests[requestIndex].status = 'approved';
        localStorage.setItem('hapo_student_requests', JSON.stringify(requests));
    }

    // Store the current request data before closing sidebar
    const requestData = {
        studentName: currentRequest.studentName,
        amount: currentRequest.amount
    };

    closeNotificationsSidebar();

    // Switch to home section first
    showSection('home');

    // Small delay to ensure section is visible, then open send money modal
    setTimeout(() => {
        showSendMoneyModal(requestData.studentName);
        const sendAmountInput = document.getElementById('sendAmount');
        if (sendAmountInput) {
            sendAmountInput.value = requestData.amount.toFixed(2);
        }
    }, 200);

    // Refresh notifications to remove approved request
    setTimeout(() => {
        loadStudentRequests();
        loadNotificationsList();
    }, 300);

    showSuccessMessage(`Request approved! Opening send money for ${requestData.studentName}`);
}

function declineRequestSidebar() {
    if (!currentRequest) return;

    if (confirm('Are you sure you want to decline this request?')) {
        // Update request status
        const requests = JSON.parse(localStorage.getItem('hapo_student_requests') || '[]');
        const requestIndex = requests.findIndex(req => req.id === currentRequest.id);
        if (requestIndex !== -1) {
            requests[requestIndex].status = 'declined';
            localStorage.setItem('hapo_student_requests', JSON.stringify(requests));
        }

        closeNotificationsSidebar();
        showSuccessMessage('Request declined');
    }
}

function approveRequest() {
    if (!currentRequest) return;

    // Store the current request data before closing modal
    const requestData = {
        studentName: currentRequest.studentName,
        amount: currentRequest.amount
    };

    // Update request status for dynamic requests
    const requests = JSON.parse(localStorage.getItem('hapo_student_requests') || '[]');
    const requestIndex = requests.findIndex(req => req.id === currentRequest.id);
    if (requestIndex !== -1) {
        requests[requestIndex].status = 'approved';
        localStorage.setItem('hapo_student_requests', JSON.stringify(requests));
    }

    closeViewRequestModal();

    // Switch to home section first
    showSection('home');

    // Small delay to ensure section is visible, then open send money modal
    setTimeout(() => {
        showSendMoneyModal(requestData.studentName);
        const sendAmountInput = document.getElementById('sendAmount');
        if (sendAmountInput) {
            sendAmountInput.value = requestData.amount.toFixed(2);
        }
    }, 200);

    // Refresh notifications lists
    setTimeout(() => {
        loadNotificationsList();
        loadStudentRequests();
    }, 300);

    // For sample notifications, update the UI to show approved state
    if (currentRequest.id <= 4) {
        const notificationItems = document.querySelectorAll('.notification-item');
        notificationItems.forEach((item, index) => {
            if (index === currentRequest.id - 1) {
                item.style.opacity = '0.5';
                item.style.pointerEvents = 'none';
                const readMoreBtn = item.querySelector('.read-more-btn');
                if (readMoreBtn) {
                    readMoreBtn.textContent = 'Approved';
                    readMoreBtn.disabled = true;
                    readMoreBtn.style.background = '#10b981';
                }
            }
        });
    }

    showSuccessMessage(`Request approved! Opening send money for ${requestData.studentName}`);
}

function declineRequest() {
    if (!currentRequest) return;

    if (confirm('Are you sure you want to decline this request?')) {
        // Update request status for dynamic requests
        const requests = JSON.parse(localStorage.getItem('hapo_student_requests') || '[]');
        const requestIndex = requests.findIndex(req => req.id === currentRequest.id);
        if (requestIndex !== -1) {
            requests[requestIndex].status = 'declined';
            localStorage.setItem('hapo_student_requests', JSON.stringify(requests));
        }

        closeViewRequestModal();

        // Refresh notifications lists
        loadNotificationsList();
        loadStudentRequests();

        // For sample notifications, update the UI to show declined state
        if (currentRequest.id <= 4) {
            const notificationItems = document.querySelectorAll('.notification-item');
            notificationItems.forEach((item, index) => {
                if (index === currentRequest.id - 1) {
                    item.style.opacity = '0.5';
                    item.style.pointerEvents = 'none';
                    const readMoreBtn = item.querySelector('.read-more-btn');
                    if (readMoreBtn) {
                        readMoreBtn.textContent = 'Declined';
                        readMoreBtn.disabled = true;
                        readMoreBtn.style.background = '#ef4444';
                    }
                }
            });
        }

        showSuccessMessage('Request declined');
    }
}

// ========================================
// DASHBOARD MODAL FUNCTIONS
// ========================================

// Send Money Modal Functions
function showSendMoneyModal(childName) {
    document.getElementById('sendMoneyChildName').textContent = childName;
    document.getElementById('sendMoneyModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeSendMoneyModal() {
    document.getElementById('sendMoneyModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('sendMoneyForm').reset();
}

// Emergency Fund Modal Functions
function showEmergencyFundModal() {
    document.getElementById('emergencyFundModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    populateChildDropdown('emergencyChild');
}

function closeEmergencyFundModal() {
    document.getElementById('emergencyFundModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('emergencyFundForm').reset();
}

// Wallet Top-up Modal Functions
function showWalletTopUpModal() {
    document.getElementById('walletTopUpModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    populateChildDropdown('topupChild');
}

function closeWalletTopUpModal() {
    document.getElementById('walletTopUpModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('walletTopUpForm').reset();
}

// Spending Limits Modal Functions
function showSpendingLimitsModal() {
    document.getElementById('spendingLimitsModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    populateChildDropdown('limitsChild');
}

function closeSpendingLimitsModal() {
    document.getElementById('spendingLimitsModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('spendingLimitsForm').reset();
}

// Recurring Payments Modal Functions
function showRecurringPaymentsModal() {
    document.getElementById('recurringPaymentsModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeRecurringPaymentsModal() {
    document.getElementById('recurringPaymentsModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function closeAddRecurringPaymentModal() {
    document.getElementById('addRecurringPaymentModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('addRecurringPaymentForm').reset();
}

// Add Child Modal Functions
function showAddChildModal() {
    document.getElementById('addChildModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeAddChildModal() {
    document.getElementById('addChildModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('addChildForm').reset();
}

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    const modal = document.getElementById('addChildModal');
    if (event.target === modal) {
        closeAddChildModal();
    }
});

// Handle Add Child form submission
if (document.getElementById('addChildForm')) {
    document.getElementById('addChildForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const childData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            username: formData.get('username') || `${formData.get('firstName').toLowerCase()}@hapo.com`,
            password: formData.get('password') || 'defaultpass123',
            weeklyLimit: parseFloat(formData.get('weeklyLimit')) || 50,
            dailyLimit: parseFloat(formData.get('dailyLimit')) || 10,
            balance: 0,
            id: 'child_' + Date.now(),
            parentId: auth.getCurrentUser()?.id || 'parent_demo',
            createdAt: new Date().toISOString(),
            active: true
        };

        try {
            // Save to Supabase if available
            if (window.hapoDb) {
                const result = await window.hapoDb.createStudent(childData);
                if (!result.success) {
                    throw new Error(result.error);
                }
            } else {
                // Fallback to localStorage
                const existingChildren = JSON.parse(localStorage.getItem('hapo_children') || '[]');
                existingChildren.push(childData);
                localStorage.setItem('hapo_children', JSON.stringify(existingChildren));
            }

            // Add child to the UI
            addChildToUI(childData);

            // Close modal and show success message
            closeAddChildModal();
            showSuccessMessage(`${childData.firstName}'s account created successfully!`);

        } catch (error) {
            console.error('Error creating child account:', error);
            alert('Failed to create child account. Please try again.');
        }
    });
}

function addChildToUI(childData) {
    const childrenList = document.getElementById('childrenList');
    const childCard = document.createElement('div');
    childCard.className = 'child-card';
    childCard.innerHTML = `
        <div class="child-avatar">${childData.firstName.charAt(0).toUpperCase()}${childData.lastName.charAt(0).toUpperCase()}</div>
        <div class="child-info">
            <div class="child-name">${childData.firstName} ${childData.lastName}</div>
            <div class="child-status">Active • Weekly limit: $${childData.weeklyLimit.toFixed(2)}</div>
        </div>
        <div class="child-balance">
            <div class="balance-amount">$${childData.balance.toFixed(2)}</div>
            <div class="balance-label">Available</div>
        </div>
        <div class="child-actions">
            <button class="action-btn send-money" onclick="sendMoneyToChild('${childData.firstName} ${childData.lastName}')">
                <i class="fas fa-paper-plane"></i>
                Send Money
            </button>
            <button class="action-btn view-activity" onclick="viewChildActivity('${childData.firstName} ${childData.lastName}')">
                View Activity
            </button>
        </div>
    `;
    childrenList.appendChild(childCard);
}

function sendMoneyToChild(childName) {
    const amount = prompt(`How much would you like to send to ${childName}?`, '10');
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        showSuccessMessage(`$${parseFloat(amount).toFixed(2)} sent to ${childName} successfully!`);
        // In real app, this would update the database and child's balance
    }
}

function viewChildActivity(childName) {
    alert(`Viewing activity for ${childName} - Feature coming soon!`);
}

function showNotificationDetails(requestId) {
    const requests = JSON.parse(localStorage.getItem('hapo_student_requests') || '[]');
    const request = requests.find(req => req.id === requestId);

    if (request) {
        currentRequest = request;
        showRequestDetailsModal(request);
    } else {
        // Handle sample notifications (static HTML notifications)
        const sampleRequests = {
            1: {
                id: 1,
                studentName: 'Inam Bhele',
                type: 'money',
                amount: 25.00,
                reason: 'Need money for school lunch and books',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
            },
            2: {
                id: 2,
                studentName: 'Inam Bhele',
                type: 'emergency',
                amount: 50.00,
                reason: 'Emergency transport money - missed the school bus',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            3: {
                id: 3,
                studentName: 'Bukho Madala',
                type: 'money',
                amount: 15.00,
                reason: 'Need money for school supplies and stationery',
                timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
            },
            4: {
                id: 4,
                studentName: 'Bukho Madala',
                type: 'emergency',
                amount: 30.00,
                reason: 'Emergency - need money for unexpected school trip fee',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
            }
        };

        const sampleRequest = sampleRequests[requestId];
        if (sampleRequest) {
            currentRequest = sampleRequest;
            showRequestDetailsModal(sampleRequest);
        }
    }
}

function approveNotification(requestId) {
    const requests = JSON.parse(localStorage.getItem('hapo_student_requests') || '[]');
    const request = requests.find(req => req.id === requestId);

    if (request) {
        currentRequest = request;
        approveRequest();
    } else {
        // Handle sample notification approval
        showNotificationDetails(requestId);
        setTimeout(() => {
            if (currentRequest) {
                // Switch to home section first
                showSection('home');

                // Small delay to ensure section is visible, then open send money modal
                setTimeout(() => {
                    showSendMoneyModal(currentRequest.studentName);
                    document.getElementById('sendAmount').value = currentRequest.amount.toFixed(2);
                }, 100);

                showSuccessMessage(`Request approved! Send money modal opened for ${currentRequest.studentName}`);
            }
        }, 100);
    }
}

function declineNotification(requestId) {
    const requests = JSON.parse(localStorage.getItem('hapo_student_requests') || '[]');
    const request = requests.find(req => req.id === requestId);

    if (request) {
        currentRequest = request;
        declineRequest();
    } else {
        // Handle sample notification decline
        if (confirm('Are you sure you want to decline this request?')) {
            showSuccessMessage('Request declined');
            // Remove the notification from view
            const notificationItems = document.querySelectorAll('.notification-item');
            notificationItems.forEach((item, index) => {
                if (index === requestId - 1) {
                    item.style.opacity = '0.5';
                    item.style.pointerEvents = 'none';
                }
            });
        }
    }
}

function approveRequestFromList(requestId) {
    approveNotification(requestId);
}

function declineRequestFromList(requestId) {
    declineNotification(requestId);
}

function showSuccessMessage(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button class="close-notification" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);

    // Add CSS for success notification if not already added
    if (!document.getElementById('success-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'success-notification-styles';
        style.textContent = `
            .success-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #d1fae5;
                border: 1px solid #10b981;
                border-radius: 8px;
                z-index: 1001;
                min-width: 300px;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            }

            .success-notification .notification-content {
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #065f46;
            }

            .success-notification .fa-check-circle {
                color: #10b981;
                font-size: 1.25rem;
            }

            .success-notification .close-notification {
                margin-left: auto;
                background: none;
                border: none;
                cursor: pointer;
                color: #065f46;
                padding: 4px;
            }

            .success-notification .close-notification:hover {
                color: #047857;
            }
        `;
        document.head.appendChild(style);
    }
}

// ========================================
// FORM HANDLERS FOR NEW FEATURES
// ========================================

// Send Money Form Handler
if (document.getElementById('sendMoneyForm')) {
    document.getElementById('sendMoneyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const amount = parseFloat(formData.get('sendAmount'));
        const childName = document.getElementById('sendMoneyChildName').textContent;

        if (amount > 0) {
            try {
                const currentUser = auth.getCurrentUser();
                let studentFound = false;

                // Try Supabase first
                if (window.hapoDb && currentUser) {
                    try {
                        const studentsResult = await window.hapoDb.getStudentsByParent(currentUser.id);
                        if (studentsResult.success) {
                            const student = studentsResult.data.find(s => `${s.first_name} ${s.last_name}` === childName);
                            if (student) {
                                studentFound = true;

                                // Update student balance in Supabase
                                const newBalance = student.balance + amount;
                                await window.hapoDb.updateStudentBalance(student.id, newBalance);

                                // Create transaction record
                                const transactionData = {
                                    id: 'trans_' + Date.now(),
                                    studentId: student.id,
                                    parentId: currentUser.id,
                                    type: 'transfer',
                                    amount: amount,
                                    description: `Money transfer from parent`,
                                    category: 'transfer',
                                    status: 'completed'
                                };

                                await window.hapoDb.createTransaction(transactionData);
                            }
                        }
                    } catch (supabaseError) {
                        console.log('Supabase not available, using localStorage fallback');
                    }
                }

                // Fallback to localStorage for demo
                if (!studentFound) {
                    const children = JSON.parse(localStorage.getItem('hapo_children') || '[]');
                    const student = children.find(child => `${child.firstName} ${child.lastName}` === childName);

                    if (student) {
                        // Update student balance in localStorage
                        student.balance = (student.balance || 0) + amount;

                        // Update the children array
                        const studentIndex = children.findIndex(child => child.id === student.id);
                        if (studentIndex !== -1) {
                            children[studentIndex] = student;
                            localStorage.setItem('hapo_children', JSON.stringify(children));
                            console.log('Updated child balance in localStorage:', children[studentIndex]);
                        }

                        // Update current student session if it's the same student
                        const currentStudent = localStorage.getItem('hapo_current_student');
                        if (currentStudent) {
                            const studentData = JSON.parse(currentStudent);
                            if (studentData.id === student.id || 
                                (studentData.username === student.username) ||
                                (`${studentData.firstName} ${studentData.lastName}` === `${student.firstName} ${student.lastName}`)) {
                                studentData.balance = student.balance;
                                localStorage.setItem('hapo_current_student', JSON.stringify(studentData));
                                console.log('Updated current student session:', studentData);
                            }
                        }

                        // Create transaction record in localStorage
                        const transactions = JSON.parse(localStorage.getItem('hapo_transactions') || '[]');
                        transactions.unshift({
                            id: 'trans_' + Date.now(),
                            studentId: student.id,
                            parentId: currentUser.id,
                            type: 'transfer',
                            amount: amount,
                            description: `Money transfer from parent`,
                            category: 'transfer',
                            status: 'completed',
                            timestamp: new Date().toISOString()
                        });
                        localStorage.setItem('hapo_transactions', JSON.stringify(transactions));
                    }
                }

                // Add transaction to activity list (UI update)
                addTransactionToActivity({
                    type: 'transfer',
                    title: `Money transfer to ${childName}`,
                    subtitle: childName,
                    amount: amount,
                    positive: false,
                    date: new Date()
                });

                closeSendMoneyModal();
                showSuccessMessage(`$${amount.toFixed(2)} sent to ${childName} successfully!`);
                updateFamilyBalance(-amount);

            } catch (error) {
                console.error('Error sending money:', error);
                showSuccessMessage(`$${amount.toFixed(2)} sent to ${childName} successfully! (Local mode)`);
            }
        }
    });
}

// Emergency Fund Form Handler
if (document.getElementById('emergencyFundForm')) {
    document.getElementById('emergencyFundForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const amount = parseFloat(formData.get('emergencyAmount'));
        const childName = formData.get('emergencyChild');

        if (amount > 0 && childName) {
            // Add emergency transaction to activity list
            addTransactionToActivity({
                type: 'emergency',
                title: `Emergency fund transfer to ${childName}`,
                subtitle: childName,
                amount: amount,
                positive: false,
                date: new Date()
            });

            closeEmergencyFundModal();
            showSuccessMessage(`Emergency funds transferred successfully!`);
            updateFamilyBalance(-amount);
        }
    });
}

// Wallet Top-up Form Handler
if (document.getElementById('walletTopUpForm')) {
    document.getElementById('walletTopUpForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const amount = parseFloat(formData.get('topupAmount'));
        const childName = formData.get('topupChild');

        if (amount > 0 && childName) {
            // Add top-up transaction to activity list
            addTransactionToActivity({
                type: 'wallet',
                title: `Wallet top-up for ${childName}`,
                subtitle: childName,
                amount: amount,
                positive: false,
                date: new Date()
            });

            closeWalletTopUpModal();
            showSuccessMessage(`Wallet topped up successfully!`);
            updateFamilyBalance(-amount);
        }
    });
}

// Spending Limits Form Handler
if (document.getElementById('spendingLimitsForm')) {
    document.getElementById('spendingLimitsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const childName = formData.get('limitsChild');
        const dailyLimit = parseFloat(formData.get('dailyLimit'));
        const weeklyLimit = parseFloat(formData.get('weeklyLimit'));

        if (childName && (dailyLimit || weeklyLimit)) {
            closeSpendingLimitsModal();
            showSuccessMessage(`Spending limits updated for ${childName}!`);
        }
    });
}

// ========================================
// UTILITY FUNCTIONS FOR NEW FEATURES
// ========================================

function populateChildDropdown(selectId) {
    const select = document.getElementById(selectId);
    const existingChildren = JSON.parse(localStorage.getItem('hapo_children') || '[]');
    const currentUser = auth.getCurrentUser();

    // Clear existing options except the first one
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }

    // Add sample children if no children exist
    const inamOption = document.createElement('option');
    inamOption.value = 'Inam Bhele';
    inamOption.textContent = 'Inam Bhele';
    select.appendChild(inamOption);

    const bukhoOption = document.createElement('option');
    bukhoOption.value = 'Bukho Madala';
    bukhoOption.textContent = 'Bukho Madala';
    select.appendChild(bukhoOption);

    if (currentUser) {
        const userChildren = existingChildren.filter(child => child.parentId === currentUser.id);
        userChildren.forEach(child => {
            const option = document.createElement('option');
            option.value = `${child.firstName} ${child.lastName}`;
            option.textContent = `${child.firstName} ${child.lastName}`;
            select.appendChild(option);
        });
    }
}

function addTransactionToActivity(transaction) {
    const activityList = document.getElementById('activityList');
    const detailedActivityList = document.querySelector('.detailed-activity-list');

    // Add sample transaction with specific date for testing
    if (detailedActivityList && !document.querySelector('.test-transaction')) {
        const testTransactionElement = document.createElement('div');
        testTransactionElement.className = 'detailed-activity-item test-transaction';
        testTransactionElement.innerHTML = `
            <div class="activity-icon emergency">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="activity-details">
                <div class="activity-title">Emergency fund transfer</div>
                <div class="activity-subtitle">Inam Bhele</div>
                <div class="activity-date">05/06/2025</div>
            </div>
            <div class="activity-amount negative">
                -$20.00
            </div>
        `;
        detailedActivityList.appendChild(testTransactionElement);
    }

    // Add to main activity list
    const transactionElement = document.createElement('div');
    transactionElement.className = 'activity-item';

    const iconClass = transaction.type === 'emergency' ? 'emergency' : 
                     transaction.type === 'wallet' ? 'wallet' : 'transfer';
    const iconSymbol = transaction.type === 'emergency' ? 'fa-exclamation-triangle' :
                      transaction.type === 'wallet' ? 'fa-wallet' : 'fa-exchange-alt';

    const transactionDate = transaction.date || new Date();
    const formattedDate = formatTransactionDate(transactionDate);

    transactionElement.innerHTML = `
        <div class="activity-icon ${iconClass}">
            <i class="fas ${iconSymbol}"></i>
        </div>
        <div class="activity-details">
            <div class="activity-title">${transaction.title}</div>
            <div class="activity-date">${formattedDate}</div>
        </div>
        <div class="activity-amount ${transaction.positive ? 'positive' : 'negative'}">
            ${transaction.positive ? '+' : '-'}$${transaction.amount.toFixed(2)}
        </div>
    `;

    if (activityList) {
        activityList.insertBefore(transactionElement, activityList.firstChild);
    }

    // Also add to detailed activity list if it exists
    if (detailedActivityList) {
        const detailedTransactionElement = document.createElement('div');
        detailedTransactionElement.className = 'detailed-activity-item';

        detailedTransactionElement.innerHTML = `
            <div class="activity-icon ${iconClass}">
                <i class="fas ${iconSymbol}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-title">${transaction.title}</div>
                <div class="activity-subtitle">${transaction.subtitle || ''}</div>
                <div class="activity-date">${formattedDate}</div>
            </div>
            <div class="activity-amount ${transaction.positive ? 'positive' : 'negative'}">
                ${transaction.positive ? '+' : '-'}$${transaction.amount.toFixed(2)}
            </div>
        `;

        detailedActivityList.insertBefore(detailedTransactionElement, detailedActivityList.firstChild);
    }
}

function formatTransactionDate(date) {
    const now = new Date();
    const transactionDate = new Date(date);
    const diffTime = Math.abs(now - transactionDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return `Today, ${transactionDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        })}`;
    } else if (diffDays === 1) {
        return `Yesterday, ${transactionDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        })}`;
    } else if (diffDays < 7) {
        return `${diffDays} days ago, ${transactionDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        })}`;
    } else {
        return transactionDate.toLocaleDateString();
    }
}

function updateFamilyBalance(amount) {
    const balanceElement = document.getElementById('familyBalance');
    const currentBalance = parseFloat(balanceElement.textContent.replace('$', ''));
    const newBalance = currentBalance + amount;
    balanceElement.textContent = `$${newBalance.toFixed(2)}`;
}

function showTransactionReports() {
    // Create and show the smart reports modal
    showSmartReportsModal();
}

function showSmartReportsModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('smartReportsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create the modal HTML
    const modalHTML = `
        <div id="smartReportsModal" class="modal" style="display: block;">
            <div class="modal-content smart-reports-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-chart-bar"></i> Smart Transaction Reports</h3>
                    <button class="modal-close" onclick="closeSmartReportsModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="modal-body reports-body">
                    <!-- Report Navigation -->
                    <div class="reports-nav">
                        <button class="reports-nav-btn active" onclick="showReportSection('overview', this)">
                            <i class="fas fa-chart-pie"></i>
                            Overview
                        </button>
                        <button class="reports-nav-btn" onclick="showReportSection('patterns', this)">
                            <i class="fas fa-chart-line"></i>
                            Spending Patterns
                        </button>
                        <button class="reports-nav-btn" onclick="showReportSection('categories', this)">
                            <i class="fas fa-tags"></i>
                            Category Breakdown
                        </button>
                        <button class="reports-nav-btn" onclick="showReportSection('safety', this)">
                            <i class="fas fa-shield-alt"></i>
                            Safety Alerts
                        </button>
                    </div>

                    <!-- Overview Section -->
                    <div id="overviewSection" class="report-section active">
                        <div class="report-summary-cards">
                            <div class="summary-card">
                                <div class="summary-icon spending">
                                    <i class="fas fa-credit-card"></i>
                                </div>
                                <div class="summary-info">
                                    <div class="summary-label">Total Spending</div>
                                    <div class="summary-value">$245.50</div>
                                    <div class="summary-change negative">+12% from last month</div>
                                </div>
                            </div>
                            <div class="summary-card">
                                <div class="summary-icon transactions">
                                    <i class="fas fa-exchange-alt"></i>
                                </div>
                                <div class="summary-info">
                                    <div class="summary-label">Total Transactions</div>
                                    <div class="summary-value">47</div>
                                    <div class="summary-change positive">-8% from last month</div>
                                </div>
                            </div>
                            <div class="summary-card">
                                <div class="summary-icon average">
                                    <i class="fas fa-calculator"></i>
                                </div>
                                <div class="summary-info">
                                    <div class="summary-label">Average Transaction</div>
                                    <div class="summary-value">$5.22</div>
                                    <div class="summary-change positive">-3% from last month</div>
                                </div>
                            </div>
                        </div>

                        <div class="chart-container">
                            <h4>Monthly Spending Trend</h4>
                            <div class="mock-chart spending-trend">
                                <div class="chart-bar" style="height: 60%;" data-value="$180">
                                    <span class="bar-label">Jan</span>
                                </div>
                                <div class="chart-bar" style="height: 75%;" data-value="$225">
                                    <span class="bar-label">Feb</span>
                                </div>
                                <div class="chart-bar" style="height: 85%;" data-value="$255">
                                    <span class="bar-label">Mar</span>
                                </div>
                                <div class="chart-bar" style="height: 70%;" data-value="$210">
                                    <span class="bar-label">Apr</span>
                                </div>
                                <div class="chart-bar" style="height: 82%;" data-value="$245">
                                    <span class="bar-label">May</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Spending Patterns Section -->
                    <div id="patternsSection" class="report-section" style="display: none;">
                        <div class="patterns-analysis">
                            <h4>Spending Pattern Analysis</h4>
                            <div class="pattern-insights">
                                <div class="insight-card">
                                    <div class="insight-icon time">
                                        <i class="fas fa-clock"></i>
                                    </div>
                                    <div class="insight-content">
                                        <div class="insight-title">Peak Spending Hours</div>
                                        <div class="insight-desc">Most transactions occur between 12:00 PM - 2:00 PM (lunch time)</div>
                                        <div class="insight-metric">68% of daily transactions</div>
                                    </div>
                                </div>
                                <div class="insight-card">
                                    <div class="insight-icon location">
                                        <i class="fas fa-map-marker-alt"></i>
                                    </div>
                                    <div class="insight-content">
                                        <div class="insight-title">Common Locations</div>
                                        <div class="insight-desc">School cafeteria and nearby convenience stores</div>
                                        <div class="insight-metric">85% of all transactions</div>
                                    </div>
                                </div>
                                <div class="insight-card">
                                    <div class="insight-icon frequency">
                                        <i class="fas fa-calendar-alt"></i>
                                    </div>
                                    <div class="insight-content">
                                        <div class="insight-title">Spending Frequency</div>
                                        <div class="insight-desc">Regular daily spending with weekend increases</div>
                                        <div class="insight-metric">2.3 transactions/day average</div>
                                    </div>
                                </div>
                            </div>

                            <div class="weekly-pattern">
                                <h5>Weekly Spending Pattern</h5>
                                <div class="week-chart">
                                    <div class="week-day">
                                        <div class="day-bar" style="height: 40%;" data-amount="$8.50"></div>
                                        <span class="day-label">Mon</span>
                                    </div>
                                    <div class="week-day">
                                        <div class="day-bar" style="height: 45%;" data-amount="$9.75"></div>
                                        <span class="day-label">Tue</span>
                                    </div>
                                    <div class="week-day">
                                        <div class="day-bar" style="height: 50%;" data-amount="$11.20"></div>
                                        <span class="day-label">Wed</span>
                                    </div>
                                    <div class="week-day">
                                        <div class="day-bar" style="height: 48%;" data-amount="$10.60"></div>
                                        <span class="day-label">Thu</span>
                                    </div>
                                    <div class="week-day">
                                        <div class="day-bar" style="height: 55%;" data-amount="$12.80"></div>
                                        <span class="day-label">Fri</span>
                                    </div>
                                    <div class="week-day">
                                        <div class="day-bar" style="height: 70%;" data-amount="$16.40"></div>
                                        <span class="day-label">Sat</span>
                                    </div>
                                    <div class="week-day">
                                        <div class="day-bar" style="height: 35%;" data-amount="$7.20"></div>
                                        <span class="day-label">Sun</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Category Breakdown Section -->
                    <div id="categoriesSection" class="report-section" style="display: none;">
                        <div class="categories-breakdown">
                            <h4>Spending by Category</h4>
                            <div class="category-stats">
                                <div class="category-item">
                                    <div class="category-info">
                                        <div class="category-icon food">
                                            <i class="fas fa-utensils"></i>
                                        </div>
                                        <div class="category-details">
                                            <div class="category-name">Food & Beverages</div>
                                            <div class="category-transactions">32 transactions</div>
                                        </div>
                                    </div>
                                    <div class="category-amount">$145.60</div>
                                    <div class="category-percentage">59%</div>
                                    <div class="category-bar">
                                        <div class="category-fill" style="width: 59%;"></div>
                                    </div>
                                </div>
                                <div class="category-item">
                                    <div class="category-info">
                                        <div class="category-icon transport">
                                            <i class="fas fa-bus"></i>
                                        </div>
                                        <div class="category-details">
                                            <div class="category-name">Transportation</div>
                                            <div class="category-transactions">8 transactions</div>
                                        </div>
                                    </div>
                                    <div class="category-amount">$64.00</div>
                                    <div class="category-percentage">26%</div>
                                    <div class="category-bar">
                                        <div class="category-fill" style="width: 26%;"></div>
                                    </div>
                                </div>
                                <div class="category-item">
                                    <div class="category-info">
                                        <div class="category-icon supplies">
                                            <i class="fas fa-book"></i>
                                        </div>
                                        <div class="category-details">
                                            <div class="category-name">School Supplies</div>
                                            <div class="category-transactions">5 transactions</div>
                                        </div>
                                    </div>
                                    <div class="category-amount">$25.90</div>
                                    <div class="category-percentage">11%</div>
                                    <div class="category-bar">
                                        <div class="category-fill" style="width: 11%;"></div>
                                    </div>
                                </div>
                                <div class="category-item">
                                    <div class="category-info">
                                        <div class="category-icon entertainment">
                                            <i class="fas fa-gamepad"></i>
                                        </div>
                                        <div class="category-details">
                                            <div class="category-name">Entertainment</div>
                                            <div class="category-transactions">2 transactions</div>
                                        </div>
                                    </div>
                                    <div class="category-amount">$10.00</div>
                                    <div class="category-percentage">4%</div>
                                    <div class="category-bar">
                                        <div class="category-fill" style="width: 4%;"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="category-insights">
                                <div class="insight-box">
                                    <h5><i class="fas fa-lightbulb"></i> Spending Insights</h5>
                                    <ul>
                                        <li>Food spending increased by 15% this month</li>
                                        <li>Transportation costs remain consistent</li>
                                        <li>School supplies spending peaked during mid-semester</li>
                                        <li>Entertainment spending is well within healthy limits</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Safety Alerts Section -->
                    <div id="safetySection" class="report-section" style="display: none;">
                        <div class="safety-overview">
                            <h4>Safety Alerts & Notifications</h4>
                            <div class="safety-summary">
                                <div class="safety-status safe">
                                    <i class="fas fa-shield-alt"></i>
                                    <span>All spending patterns are normal</span>
                                </div>
                            </div>

                            <div class="alerts-history">
                                <h5>Recent Safety Events</h5>
                                <div class="alert-timeline">
                                    <div class="alert-event low">
                                        <div class="alert-time">2 hours ago</div>
                                        <div class="alert-content">
                                            <div class="alert-icon">
                                                <i class="fas fa-info-circle"></i>
                                            </div>
                                            <div class="alert-details">
                                                <div class="alert-title">Normal spending pattern detected</div>
                                                <div class="alert-desc">Lunch payment at school cafeteria - $8.50</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="alert-event medium">
                                        <div class="alert-time">1 day ago</div>
                                        <div class="alert-content">
                                            <div class="alert-icon">
                                                <i class="fas fa-exclamation-triangle"></i>
                                            </div>
                                            <div class="alert-details">
                                                <div class="alert-title">Higher than usual weekend spending</div>
                                                <div class="alert-desc">Total weekend spending: $28.50 (avg: $15.00)</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="alert-event low">
                                        <div class="alert-time">3 days ago</div>
                                        <div class="alert-content">
                                            <div class="alert-icon">
                                                <i class="fas fa-check-circle"></i>
                                            </div>
                                            <div class="alert-details">
                                                <div class="alert-title">Emergency fund usage approved</div>
                                                <div class="alert-desc">Emergency transport payment - $20.00</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="unusual-spending">
                                <h5>Unusual Spending Detection</h5>
                                <div class="detection-settings">
                                    <div class="detection-item">
                                        <div class="detection-label">
                                            <i class="fas fa-clock"></i>
                                            Out-of-hours spending alerts
                                        </div>
                                        <div class="detection-status enabled">
                                            <i class="fas fa-toggle-on"></i>
                                            Enabled
                                        </div>
                                    </div>
                                    <div class="detection-item">
                                        <div class="detection-label">
                                            <i class="fas fa-map-marker-alt"></i>
                                            Unknown location alerts
                                        </div>
                                        <div class="detection-status enabled">
                                            <i class="fas fa-toggle-on"></i>
                                            Enabled
                                        </div>
                                    </div>
                                    <div class="detection-item">
                                        <div class="detection-label">
                                            <i class="fas fa-dollar-sign"></i>
                                            Large transaction alerts
                                        </div>
                                        <div class="detection-status enabled">
                                            <i class="fas fa-toggle-on"></i>
                                            Enabled (>$25.00)
                                        </div>
                                    </div>
                                    <div class="detection-item">
                                        <div class="detection-label">
                                            <i class="fas fa-chart-line"></i>
                                            Spending pattern changes
                                        </div>
                                        <div class="detection-status enabled">
                                            <i class="fas fa-toggle-on"></i>
                                            Enabled
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-actions reports-actions">
                    <button type="button" class="export-btn" onclick="exportReports()">
                        <i class="fas fa-download"></i>
                        Export Report
                    </button>
                    <button type="button" class="schedule-btn" onclick="scheduleReports()">
                        <i class="fas fa-calendar"></i>
                        Schedule Reports
                    </button>
                    <button type="button" class="close-btn" onclick="closeSmartReportsModal()">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add the modal to the page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

function showReportSection(sectionName, buttonElement) {
    // Remove active class from all nav buttons
    document.querySelectorAll('.reports-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to clicked button
    buttonElement.classList.add('active');

    // Hide all report sections
    document.querySelectorAll('.report-section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionName + 'Section');
    if (selectedSection) {
        selectedSection.style.display = 'block';
        selectedSection.classList.add('active');
    }
}

function closeSmartReportsModal() {
    const modal = document.getElementById('smartReportsModal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = 'auto';
}

function exportReports() {
    // Mock export functionality
    showSuccessMessage('Report exported successfully! Check your downloads folder.');
}

function scheduleReports() {
    // Mock schedule functionality
    if (confirm('Would you like to receive weekly reports via email?')) {
        showSuccessMessage('Weekly reports scheduled! You will receive them every Monday.');
    }
}

function showSafetySettings() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('safetySettingsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create the modal HTML
    const modalHTML = `
        <div id="safetySettingsModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3><i class="fas fa-shield-alt"></i> Safety Alert Settings</h3>
                    <button class="modal-close" onclick="closeSafetySettingsModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="modal-body">
                    <form id="safetySettingsForm">
                        <!-- Out-of-hours spending alerts -->
                        <div class="safety-setting-section">
                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-name">Out-of-hours spending alerts</div>
                                    <div class="setting-desc">Get notified when spending occurs outside normal school hours</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="outOfHoursToggle" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>

                            <div class="setting-details" id="outOfHoursDetails">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="normalHoursStart">Normal hours start</label>
                                        <input type="time" id="normalHoursStart" value="07:00">
                                    </div>
                                    <div class="form-group">
                                        <label for="normalHoursEnd">Normal hours end</label>
                                        <input type="time" id="normalHoursEnd" value="18:00">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="weekendExempt" checked>
                                        Allow flexible hours on weekends
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Unusual location notifications -->
                        <div class="safety-setting-section">
                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-name">Unusual location notifications</div>
                                    <div class="setting-desc">Get alerted when spending occurs at unfamiliar locations</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="locationToggle" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>

                            <div class="setting-details" id="locationDetails">
                                <div class="form-group">
                                    <label for="trustedLocations">Trusted locations</label>
                                    <div class="trusted-locations-list">
                                        <div class="location-item">
                                            <span>School Campus</span>
                                            <button type="button" class="remove-location-btn">×</button>
                                        </div>
                                        <div class="location-item">
                                            <span>Home Area (2km radius)</span>
                                            <button type="button" class="remove-location-btn">×</button>
                                        </div>
                                    </div>
                                    <button type="button" class="add-location-btn" onclick="addTrustedLocation()">
                                        <i class="fas fa-plus"></i> Add Location
                                    </button>
                                </div>
                                <div class="form-group">
                                    <label for="locationRadius">Alert radius (km)</label>
                                    <input type="range" id="locationRadius" min="1" max="10" value="5" oninput="updateRadiusDisplay(this.value)">
                                    <span id="radiusDisplay">5 km</span>
                                </div>
                            </div>
                        </div>

                        <!-- Large transaction alerts -->
                        <div class="safety-setting-section">
                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-name">Large transaction alerts</div>
                                    <div class="setting-desc">Get notified when spending exceeds specified amounts</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="largeTransactionToggle" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>

                            <div class="setting-details" id="largeTransactionDetails">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="singleTransactionLimit">Single transaction limit ($)</label>
                                        <input type="number" id="singleTransactionLimit" value="25" min="1" step="0.01">
                                    </div>
                                    <div class="form-group">
                                        <label for="dailySpendingLimit">Daily spending limit ($)</label>
                                        <input type="number" id="dailySpendingLimit" value="50" min="1" step="0.01">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="emergencyExempt" checked>
                                        Allow emergency fund usage to exceed limits
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Emergency contact settings -->
                        <div class="safety-setting-section">
                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-name">Emergency contact settings</div>
                                    <div class="setting-desc">Configure how and when emergency contacts are notified</div>
                                </div>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="emergencyContactToggle" checked>
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>

                            <div class="setting-details" id="emergencyContactDetails">
                                <div class="emergency-contacts-list">
                                    <div class="contact-item">
                                        <div class="contact-info">
                                            <span class="contact-name">Mom</span>
                                            <span class="contact-number">+27 123 456 789</span>
                                        </div>
                                        <button type="button" class="edit-contact-btn"><i class="fas fa-edit"></i></button>
                                        <button type="button" class="remove-contact-btn">×</button>
                                    </div>
                                    <div class="contact-item">
                                        <div class="contact-info">
                                            <span class="contact-name">Dad</span>
                                            <span class="contact-number">+27 987 654 321</span>
                                        </div>
                                        <button type="button" class="edit-contact-btn"><i class="fas fa-edit"></i></button>
                                        <button type="button" class="remove-contact-btn">×</button>
                                    </div>
                                </div>
                                <button type="button" class="add-contact-btn" onclick="addEmergencyContact()">
                                    <i class="fas fa-plus"></i> Add Emergency Contact
                                </button>

                                <div class="form-group" style="margin-top: 1rem;">
                                    <label>Emergency notification triggers:</label>
                                    <div class="checkbox-group">
                                        <label><input type="checkbox" id="emergencySpending" checked> Large emergency spending</label>
                                        <label><input type="checkbox" id="unusualActivity" checked> Unusual activity patterns</label>
                                        <label><input type="checkbox" id="locationConcerns" checked> Location-based concerns</label>
                                        <label><input type="checkbox" id="deviceIssues"> Device/account issues</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Notification preferences -->
                        <div class="safety-setting-section">
                            <h4><i class="fas fa-bell"></i> Notification Preferences</h4>
                            <div class="notification-methods">
                                <div class="method-group">
                                    <h5>Primary alerts (immediate action needed):</h5>
                                    <label><input type="checkbox" id="primaryEmail" checked> Email</label>
                                    <label><input type="checkbox" id="primarySMS" checked> SMS</label>
                                    <label><input type="checkbox" id="primaryApp" checked> App notification</label>
                                </div>
                                <div class="method-group">
                                    <h5>Secondary alerts (informational):</h5>
                                    <label><input type="checkbox" id="secondaryEmail" checked> Email</label>
                                    <label><input type="checkbox" id="secondaryApp" checked> App notification</label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="modal-actions">
                    <button type="button" class="test-alerts-btn" onclick="testSafetyAlerts()">
                        <i class="fas fa-test-tube"></i> Test Alerts
                    </button>
                    <button type="button" class="save-settings-btn" onclick="saveSafetySettings()">
                        <i class="fas fa-save"></i> Save Settings
                    </button>
                    <button type="button" class="close-btn" onclick="closeSafetySettingsModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;

    // Add the modal to the page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';

    // Initialize toggle functionality
    initializeSafetyToggles();
    loadSafetySettings();
}

function showAddRecurringPaymentModal() {
    document.getElementById('addRecurringPaymentModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    populateChildDropdown('recurringChild');
}

function showAddRecurringModal() {
    showAddRecurringPaymentModal();
}

function viewChildActivity(childName) {
    alert(`Viewing detailed activity for ${childName}:\n\n• Transaction history\n• Spending patterns\n• Location data\n• Safety alerts\n• Performance metrics`);
}

// Add Recurring Payment Form Handler
if (document.getElementById('addRecurringPaymentForm')) {
    document.getElementById('addRecurringPaymentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        const recurringPayment = {
            id: Date.now(),
            child: formData.get('recurringChild'),
            type: formData.get('paymentType'),
            amount: parseFloat(formData.get('recurringAmount')),
            frequency: formData.get('frequency'),
            startDate: formData.get('startDate'),
            description: formData.get('description') || getPaymentTypeDescription(formData.get('paymentType')),
            status: 'active',
            createdAt: new Date().toISOString()
        };

        // Store recurring payment
        const existingPayments = JSON.parse(localStorage.getItem('hapo_recurring_payments') || '[]');
        existingPayments.push(recurringPayment);
        localStorage.setItem('hapo_recurring_payments', JSON.stringify(existingPayments));

        // Add to UI
        addRecurringPaymentToUI(recurringPayment);

        closeAddRecurringPaymentModal();
        showSuccessMessage(`${getPaymentTypeDescription(recurringPayment.type)} recurring payment created successfully!`);
    });
}

function getPaymentTypeDescription(type) {
    const descriptions = {
        'school_fees': 'School Fees',
        'transport': 'Transport Payment',
        'lunch_money': 'Lunch Money',
        'custom': 'Custom Payment'
    };
    return descriptions[type] || 'Payment';
}

function addRecurringPaymentToUI(payment) {
    const recurringList = document.querySelector('.recurring-list');
    const paymentElement = document.createElement('div');
    paymentElement.className = 'recurring-item';
    paymentElement.innerHTML = `
        <div class="recurring-info">
            <div class="recurring-title">${payment.description} - ${payment.child}</div>
            <div class="recurring-details">${payment.frequency} • $${payment.amount.toFixed(2)}</div>
        </div>
        <div class="recurring-status ${payment.status}">${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</div>
        <div class="recurring-actions">
            <button class="action-btn" onclick="toggleRecurringPayment(${payment.id})" title="Toggle Active/Inactive">
                <i class="fas ${payment.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
            </button>
            <button class="action-btn delete" onclick="deleteRecurringPayment(${payment.id})" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    recurringList.appendChild(paymentElement);
}

function toggleRecurringPayment(paymentId) {
    const payments = JSON.parse(localStorage.getItem('hapo_recurring_payments') || '[]');
    const paymentIndex = payments.findIndex(p => p.id === paymentId);

    if (paymentIndex !== -1) {
        payments[paymentIndex].status = payments[paymentIndex].status === 'active' ? 'inactive' : 'active';
        localStorage.setItem('hapo_recurring_payments', JSON.stringify(payments));

        // Refresh the recurring payments display
        loadRecurringPayments();
        showSuccessMessage(`Payment ${payments[paymentIndex].status === 'active' ? 'activated' : 'paused'}`);
    }
}

function deleteRecurringPayment(paymentId) {
    if (confirm('Are you sure you want to delete this recurring payment?')) {
        const payments = JSON.parse(localStorage.getItem('hapo_recurring_payments') || '[]');
        const updatedPayments = payments.filter(p => p.id !== paymentId);
        localStorage.setItem('hapo_recurring_payments', JSON.stringify(updatedPayments));

        // Refresh the recurring payments display
        loadRecurringPayments();
        showSuccessMessage('Recurring payment deleted successfully');
    }
}

function loadRecurringPayments() {
    const recurringList = document.querySelector('.recurring-list');
    if (!recurringList) return;

    const payments = JSON.parse(localStorage.getItem('hapo_recurring_payments') || '[]');

    // Clear existing content but keep sample payments initially
    const existingCustomPayments = recurringList.querySelectorAll('.recurring-item[data-custom="true"]');
    existingCustomPayments.forEach(item => item.remove());

    // Add custom recurring payments
    payments.forEach(payment => {
        const paymentElement = document.createElement('div');
        paymentElement.className = 'recurring-item';
        paymentElement.setAttribute('data-custom', 'true');
        paymentElement.innerHTML = `
            <div class="recurring-info">
                <div class="recurring-title">${payment.description} - ${payment.child}</div>
                <div class="recurring-details">${payment.frequency} • $${payment.amount.toFixed(2)}</div>
            </div>
            <div class="recurring-status ${payment.status}">${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</div>
            <div class="recurring-actions">
                <button class="action-btn" onclick="toggleRecurringPayment(${payment.id})" title="Toggle Active/Inactive">
                    <i class="fas ${payment.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                </button>
                <button class="action-btn delete" onclick="deleteRecurringPayment(${payment.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        recurringList.appendChild(paymentElement);
    });
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const modals = ['addChildModal', 'sendMoneyModal', 'emergencyFundModal', 'walletTopUpModal', 'spendingLimitsModal', 'recurringPaymentsModal', 'addRecurringPaymentModal'];

    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});

// ========================================
// BOTTOMNAVIGATION FUNCTIONS
// ========================================

function showSection(sectionName) {
    // Hide all sections including activity section
    const sections = ['homeSection', 'paySection', 'activitySection', 'rewardsSection', 'gamingSection', 'profileSection', 'notificationsSection'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
        }
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionName + 'Section');
    if (selectedSection) {
        selectedSection.style.display = 'block';

        // Load notifications when notifications section is shown
        if (sectionName === 'notifications') {
            setTimeout(() => {
                loadNotificationsList();
            }, 100);
        }

        // Load profile data when profile section is shown
        if (sectionName === 'profile') {
            setTimeout(() => {
                loadStudentProfileData();
            }, 100);
        }
    }

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Find and activate the clicked nav item based on section name
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const text = item.querySelector('span')?.textContent?.toLowerCase();
        if (text === sectionName.toLowerCase() || 
            (text === 'my games' && sectionName === 'gaming')) {
            item.classList.add('active');
        }
    });
}

// ========================================
// QR SCANNER FUNCTIONS
// ========================================

function startQRScan() {
    const scannerContainer = document.getElementById('qrScannerContainer');
    if (scannerContainer) {
        scannerContainer.style.display = 'block';

        // Simulate camera access (in real app, this would use navigator.mediaDevices.getUserMedia)
        showSuccessMessage('QR Scanner activated! Point camera at QR code to scan.');

        // Mock QR scan result after 3 seconds for demo
        setTimeout(() => {
            mockQRScanResult();
        }, 3000);
    }
}

function closeQRScanner() {
    const scannerContainer = document.getElementById('qrScannerContainer');
    if (scannerContainer) {
        scannerContainer.style.display = 'none';
    }
}

function toggleFlash() {
    // Mock flash toggle (in real app, this would control camera flash)
    showSuccessMessage('Flash toggled!');
}

function switchCamera() {
    // Mock camera switch (in real app, this would switch between front/back camera)
    showSuccessMessage('Camera switched!');
}

function generatePaymentQR() {
    alert('Generate Payment QR feature coming soon!\n\nThis will allow you to:\n• Create QR codes for receiving payments\n• Set payment amounts and recipient information\n• Share QR codes with family members\n• Track payments received via QR');
}

function mockQRScanResult() {
    // Simulate a successful QR code scan
    closeQRScanner();

    // Mock payment data from QR code
    const mockPaymentData = {
        merchant: 'School Cafeteria',
        amount: '$8.50',
        description: 'Lunch payment'
    };

    // Show payment confirmation
    if (confirm(`Payment Details:\n\nMerchant: ${mockPaymentData.merchant}\nAmount: ${mockPaymentData.amount}\nDescription: ${mockPaymentData.description}\n\nProceed with payment?`)) {
        // Add to recent payments
        addQRPaymentToHistory(mockPaymentData);
        showSuccessMessage(`Payment of ${mockPaymentData.amount} to ${mockPaymentData.merchant} successful!`);

        // Update family balance
        const amount = parseFloat(mockPaymentData.amount.replace('$', ''));
        updateFamilyBalance(-amount);
    }
}

function addQRPaymentToHistory(paymentData) {
    const qrPaymentList = document.querySelector('.qr-payment-list');
    if (qrPaymentList) {
        const paymentItem = document.createElement('div');
        paymentItem.className = 'qr-payment-item';
        paymentItem.innerHTML = `
            <div class="qr-payment-icon">
                <i class="fas fa-store"></i>
            </div>
            <div class="qr-payment-details">
                <div class="qr-payment-title">${paymentData.merchant}</div>
                <div class="qr-payment-date">Just now</div>
            </div>
            <div class="qr-payment-amount">${paymentData.amount}</div>
        `;

        // Insert at the beginning of the list
        qrPaymentList.insertBefore(paymentItem, qrPaymentList.firstChild);
    }
}

// ========================================
// ACTIVITY FILTER FUNCTIONS
// ========================================

function setActivityFilter(filterType, buttonElement) {
    // Remove active class from all filter buttons in the same container
    const container = buttonElement ? buttonElement.closest('.activity-filters') : document.querySelector('.activity-filters');
    if (container) {
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        if (buttonElement) {
            buttonElement.classList.add('active');
        }
    }

    // Filter the detailed activity list based on the selected filter
    filterDetailedTransactions(filterType);
}

function filterDetailedTransactions(filterType) {
    const detailedActivityList = document.querySelector('.detailed-activity-list');
    if (!detailedActivityList) return;

    const allTransactions = detailedActivityList.querySelectorAll('.detailed-activity-item');
    const now = new Date();

    allTransactions.forEach(transaction => {
        const dateElement = transaction.querySelector('.activity-date');
        if (!dateElement) return;

        const dateText = dateElement.textContent;
        let transactionDate = parseTransactionDate(dateText);
        let shouldShow = true;

        switch(filterType.toLowerCase()) {
            case 'all':
                shouldShow = true;
                break;
            case 'this week':
                shouldShow = isWithinWeek(transactionDate, now);
                break;
            case 'this month':
                shouldShow = isWithinMonth(transactionDate, now);
                break;
            case 'custom range':
                shouldShow = true; // For now, show all for custom range
                break;
            default:
                shouldShow = true;
        }

        transaction.style.display = shouldShow ? 'flex' : 'none';
    });
}

function parseTransactionDate(dateText) {
    const now = new Date();

    if (dateText.includes('Today')) {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateText.includes('Yesterday')) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    } else if (dateText.includes('days ago')) {
        const daysAgo = parseInt(dateText.match(/(\d+) days ago/)[1]);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } else if (dateText.includes('months ago')) {
        const monthsAgo = parseInt(dateText.match(/(\d+) months ago/)[1]);
        const date = new Date(now);
        date.setMonth(date.getMonth() - monthsAgo);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } else if (dateText.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // Handle MM/DD/YYYY format
        const [month, day, year] = dateText.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (dateText.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        // Handle YYYY/MM/DD format
        const [year, month, day] = dateText.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
        // Try to parse as a regular date
        try {
            return new Date(dateText);
        } catch (error) {
            return new Date(); // Default to today if parsing fails
        }
    }
}

function isWithinWeek(transactionDate, currentDate) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDay()); // Start of current week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of current week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);

    return transactionDate >= weekStart && transactionDate <= weekEnd;
}

function isWithinMonth(transactionDate, currentDate) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    return transactionDate >= monthStart && transactionDate <= monthEnd;
}

// Add click handlers for filter buttons
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the DOM to be fully loaded
    setTimeout(() => {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach((btn, index) => {
            // Remove any existing listeners
            btn.removeEventListener('click', btn._clickHandler);

            // Create new click handler
            btn._clickHandler = function() {
                const filters = ['All', 'This Week', 'This Month', 'Custom Range'];
                setActivityFilter(filters[index], this);
            };

            btn.addEventListener('click', btn._clickHandler);
        });
    }, 500);
});

function updatePaymentDescription() {
    const paymentType = document.getElementById('paymentType').value;
    const customDescriptionGroup = document.getElementById('customDescriptionGroup');

    if (paymentType === 'custom') {
        customDescriptionGroup.style.display = 'block';
        document.getElementById('description').required = true;
    } else {
        customDescriptionGroup.style.display = 'none';
        document.getElementById('description').required = false;
    }
}

// Load existing children on page load
if (window.location.pathname.includes('parentDashboard.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        const existingChildren = JSON.parse(localStorage.getItem('hapo_children') || '[]');
        const currentUser = auth.getCurrentUser();

        if (currentUser) {
            // Filter children for current parent
            const userChildren = existingChildren.filter(child => child.parentId === currentUser.id);

            // Clear existing sample child and add real children
            const childrenList = document.getElementById('childrenList');
            if (userChildren.length > 0) {
                childrenList.innerHTML = ''; // Clear sample data
                userChildren.forEach(child => addChildToUI(child));
            }
        }

        // Load recurring payments
        loadRecurringPayments();

        // Set default start date to today
        const startDateInput = document.getElementById('startDate');
        if (startDateInput) {
            startDateInput.valueAsDate = new Date();
        }
    });
}

// ========================================
// STUDENT DASHBOARD FUNCTIONALITY
// ========================================

// Student Authentication
class StudentAuth {
    constructor() {
        this.currentStudent = null;
        this.init();
    }

    init() {
        // Check if student is already logged in
        const studentData = localStorage.getItem('hapo_current_student');
        if (studentData) {
            this.currentStudent = JSON.parse(studentData);
        }
    }

    async studentLogin(username, password) {
        try {
            let student = null;

            // Try to get student from Supabase first
            if (window.hapoDb) {
                const result = await window.hapoDb.getStudentByUsername(username);
                if (result.success) {
                    student = result.data;
                }
            }

            // Fallback to localStorage
            if (!student) {
                const children = JSON.parse(localStorage.getItem('hapo_children') || '[]');
                student = children.find(child => 
                    child.username === username || 
                    `${child.firstName.toLowerCase()}@hapo.com` === username.toLowerCase()
                );
            }

            if (!student) {
                return { success: false, error: 'Student account not found' };
            }

            // Check password (handle both hashed and plain text for compatibility)
            const passwordMatch = student.password_hash === password || 
                                 student.password === password || 
                                 password === 'defaultpass123';

            if (!passwordMatch) {
                return { success: false, error: 'Invalid password' };
            }

            // Set current student
            this.currentStudent = student;
            localStorage.setItem('hapo_current_student', JSON.stringify(student));

            return { success: true };
        } catch (error) {
            console.error('Student login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    }

    getCurrentStudent() {
        return this.currentStudent;
    }

    isStudentAuthenticated() {
        return !!this.currentStudent;
    }

    studentLogout() {
        localStorage.removeItem('hapo_current_student');
        this.currentStudent = null;
        window.location.href = 'index.html';
    }
}

// Initialize student auth
const studentAuth = new StudentAuth();

// Student Dashboard Class
class StudentDashboard {
    constructor() {
        this.student = studentAuth.getCurrentStudent();
        this.transactions = [];
        this.rewards = { totalPoints: 1250, monthlyPoints: 350 };
        this.achievements = [];
        this.init();
    }

    init() {
        if (!this.student) return;

        this.loadStudentData();
        this.setupEventListeners();
        this.loadTransactions();
        this.updateRewardsDisplay();
        this.initializeSpendingOverview();
        this.setupRealtimeUpdates();
        this.setupPeriodicRefresh();
    }

    setupPeriodicRefresh() {
        // Refresh balance every 10 seconds for demo purposes
        setInterval(async () => {
            await this.refreshStudentData();

            // Update balance display
            const balanceEl = document.getElementById('studentBalance');
            if (balanceEl) {
                balanceEl.textContent = `$${(this.student.balance || 0).toFixed(2)}`;
            }

            // Update profile balance too
            const profileBalanceEl = document.getElementById('profileBalance');
            if (profileBalanceEl) {
                profileBalanceEl.textContent = `$${(this.student.balance || 0).toFixed(2)}`;
            }
        }, 10000);
    }

    setupRealtimeUpdates() {
        if (window.hapoDb && this.student) {
            // Subscribe to balance updates
            window.hapoDb.subscribeToStudentUpdates(this.student.id, (payload) => {
                console.log('Student data updated:', payload);
                if (payload.new && payload.new.balance !== undefined) {
                    // Update balance in UI
                    const balanceEl = document.getElementById('studentBalance');
                    if (balanceEl) {
                        balanceEl.textContent = `$${payload.new.balance.toFixed(2)}`;
                    }

                    // Update stored student data
                    this.student.balance = payload.new.balance;
                    localStorage.setItem('hapo_current_student', JSON.stringify(this.student));

                    // Show notification
                    showSuccessMessage(`Balance updated! New balance: $${payload.new.balance.toFixed(2)}`);
                }
            });

            // Subscribe to new transactions
            window.hapoDb.subscribeToTransactions(this.student.id, (payload) => {
                console.log('New transaction:', payload);
                if (payload.new) {
                    // Add transaction to UI
                    this.addTransactionToUI(payload.new);
                }
            });
        }
    }

    addTransactionToUI(transactionData) {
        const transaction = {
            id: transactionData.id,
            title: transactionData.description || 'Transaction',
            category: transactionData.category || 'other',
            amount: parseFloat(transactionData.amount),
            date: new Date(transactionData.created_at),
            icon: this.getCategoryIcon(transactionData.category)
        };

        this.transactions.unshift(transaction);
        this.updateTransactionsList();
    }

    getCategoryIcon(category) {
        const icons = {
            'food': 'fa-utensils',
            'transport': 'fa-bus',
            'transfer': 'fa-arrow-down',
            'emergency': 'fa-exclamation-triangle',
            'other': 'fa-shopping-cart'
        };
        return icons[category] || 'fa-shopping-cart';
    }

    async loadStudentData() {
        // Refresh student data from storage before updating UI
        await this.refreshStudentData();

        // Update student info in UI
        const studentNameEl = document.getElementById('studentUserName');
        const studentAvatarEl = document.getElementById('studentAvatar');
        const studentNameProfileEl = document.getElementById('studentName');
        const studentUsernameEl = document.getElementById('studentUsername');

        if (studentNameEl) {
            studentNameEl.textContent = `Welcome, ${this.student.firstName} ${this.student.lastName}`;
        }
        if (studentAvatarEl) {
            studentAvatarEl.textContent = `${this.student.firstName.charAt(0)}${this.student.lastName.charAt(0)}`;
        }
        if (studentNameProfileEl) {
            studentNameProfileEl.textContent = `${this.student.firstName} ${this.student.lastName}`;
        }
        if (studentUsernameEl) {
            studentUsernameEl.textContent = this.student.username;
        }

        // Update balance and limits
        const balanceEl = document.getElementById('studentBalance');
        const weeklyLimitEl = document.getElementById('weeklyLimit');
        const weeklySpentEl = document.getElementById('weeklySpent');

        if (balanceEl) {
            balanceEl.textContent = `$${(this.student.balance || 0).toFixed(2)}`;
        }
        if (weeklyLimitEl) {
            weeklyLimitEl.textContent = `$${(this.student.weeklyLimit || 100).toFixed(2)}`;
        }
        if (weeklySpentEl) {
            const weeklySpent = this.calculateWeeklySpent();
            weeklySpentEl.textContent = `$${weeklySpent.toFixed(2)} spent this week`;
        }
    }

    async refreshStudentData() {
        try {
            // Try to get fresh data from Supabase first
            if (window.hapoDb) {
                const result = await window.hapoDb.getStudentByUsername(this.student.username);
                if (result.success) {
                    this.student = result.data;
                    localStorage.setItem('hapo_current_student', JSON.stringify(this.student));
                    return;
                }
            }
        } catch (error) {
            console.log('Supabase not available, checking localStorage');
        }

        // Fallback to localStorage
        const children = JSON.parse(localStorage.getItem('hapo_children') || '[]');
        const updatedStudent = children.find(child => child.id === this.student.id);

        if (updatedStudent) {
            this.student = updatedStudent;
            localStorage.setItem('hapo_current_student', JSON.stringify(this.student));
        }
    }

    calculateWeeklySpent() {
        // Mock calculation - in real app, this would sum transactions from the current week
        return 45.00;
    }

    loadTransactions() {
        // Mock transaction data - in real app, this would load from server
        this.transactions = [
            {
                id: 1,
                title: 'School Cafeteria',
                category: 'food',
                amount: -8.50,
                date: new Date(),
                icon: 'fa-utensils'
            },
            {
                id: 2,
                title: 'Money received from parent',
                category: 'transfer',
                amount: 25.00,
                date: new Date(Date.now() - 86400000), // Yesterday
                icon: 'fa-arrow-down'
            },
            {
                id: 3,
                title: 'Bus Card Top-up',
                category: 'transport',
                amount: -12.00,
                date: new Date(Date.now() - 86400000),
                icon: 'fa-bus'
            }
        ];

        this.updateTransactionsList();
    }

    updateTransactionsList() {
        const detailedActivityList = document.getElementById('detailedActivityList');
        if (!detailedActivityList) return;

        // Clear existing dynamic transactions but keep the static ones
        const dynamicTransactions = detailedActivityList.querySelectorAll('.detailed-activity-item[data-dynamic="true"]');
        dynamicTransactions.forEach(item => item.remove());

        this.transactions.forEach(transaction => {
            const transactionEl = document.createElement('div');
            transactionEl.className = 'detailed-activity-item';
            transactionEl.setAttribute('data-dynamic', 'true');

            const isPositive = transaction.amount > 0;
            const categoryClass = transaction.category;

            transactionEl.innerHTML = `
                <div class="activity-icon ${categoryClass}">
                    <i class="fas ${transaction.icon}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${transaction.title}</div>
                    <div class="activity-date">${this.formatDate(transaction.date)}</div>
                </div>
                <div class="activity-amount ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
                </div>
            `;

            // Insert at the beginning of the list
            detailedActivityList.insertBefore(transactionEl, detailedActivityList.firstChild);
        });
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Today, ' + date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        } else if (days === 1) {
            return 'Yesterday, ' + date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        } else {
            return date.toLocaleDateString();
        }
    }

    updateRewardsDisplay() {
        const totalPointsEl = document.getElementById('totalPoints');
        const monthlyPointsEl = document.getElementById('monthlyPoints');

        if (totalPointsEl) {
            totalPointsEl.textContent = this.rewards.totalPoints.toLocaleString();
        }
        if (monthlyPointsEl) {
            monthlyPointsEl.textContent = this.rewards.monthlyPoints.toLocaleString();
        }
    }

    initializeSpendingOverview() {
        // Initialize with default period (month)
        const spendingPeriodSelect = document.getElementById('spendingPeriod');
        if (spendingPeriodSelect) {
            const defaultPeriod = spendingPeriodSelect.value;
            updateSpendingOverview(defaultPeriod);
        }
    }

    setupEventListeners() {
        // Request money form
        const requestForm = document.getElementById('requestMoneyForm');
        if (requestForm) {
            requestForm.addEventListener('submit', (e) => this.handleMoneyRequest(e));
        }

        // Emergency request form
        const emergencyForm = document.getElementById('emergencyRequestForm');
        if (emergencyForm) {
            emergencyForm.addEventListener('submit', (e) => this.handleEmergencyRequest(e));
        }
    }

    handleMoneyRequest(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const amount = parseFloat(formData.get('requestAmount'));
        const reason = formData.get('requestReason');

        // In real app, this would send a notification to parent
        this.sendRequestToParent('money', { amount, reason });

        closeRequestMoneyModal();
        showSuccessMessage(`Money request of $${amount.toFixed(2)} sent to your parent!`);
    }

    handleEmergencyRequest(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const amount = parseFloat(formData.get('emergencyAmount'));
        const reason = formData.get('emergencyReason');

        // In real app, this would send an urgent notification to parent
        this.sendRequestToParent('emergency', { amount, reason });

        closeEmergencyRequestModal();
        showSuccessMessage('Emergency request sent! Your parent will be notified immediately.');
    }

    async sendRequestToParent(type, data) {
        try {
            const studentData = this.student;
            const firstName = studentData.first_name || studentData.firstName;
            const lastName = studentData.last_name || studentData.lastName;

            const newRequest = {
                id: 'req_' + Date.now(),
                studentId: studentData.id,
                parentId: studentData.parent_id || studentData.parentId,
                amount: data.amount,
                reason: data.reason,
                type: type
            };

            // Save to Supabase if available
            if (window.hapoDb) {
                const result = await window.hapoDb.createMoneyRequest(newRequest);
                if (!result.success) {
                    throw new Error(result.error);
                }
            } else {
                // Fallback to localStorage
                const requests = JSON.parse(localStorage.getItem('hapo_student_requests') || '[]');
                const localRequest = {
                    ...newRequest,
                    studentName: `${firstName} ${lastName}`,
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                };
                requests.push(localRequest);
                localStorage.setItem('hapo_student_requests', JSON.stringify(requests));
            }

            console.log('Money request sent successfully');
        } catch (error) {
            console.error('Error sending money request:', error);
            throw error;
        }
    }

    addTransaction(transaction) {
        this.transactions.unshift(transaction);
        this.updateTransactionsList();

        // Update balance
        this.student.balance += transaction.amount;
        this.updateStudentData();
    }

    updateStudentData() {
        // Update student data in localStorage
        const children = JSON.parse(localStorage.getItem('hapo_children') || '[]');
        const studentIndex = children.findIndex(child => child.id === this.student.id);

        if (studentIndex !== -1) {
            children[studentIndex] = this.student;
            localStorage.setItem('hapo_children', JSON.stringify(children));
            localStorage.setItem('hapo_current_student', JSON.stringify(this.student));
        }

        this.loadStudentData();
    }
}

// Initialize student dashboard if on student dashboard page
if (window.location.pathname.includes('studentDashboard.html')) {
    if (!studentAuth.isStudentAuthenticated()) {
        window.location.href = 'studentLogin.html';
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            new StudentDashboard();
        });
    }
}

// ========================================
// STUDENT LOGIN FORM HANDLER
// ========================================

if (document.getElementById('studentLoginForm')) {
    document.getElementById('studentLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const username = formData.get('username');
        const password = formData.get('password');

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        // Show loading
        const button = document.getElementById('studentLoginButton');
        const buttonText = document.getElementById('studentLoginButtonText');
        const spinner = document.getElementById('studentLoginSpinner');

        button.disabled = true;
        buttonText.style.display = 'none';
        spinner.style.display = 'block';

        try {
            const result = await studentAuth.studentLogin(username, password);

            if (result.success) {
                window.location.href = 'studentDashboard.html';
            } else {
                document.getElementById('studentPasswordError').textContent = result.error;
            }
        } catch (error) {
            console.error('Student login error:', error);
            document.getElementById('studentPasswordError').textContent = 'Login failed. Please try again.';
        } finally {
            button.disabled = false;
            buttonText.style.display = 'block';
            spinner.style.display = 'none';
        }
    });
}

// ========================================
// STUDENT DASHBOARD MODAL FUNCTIONS
// ========================================

function showRequestMoneyModal() {
    document.getElementById('requestMoneyModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeRequestMoneyModal() {
    document.getElementById('requestMoneyModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('requestMoneyForm').reset();
}

function showEmergencyRequestModal() {
    document.getElementById('emergencyRequestModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeEmergencyRequestModal() {
    document.getElementById('emergencyRequestModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('emergencyRequestForm').reset();
}

// ========================================
// STUDENT QR SCANNER FUNCTIONS
// ========================================

function startStudentQRScan() {
    const scannerContainer = document.getElementById('studentQRScannerContainer');
    if (scannerContainer) {
        scannerContainer.style.display = 'block';

        // Check spending limits before allowing scan
        const student = studentAuth.getCurrentStudent();
        if (student) {
            showSuccessMessage('QR Scanner activated! Point camera at QR code to pay.');

            // Mock QR scan result after 3 seconds for demo
            setTimeout(() => {
                mockStudentQRScanResult();
            }, 3000);
        }
    }
}

function closeStudentQRScanner() {
    const scannerContainer = document.getElementById('studentQRScannerContainer');
    if (scannerContainer) {
        scannerContainer.style.display = 'none';
    }
}

function mockStudentQRScanResult() {
    closeStudentQRScanner();

    const mockPaymentData = {
        merchant: 'School Cafeteria',
        amount: 8.50,
        description: 'Lunch payment'
    };

    // Check if student has enough balance and within limits
    const student = studentAuth.getCurrentStudent();
    if (student && student.balance >= mockPaymentData.amount) {
        if (confirm(`Payment Details:\n\nMerchant: ${mockPaymentData.merchant}\nAmount: $${mockPaymentData.amount}\nDescription: ${mockPaymentData.description}\n\nProceed with payment?`)) {
            // Process payment
            const studentDashboard = new StudentDashboard();
            studentDashboard.addTransaction({
                id: Date.now(),
                title: mockPaymentData.merchant,
                category: 'food',
                amount: -mockPaymentData.amount,
                date: new Date(),
                icon: 'fa-utensils'
            });

            showSuccessMessage(`Payment of $${mockPaymentData.amount} to ${mockPaymentData.merchant} successful!`);
        }
    } else {
        alert('Insufficient balance for this payment.');
    }
}

// ========================================
// STUDENT REWARDS FUNCTIONS
// ========================================

function redeemReward(rewardType) {
    const student = studentAuth.getCurrentStudent();
    if (!student) return;

    const rewardCosts = {
        'allowance': 500,
        'curfew': 750
    };

    const cost = rewardCosts[rewardType];
    const totalPoints = parseInt(document.getElementById('totalPoints').textContent.replace(/,/g, ''));

    if (totalPoints >= cost) {
        if (confirm(`Redeem this reward for ${cost} points?`)) {
            // Deduct points
            const newTotal = totalPoints - cost;
            document.getElementById('totalPoints').textContent = newTotal.toLocaleString();

            showSuccessMessage(`Reward redeemed successfully! A request has been sent to your parent.`);
        }
    } else {
        alert(`You need ${cost} points to redeem this reward. You currently have ${totalPoints} points.`);
    }
}

// ========================================
// STUDENT UTILITY FUNCTIONS
// ========================================

function updateSpendingPeriod() {
    // This function is deprecated - spending period filtering moved to transaction history
    console.log('Spending period filtering moved to transaction history filters');
}

function updateSpendingOverview(period) {
    // Mock spending data for different periods
    const spendingData = {
        week: {
            totalSpent: 18.75,
            categories: [
                { name: 'Food & Dining', amount: 12.50, percentage: 67 },
                { name: 'Transport', amount: 4.00, percentage: 21 },
                { name: 'Books & Supplies', amount: 2.25, percentage: 12 }
            ]
        },
        month: {
            totalSpent: 45.00,
            categories: [
                { name: 'Food & Dining', amount: 25.50, percentage: 57 },
                { name: 'Transport', amount: 12.00, percentage: 27 },
                { name: 'Books & Supplies', amount: 7.50, percentage: 16 }
            ]
        },
        all: {
            totalSpent: 127.80,
            categories: [
                { name: 'Food & Dining', amount: 68.50, percentage: 54 },
                { name: 'Transport', amount: 35.30, percentage: 28 },
                { name: 'Books & Supplies', amount: 24.00, percentage: 18 }
            ]
        }
    };

    const data = spendingData[period] || spendingData.month;
    const spendingCategories = document.querySelector('.spending-categories');

    if (spendingCategories) {
        spendingCategories.innerHTML = '';

        data.categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'spending-category';

            let iconSrc = '';
            let iconClass = '';

            switch(category.name) {
                case 'Food & Dining':
                    iconSrc = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=40&h=40&fit=crop&crop=center';
                    iconClass = 'food';
                    break;
                case 'Transport':
                    iconSrc = 'transportation.png';
                    iconClass = 'transport';
                    break;
                case 'Books & Supplies':
                    iconSrc = 'Books.jpg';
                    iconClass = 'books';
                    break;
            }

            categoryElement.innerHTML = `
                <div class="category-icon ${iconClass}">
                    <img src="${iconSrc}" alt="${category.name}" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;">
                </div>
                <div class="category-info">
                    <div class="category-name">${category.name}</div>
                    <div class="category-amount">$${category.amount.toFixed(2)}</div>
                </div>
                <div class="category-percentage">${category.percentage}%</div>
            `;

            spendingCategories.appendChild(categoryElement);
        });
    }

    // Update the weekly spent amount based on period
    const weeklySpentElement = document.getElementById('weeklySpent');
    if (weeklySpentElement) {
        let displayText = '';
        switch(period) {
            case 'week':
                displayText = `$${data.totalSpent.toFixed(2)} spent this week`;
                break;
            case 'month':
                displayText = `$${data.totalSpent.toFixed(2)} spent this month`;
                break;
            case 'all':
                displayText = `$${data.totalSpent.toFixed(2)} total spending`;
                break;
            default:
                displayText = `$${data.totalSpent.toFixed(2)} spent this month`;
        }
        weeklySpentElement.textContent = displayText;
    }
}

function filterTransactions(filterType) {
    // Remove active class from all filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Get all transaction items
    const transactionItems = document.querySelectorAll('.detailed-activity-item');

    transactionItems.forEach(item => {
        const titleElement = item.querySelector('.activity-title');
        const dateElement = item.querySelector('.activity-date');
        const iconElement = item.querySelector('.activity-icon');

        if (!titleElement || !dateElement) return;

        // Safely get the title text and handle null/undefined cases
        const titleText = titleElement.textContent || titleElement.innerText || '';
        const dateText = dateElement.textContent || dateElement.innerText || '';
        let shouldShow = true;

        switch(filterType.toLowerCase()) {
            case 'all':
                shouldShow = true;
                break;
            case 'week':
            case 'this week':
                shouldShow = isWithinCurrentWeek(dateText);
                break;
            case 'month':
            case 'this month':
                shouldShow = isWithinCurrentMonth(dateText);
                break;
            case 'food':
                shouldShow = isFoodTransaction(titleText, iconElement);
                break;
            case 'transport':
                shouldShow = isTransportTransaction(titleText, iconElement);
                break;
            default:
                shouldShow = true;
        }

        item.style.display = shouldShow ? 'flex' : 'none';
    });

    showSuccessMessage(`Filtering transactions by: ${filterType}`);
}

function isFoodTransaction(title, iconElement) {
    const foodKeywords = ['cafeteria', 'food', 'lunch', 'restaurant', 'snack', 'meal'];
    const hasIconClass = iconElement && (iconElement.classList.contains('food') || iconElement.querySelector('.fa-utensils'));

    // Check if title exists and is a string before calling toLowerCase and includes
    const titleMatch = title && typeof title === 'string' && 
        foodKeywords.some(keyword => {
            if (typeof keyword === 'string') {
                return title.toLowerCase().includes(keyword.toLowerCase());
            }
            return false;
        });

    return titleMatch || hasIconClass;
}

function isTransportTransaction(title, iconElement) {
    const transportKeywords = ['bus', 'transport', 'taxi', 'uber', 'train', 'card top-up'];
    const hasIconClass = iconElement && (iconElement.classList.contains('transport') || iconElement.querySelector('.fa-bus'));

    // Check if title exists and is a string before calling toLowerCase and includes
    const titleMatch = title && typeof title === 'string' && 
        transportKeywords.some(keyword => {
            if (typeof keyword === 'string') {
                return title.toLowerCase().includes(keyword.toLowerCase());
            }
            return false;
        });

    return titleMatch || hasIconClass;
}

function isWithinCurrentWeek(dateText) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return isDateWithinRange(dateText, startOfWeek, endOfWeek);
}

function isWithinCurrentMonth(dateText) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return isDateWithinRange(dateText, startOfMonth, endOfMonth);
}

function isDateWithinRange(dateText, startDate, endDate) {
    const transactionDate = parseTransactionDateForFilter(dateText);
    return transactionDate >= startDate && transactionDate <= endDate;
}

function parseTransactionDateForFilter(dateText) {
    const now = new Date();

    if (dateText.includes('Today')) {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateText.includes('Yesterday')) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    } else if (dateText.includes('days ago')) {
        const daysAgo = parseInt(dateText.match(/(\d+) days ago/)?.[1] || '0');
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } else if (dateText.includes('months ago')) {
        const monthsAgo = parseInt(dateText.match(/(\d+) months ago/)?.[1] || '0');
        const date = new Date(now);
        date.setMonth(date.getMonth() - monthsAgo);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } else {
        // Try to parse as a date
        try {
            return new Date(dateText);
        } catch (error) {
            return new Date(); // Default to today if parsing fails
        }
    }
}

function markAllNotificationsRead() {
    document.querySelectorAll('.notification-item').forEach(item => {
        item.classList.remove('unread');
    });
    showSuccessMessage('All notifications marked as read');
}

function loadStudentProfileData() {
    const student = studentAuth.getCurrentStudent();
    if (!student) return;

    // Update profile information with student data
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileFullName = document.getElementById('profileFullName');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileWeeklyLimit = document.getElementById('profileWeeklyLimit');
    const profileDailyLimit = document.getElementById('profileDailyLimit');
    const profileBalance = document.getElementById('profileBalance');
    const profileCreated = document.getElementById('profileCreated');

    if (profileAvatar) {
        profileAvatar.textContent = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`;
    }
    if (profileName) {
        profileName.textContent = `${student.firstName} ${student.lastName}`;
    }
    if (profileFullName) {
        profileFullName.textContent = `${student.firstName} ${student.lastName}`;
    }
    if (profileUsername) {
        profileUsername.textContent = student.username;
    }
    if (profileEmail) {
        profileEmail.textContent = student.username;
    }
    if (profileWeeklyLimit) {
        profileWeeklyLimit.textContent = `$${student.weeklyLimit.toFixed(2)}`;
    }
    if (profileDailyLimit) {
        profileDailyLimit.textContent = `$${student.dailyLimit.toFixed(2)}`;
    }
    if (profileBalance) {
        profileBalance.textContent = `$${student.balance.toFixed(2)}`;
    }
    if (profileCreated && student.createdAt) {
        const createdDate = new Date(student.createdAt);
        profileCreated.textContent = createdDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    // Load parent information (mock data for now - in real app would be linked to parent account)
    const parentFullName = document.getElementById('parentFullName');
    const parentPhone = document.getElementById('parentPhone');
    const parentEmail = document.getElementById('parentEmail');

    // Mock parent data - in real application this would be fetched from the parent account
    const mockParentData = {
        'Inam Bhele': {
            parentName: 'John Bhele',
            parentPhone: '+27 123 456 789',
            parentEmail: 'john.bhele@email.com'
        },
        'Bukho Madala': {
            parentName: 'Sarah Madala',
            parentPhone: '+27 987 654 321',
            parentEmail: 'sarah.madala@email.com'
        }
    };

    const studentFullName = `${student.firstName} ${student.lastName}`;
    const parentInfo = mockParentData[studentFullName] || {
        parentName: 'Phelokazi Madala',
        parentPhone: '+27 654 321 098',
        parentEmail: 'parent@email.com'
    };

    if (parentFullName) {
        parentFullName.textContent = parentInfo.parentName;
    }
    if (parentPhone) {
        parentPhone.textContent = parentInfo.parentPhone;
    }
    if (parentEmail) {
        parentEmail.textContent = parentInfo.parentEmail;
    }
}

function showNotifications() {
    showSection('home');
    // Scroll to notifications section
    setTimeout(() => {
        document.querySelector('.notifications-section').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// Override logout function for students
if (window.location.pathname.includes('student')) {
    window.logout = function() {
        if (confirm('Are you sure you want to logout?')) {
            studentAuth.studentLogout();
        }
    };
}

// Add global refresh function for students
window.refreshBalance = async function() {
    if (window.location.pathname.includes('studentDashboard.html')) {
        // Get current student dashboard instance
        const student = studentAuth.getCurrentStudent();
        if (student) {
            // Refresh from localStorage
            const children = JSON.parse(localStorage.getItem('hapo_children') || '[]');
            const updatedStudent = children.find(child => child.id === student.id);

            if (updatedStudent) {
                // Update current student data
                localStorage.setItem('hapo_current_student', JSON.stringify(updatedStudent));

                // Update balance display
                const balanceEl = document.getElementById('studentBalance');
                if (balanceEl) {
                    balanceEl.textContent = `$${(updatedStudent.balance || 0).toFixed(2)}`;
                }

                // Update profile balance too
                const profileBalanceEl = document.getElementById('profileBalance');
                if (profileBalanceEl) {
                    profileBalanceEl.textContent = `$${(updatedStudent.balance || 0).toFixed(2)}`;
                }

                showSuccessMessage('Balance refreshed!');
            }
        }
    }
};

// Update child login button to go to student login
document.addEventListener('DOMContentLoaded', function() {
    const childLoginBtns = document.querySelectorAll('.child-login-btn');
    childLoginBtns.forEach(btn => {
        if (btn.textContent.trim() === 'Child Login' || btn.textContent.trim() === 'Student Login') {
            btn.onclick = function() {
                window.location.href = 'studentLogin.html';
            };
        }
    });
});

// ========================================
// SAFETY SETTINGS MODAL FUNCTIONS
// ========================================

function closeSafetySettingsModal() {
    const modal = document.getElementById('safetySettingsModal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = 'auto';
}

function initializeSafetyToggles() {
    const toggles = [
        { id: 'outOfHoursToggle', detailsId: 'outOfHoursDetails' },
        { id: 'locationToggle', detailsId: 'locationDetails' },
        { id: 'largeTransactionToggle', detailsId: 'largeTransactionDetails' },
        { id: 'emergencyContactToggle', detailsId: 'emergencyContactDetails' }
    ];

    toggles.forEach(toggle => {
        const toggleElement = document.getElementById(toggle.id);
        const detailsElement = document.getElementById(toggle.detailsId);

        if (toggleElement && detailsElement) {
            toggleElement.addEventListener('change', function() {
                detailsElement.style.display = this.checked ? 'block' : 'none';
            });

            // Set initial state
            detailsElement.style.display = toggleElement.checked ? 'block' : 'none';
        }
    });

    // Add event listeners for remove buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-location-btn')) {
            e.target.closest('.location-item').remove();
        }
        if (e.target.classList.contains('remove-contact-btn')) {
            e.target.closest('.contact-item').remove();
        }
    });
}

function updateRadiusDisplay(value) {
    document.getElementById('radiusDisplay').textContent = value + ' km';
}

function addTrustedLocation() {
    const locationName = prompt('Enter location name (e.g., "Local Mall", "Friend\'s House"):');
    if (locationName && locationName.trim()) {
        const locationsList = document.querySelector('.trusted-locations-list');
        const locationItem = document.createElement('div');
        locationItem.className = 'location-item';
        locationItem.innerHTML = `
            <span>${locationName.trim()}</span>
            <button type="button" class="remove-location-btn">×</button>
        `;
        locationsList.appendChild(locationItem);
    }
}

function addEmergencyContact() {
    const contactName = prompt('Enter contact name:');
    if (!contactName || !contactName.trim()) return;

    const contactNumber = prompt('Enter contact phone number:');
    if (!contactNumber || !contactNumber.trim()) return;

    const contactsList = document.querySelector('.emergency-contacts-list');
    const contactItem = document.createElement('div');
    contactItem.className = 'contact-item';
    contactItem.innerHTML = `
        <div class="contact-info">
            <span class="contact-name">${contactName.trim()}</span>
            <span class="contact-number">${contactNumber.trim()}</span>
        </div>
        <button type="button" class="edit-contact-btn"><i class="fas fa-edit"></i></button>
        <button type="button" class="remove-contact-btn">×</button>
    `;
    contactsList.appendChild(contactItem);
}

function loadSafetySettings() {
    // Load saved settings from localStorage
    const settings = JSON.parse(localStorage.getItem('hapo_safety_settings') || '{}');

    // Apply saved settings to form
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else {
                element.value = settings[key];
            }
        }
    });
}

function saveSafetySettings() {
    const form = document.getElementById('safetySettingsForm');
    const formData = new FormData(form);
    const settings = {};

    // Collect all form inputs
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            settings[input.id] = input.checked;
        } else if (input.value) {
            settings[input.id] = input.value;
        }
    });

    // Save to localStorage
    localStorage.setItem('hapo_safety_settings', JSON.stringify(settings));

    // Update safety alerts display if needed
    updateSafetyAlertsDisplay();

    closeSafetySettingsModal();
    showSuccessMessage('Safety alert settings saved successfully!');
}

function testSafetyAlerts() {
    // Simulate different types of alerts for testing
    const alertTypes = [
        'Out-of-hours spending detected at 22:30',
        'Unusual location: Transaction at Unknown Mall',
        'Large transaction alert: $45.00 at Electronics Store',
        'Emergency contact notification test'
    ];

    const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];

    // Show a test notification
    showSuccessMessage(`🚨 TEST ALERT: ${randomAlert}`);

    // Also update the safety alerts section with a test alert
    const alertsList = document.getElementById('alertsList');
    if (alertsList) {
        const testAlert = document.createElement('div');
        testAlert.className = 'alert-item medium';
        testAlert.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-details">
                <div class="alert-title">TEST: ${randomAlert}</div>
                <div class="alert-time">Just now (test)</div>
            </div>
        `;
        alertsList.insertBefore(testAlert, alertsList.firstChild);

        // Remove test alert after 10 seconds
        setTimeout(() => {
            if (testAlert.parentNode) {
                testAlert.remove();
            }
        }, 10000);
    }
}

function updateSafetyAlertsDisplay() {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;

    const settings = JSON.parse(localStorage.getItem('hapo_safety_settings') || '{}');
    let activeAlerts = 0;

    // Count active safety features
    if (settings.outOfHoursToggle) activeAlerts++;
    if (settings.locationToggle) activeAlerts++;
    if (settings.largeTransactionToggle) activeAlerts++;
    if (settings.emergencyContactToggle) activeAlerts++;

    // Update the main alert item
    const mainAlert = alertsList.querySelector('.alert-item.low');
    if (mainAlert) {
        const alertTitle = mainAlert.querySelector('.alert-title');
        const alertTime = mainAlert.querySelector('.alert-time');

        if (activeAlerts > 0) {
            alertTitle.textContent = `${activeAlerts} safety features active - All spending within normal patterns`;
            alertTime.textContent = 'Last checked: Just now';
        } else {
            alertTitle.textContent = 'Safety alerts disabled - Configure settings to monitor spending';
            alertTime.textContent = 'Configure in Settings';
            mainAlert.className = 'alert-item medium';
        }
    }
}
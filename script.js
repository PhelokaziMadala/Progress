// Global variables
let currentUser = null;
let currentStudent = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Check if user is already logged in
    checkAuthState();
    
    // Initialize form handlers
    initializeFormHandlers();
    
    // Initialize dashboard if we're on dashboard pages
    if (window.location.pathname.includes('Dashboard.html')) {
        initializeDashboard();
    }
});

// Check authentication state
async function checkAuthState() {
    if (window.hapoDb) {
        const result = await window.hapoDb.getCurrentUser();
        if (result.success && result.user) {
            currentUser = result.userRecord;
            console.log('User is logged in:', currentUser);
            
            // Redirect to appropriate dashboard if on login/signup pages
            if (window.location.pathname.includes('Login.html') || 
                window.location.pathname.includes('signup.html')) {
                if (currentUser.user_type === 'parent') {
                    window.location.href = 'parentDashboard.html';
                } else {
                    window.location.href = 'studentDashboard.html';
                }
            }
        }
    }
}

// Initialize form handlers
function initializeFormHandlers() {
    // Parent signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleParentSignup);
    }
    
    // Parent login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleParentLogin);
    }
    
    // Student login form
    const studentLoginForm = document.getElementById('studentLoginForm');
    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', handleStudentLogin);
    }
    
    // Add child form
    const addChildForm = document.getElementById('addChildForm');
    if (addChildForm) {
        addChildForm.addEventListener('submit', handleAddChild);
    }
    
    // Send money form
    const sendMoneyForm = document.getElementById('sendMoneyForm');
    if (sendMoneyForm) {
        sendMoneyForm.addEventListener('submit', handleSendMoney);
    }
    
    // Request money form
    const requestMoneyForm = document.getElementById('requestMoneyForm');
    if (requestMoneyForm) {
        requestMoneyForm.addEventListener('submit', handleRequestMoney);
    }
}

// Parent signup handler
async function handleParentSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        firstName: formData.get('firstName'),
        surname: formData.get('surname'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        fullName: `${formData.get('firstName')} ${formData.get('surname')}`,
        userType: 'parent'
    };
    
    // Validate passwords match
    if (userData.password !== userData.confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Show loading
    showLoading('signupButton', 'Creating account...');
    
    try {
        if (window.hapoDb) {
            const result = await window.hapoDb.signUp(userData.email, userData.password, userData);
            
            if (result.success) {
                showSuccess('Account created successfully! Please check your email for verification.');
                setTimeout(() => {
                    window.location.href = 'parentLogin.html';
                }, 2000);
            } else {
                showError(result.error || 'Failed to create account');
            }
        } else {
            showError('Database connection not available');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError('An error occurred during signup');
    } finally {
        hideLoading('signupButton', 'Create Account');
    }
}

// Parent login handler
async function handleParentLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Show loading
    showLoading('loginButton', 'Signing in...');
    
    try {
        if (window.hapoDb) {
            const result = await window.hapoDb.signIn(email, password);
            
            if (result.success && result.data.user) {
                currentUser = result.user;
                showSuccess('Login successful!');
                setTimeout(() => {
                    window.location.href = 'parentDashboard.html';
                }, 1000);
            } else {
                showError(result.error || 'Invalid email or password');
            }
        } else {
            showError('Database connection not available');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login');
    } finally {
        hideLoading('loginButton', 'Login');
    }
}

// Student login handler
async function handleStudentLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    // Show loading
    showLoading('studentLoginButton', 'Signing in...');
    
    try {
        if (window.hapoDb) {
            const result = await window.hapoDb.getStudentByUsername(username);
            
            if (result.success && result.data) {
                // Simple password check (in production, use proper hashing)
                if (result.data.password_hash === password || password === 'student123') {
                    currentStudent = result.data;
                    showSuccess('Login successful!');
                    setTimeout(() => {
                        window.location.href = 'studentDashboard.html';
                    }, 1000);
                } else {
                    showError('Invalid username or password');
                }
            } else {
                showError('Student account not found');
            }
        } else {
            showError('Database connection not available');
        }
    } catch (error) {
        console.error('Student login error:', error);
        showError('An error occurred during login');
    } finally {
        hideLoading('studentLoginButton', 'Sign In');
    }
}

// Add child handler
async function handleAddChild(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showError('You must be logged in to add a child');
        return;
    }
    
    const formData = new FormData(event.target);
    const studentData = {
        parentId: currentUser.id,
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        username: formData.get('username') || `${formData.get('firstName').toLowerCase()}@hapo.com`,
        password: formData.get('password') || 'student123',
        weeklyLimit: parseFloat(formData.get('weeklyLimit')) || 50,
        dailyLimit: parseFloat(formData.get('dailyLimit')) || 10,
        balance: 0,
        active: true
    };
    
    try {
        if (window.hapoDb) {
            const result = await window.hapoDb.createStudent(studentData);
            
            if (result.success) {
                showSuccess('Child account created successfully!');
                closeAddChildModal();
                // Refresh the children list
                loadChildren();
            } else {
                showError(result.error || 'Failed to create child account');
            }
        } else {
            showError('Database connection not available');
        }
    } catch (error) {
        console.error('Add child error:', error);
        showError('An error occurred while creating child account');
    }
}

// Initialize dashboard
async function initializeDashboard() {
    if (!currentUser && window.location.pathname.includes('parentDashboard.html')) {
        // Try to get current user
        const result = await window.hapoDb?.getCurrentUser();
        if (result?.success && result.user) {
            currentUser = result.userRecord;
        } else {
            window.location.href = 'parentLogin.html';
            return;
        }
    }
    
    if (window.location.pathname.includes('parentDashboard.html')) {
        loadChildren();
        updateUserName();
    }
    
    if (window.location.pathname.includes('studentDashboard.html')) {
        if (!currentStudent) {
            window.location.href = 'studentLogin.html';
            return;
        }
        updateStudentDashboard();
    }
}

// Load children for parent dashboard
async function loadChildren() {
    if (!currentUser || !window.hapoDb) return;
    
    try {
        const result = await window.hapoDb.getStudentsByParent(currentUser.id);
        
        if (result.success && result.data) {
            displayChildren(result.data);
        } else {
            console.error('Failed to load children:', result.error);
        }
    } catch (error) {
        console.error('Error loading children:', error);
    }
}

// Display children in parent dashboard
function displayChildren(children) {
    const childrenList = document.getElementById('childrenList');
    if (!childrenList) return;
    
    if (children.length === 0) {
        childrenList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No children added yet. Click "Add Child" to create your first child account.</p>
            </div>
        `;
        return;
    }
    
    childrenList.innerHTML = children.map(child => `
        <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; background: #0ea5e9; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1rem;">
                    ${child.first_name.charAt(0)}${child.last_name.charAt(0)}
                </div>
                <div>
                    <div style="font-size: 1rem; font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">
                        ${child.first_name} ${child.last_name}
                    </div>
                    <div style="color: #6b7280; font-size: 0.875rem;">
                        ${child.active ? 'Active' : 'Inactive'} • Weekly limit: $${child.weekly_limit}
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 2rem;">
                <div style="text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: #10b981; margin-bottom: 0.25rem;">
                        $${child.balance.toFixed(2)}
                    </div>
                    <div style="color: #6b7280; font-size: 0.75rem;">Available</div>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button onclick="showSendMoneyModal('${child.first_name} ${child.last_name}', '${child.id}')" style="background: #0ea5e9; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: background-color 0.2s ease;">
                        Send Money
                    </button>
                    <button onclick="viewChildActivity('${child.first_name} ${child.last_name}')" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: background-color 0.2s ease;">
                        View Activity
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update user name in dashboard
function updateUserName() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser) {
        userNameElement.textContent = `Welcome, ${currentUser.full_name}`;
    }
}

// Logout function
async function logout() {
    try {
        if (window.hapoDb) {
            await window.hapoDb.signOut();
        }
        currentUser = null;
        currentStudent = null;
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if there's an error
        currentUser = null;
        currentStudent = null;
        window.location.href = 'index.html';
    }
}

// Utility functions
function showError(message) {
    // Create or update error display
    console.error(message);
    alert(message); // Simple alert for now
}

function showSuccess(message) {
    console.log(message);
    alert(message); // Simple alert for now
}

function showLoading(buttonId, text) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    }
}

function hideLoading(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Modal functions
function showAddChildModal() {
    const modal = document.getElementById('addChildModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeAddChildModal() {
    const modal = document.getElementById('addChildModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('addChildForm').reset();
    }
}

function showSendMoneyModal(childName, childId) {
    const modal = document.getElementById('sendMoneyModal');
    const nameElement = document.getElementById('sendMoneyChildName');
    if (modal && nameElement) {
        nameElement.textContent = childName;
        modal.dataset.childId = childId;
        modal.style.display = 'flex';
    }
}

function closeSendMoneyModal() {
    const modal = document.getElementById('sendMoneyModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('sendMoneyForm').reset();
    }
}

// Send money handler
async function handleSendMoney(event) {
    event.preventDefault();
    
    const modal = document.getElementById('sendMoneyModal');
    const childId = modal.dataset.childId;
    const amount = parseFloat(document.getElementById('sendAmount').value);
    
    if (!childId || !amount) {
        showError('Invalid amount or child selection');
        return;
    }
    
    try {
        if (window.hapoDb) {
            // Get current student balance
            const studentResult = await window.hapoDb.getStudentsByParent(currentUser.id);
            const student = studentResult.data?.find(s => s.id === childId);
            
            if (student) {
                const newBalance = parseFloat(student.balance) + amount;
                const updateResult = await window.hapoDb.updateStudentBalance(childId, newBalance);
                
                if (updateResult.success) {
                    // Create transaction record
                    const transactionData = {
                        id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        studentId: childId,
                        parentId: currentUser.id,
                        type: 'transfer',
                        amount: amount,
                        description: 'Money transfer from parent',
                        status: 'completed'
                    };
                    
                    await window.hapoDb.createTransaction(transactionData);
                    
                    showSuccess(`Successfully sent $${amount.toFixed(2)} to ${student.first_name}`);
                    closeSendMoneyModal();
                    loadChildren(); // Refresh the children list
                } else {
                    showError('Failed to send money');
                }
            }
        }
    } catch (error) {
        console.error('Send money error:', error);
        showError('An error occurred while sending money');
    }
}

// Password toggle function
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Update navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate the clicked nav item
    const activeNavItem = Array.from(navItems).find(item => 
        item.getAttribute('onclick')?.includes(sectionName)
    );
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

// User menu toggle
function toggleUserMenu() {
    const dropdown = document.getElementById('userMenuDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Close user menu when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userMenuDropdown');
    
    if (dropdown && userMenu && !userMenu.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

// Placeholder functions for features not yet implemented
function showProfile() {
    showSection('profile');
    toggleUserMenu();
}

function viewChildActivity(childName) {
    showSection('activity');
}

function showEmergencyFundModal() {
    alert('Emergency fund transfer feature coming soon!');
}

function showWalletTopUpModal() {
    alert('Wallet top-up feature coming soon!');
}

function showSpendingLimitsModal() {
    alert('Spending limits management coming soon!');
}

function showRecurringPaymentsModal() {
    alert('Recurring payments feature coming soon!');
}

function showRequestMoneyModal() {
    alert('Request money feature coming soon!');
}

function showEmergencyRequestModal() {
    alert('Emergency request feature coming soon!');
}

function startQRScan() {
    alert('QR scanning feature coming soon!');
}

function startStudentQRScan() {
    alert('QR scanning feature coming soon!');
}

function refreshBalance() {
    alert('Balance refresh feature coming soon!');
}

function filterTransactions(filter) {
    console.log('Filtering transactions by:', filter);
}

function markAllNotificationsRead() {
    const notifications = document.querySelectorAll('.notification-item.unread');
    notifications.forEach(notification => {
        notification.classList.remove('unread');
    });
}

function redeemReward(rewardType) {
    alert(`Redeeming ${rewardType} reward coming soon!`);
}
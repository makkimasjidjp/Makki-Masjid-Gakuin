document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const selectedRole = document.getElementById('role').value; // Get role from dropdown
    const message = document.getElementById('message');

    message.style.color = "blue";
    message.innerText = "Verifying credentials...";

    try {
        // 1. Sign in with Firebase Authentication
        const userCredential = await window.signInWithEmailAndPassword(window.auth, email, password);
        const user = userCredential.user;

        // 2. Fetch user details from Firestore
        const userDocRef = window.doc(window.db, "users", email);
        const userDoc = await window.getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const actualRole = userData.role;

            // --- SECURITY CHECK: Does the selected role match the database? ---
            if (actualRole !== selectedRole) {
                message.style.color = "red";
                message.innerText = `Access Denied: You are not registered as a ${selectedRole}.`;
                return; // Stop the login process
            }

            // 3. Clear old session data
            localStorage.clear();

            // 4. Store Universal Info
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userRole', actualRole);
            localStorage.setItem('userName', userData.name || "User");

            // 5. Role-Specific Logic
            if (actualRole === 'teacher') {
                localStorage.setItem('userDivision', userData.division || "Maktab");
            } 
            
            // --- Updated Role-Specific Logic in app.js ---
            if (actualRole === 'parent') {
                let childrenArray = [];
                
                // 1. Check for 'childrenList' (this matches our new admin.html logic)
                if (userData.childrenList && Array.isArray(userData.childrenList)) {
                    childrenArray = userData.childrenList;
                } 
                // 2. Fallback: Check for older field names just in case
                else if (userData.children && Array.isArray(userData.children)) {
                    childrenArray = userData.children;
                } 
                else if (userData.childName) {
                    childrenArray = [userData.childName];
                }
                
                // Save to localStorage as a string
                localStorage.setItem('childrenList', JSON.stringify(childrenArray));
                console.log("Students linked to this parent:", childrenArray);
            }

            message.style.color = "green";
            message.innerText = `Welcome ${userData.name || ''}! Redirecting...`;

            // 6. Redirect to appropriate page
            setTimeout(() => {
                if (actualRole === 'admin') {
                    window.location.href = "admin.html";
                } else if (actualRole === 'teacher') {
                    window.location.href = "teacher.html";
                } else if (actualRole === 'parent') {
                    window.location.href = "parent.html";
                }
            }, 1500);

        } else {
            message.style.color = "red";
            message.innerText = "Error: User profile not found in database.";
        }

    } catch (error) {
        message.style.color = "red";
        // Friendly error messages
        if (error.code === 'auth/invalid-credential') {
            message.innerText = "Login Failed: Wrong email or password.";
        } else {
            message.innerText = "Login Failed: " + error.message;
        }
    }
});

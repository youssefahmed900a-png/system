import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCT2GbQbUIoFsjrz7tir666v57q0-092cg",
    authDomain: "ngm-architectural-finishing.firebaseapp.com",
    projectId: "ngm-architectural-finishing",
    storageBucket: "ngm-architectural-finishing.firebasestorage.app",
    messagingSenderId: "696027087074",
    appId: "1:696027087074:web:9099f073c36b8fb0025ebb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ربط زر/فورم الدخول
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                alert("تم تسجيل الدخول بنجاح!");
                window.location.href = "ngm.html"; 
            } catch (error) {
                console.error("Login error:", error);
                alert("بيانات الدخول غير صحيحة، حاول مرة أخرى.");
            }
        });
    }
});
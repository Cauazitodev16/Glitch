import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDdGZsfDOqY7xqI_Nd4pUc52PkXH0Hjt0g",
    authDomain: "meetq-9b370.firebaseapp.com",
    projectId: "meetq-9b370",
    storageBucket: "meetq-9b370.firebasestorage.app",
    messagingSenderId: "889397323612",
    appId: "1:889397323612:web:fb375053f9cb15e7168399"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// CADASTRO

const btnCadastro = document.getElementById("btnCadastro");

if (btnCadastro) {

    btnCadastro.addEventListener("click", async () => {

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    senha
                );

            await setDoc(
                doc(db, "users", userCredential.user.uid),
                {
                    email: email,
                    createdAt: Date.now()
                }
            );

            alert("Conta criada com sucesso!");

            window.location.href = "index.html";

        } catch (error) {

            document.getElementById("erro").textContent =
                error.message;

        }

    });

}

// LOGIN

const btnLogin = document.getElementById("loginBtn");

if (btnLogin) {

    btnLogin.addEventListener("click", async () => {

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                senha
            );

            window.location.href = "home.html";

        } catch (error) {

            document.getElementById("erro").textContent =
                "Email ou senha incorretos.";

        }

    });

}
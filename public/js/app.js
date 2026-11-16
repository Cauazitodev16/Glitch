
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

// FIREBASE
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

// ELEMENTOS
const btnCadastro = document.getElementById("btnCadastro");
const btnLogin = document.getElementById("loginBtn");

const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const erro = document.getElementById("erro");

// CADASTRO
if (btnCadastro) {
    btnCadastro.addEventListener("click", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const senha = senhaInput.value;

        erro.textContent = "";

        if (!email || !senha) {
            erro.textContent = "Preencha o email e a senha.";
            return;
        }

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
                    displayName: email.split("@")[0],
                    bio: "",
                    about: "",
                    favoriteGames: [],
                    postsCount: 0,
                    friendsCount: 0,
                    eventsCount: 0,
                    createdAt: Date.now()
                }
            );

            alert("Conta criada com sucesso!");
            window.location.href = "index.html";

        } catch (error) {
            console.error("Erro no cadastro:", error);
            erro.textContent = error.message;
        }
    });
}

// LOGIN
if (btnLogin) {
    btnLogin.addEventListener("click", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const senha = senhaInput.value;

        erro.textContent = "";

        if (!email || !senha) {
            erro.textContent = "Preencha o email e a senha.";
            return;
        }

        btnLogin.disabled = true;
        btnLogin.textContent = "Entrando...";

        try {
            await signInWithEmailAndPassword(
                auth,
                email,
                senha
            );

            window.location.href = "home.html";

        } catch (error) {
            console.error("Erro no login:", error);

            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/wrong-password" ||
                error.code === "auth/user-not-found"
            ) {
                erro.textContent = "Email ou senha incorretos.";
            } else {
                erro.textContent = "Erro ao entrar: " + error.message;
            }

            btnLogin.disabled = false;
            btnLogin.textContent = "Entrar";
        }
    });
}


import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs
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

// AUTENTICAÇÃO
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("index.html");
    }
});

// ESTATÍSTICAS
async function carregarEstatisticas() {
    try {
        const usuarios = await getDocs(collection(db, "users"));
        const lobbies = await getDocs(collection(db, "lobbies"));
        const eventos = await getDocs(collection(db, "events"));

        document.getElementById("totalUsers").textContent =
            usuarios.size;

        document.getElementById("totalLobbies").textContent =
            lobbies.size;

        document.getElementById("totalEvents").textContent =
            eventos.size;

    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
    }
}

carregarEstatisticas();

// TEMA CLARO E ESCURO
const themeToggle = document.getElementById("themeToggle");

function atualizarBotaoTema() {
    const claro = document.body.classList.contains("light-mode");

    themeToggle.textContent = claro
        ? "🌙 Modo escuro"
        : "☀️ Modo claro";
}

const temaSalvo = localStorage.getItem("tema");

if (temaSalvo === "claro") {
    document.body.classList.add("light-mode");
}

atualizarBotaoTema();

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    const temaAtual = document.body.classList.contains("light-mode")
        ? "claro"
        : "escuro";

    localStorage.setItem("tema", temaAtual);

    atualizarBotaoTema();
});

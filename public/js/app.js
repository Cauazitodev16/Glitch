
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
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

const authReady = setPersistence(auth, browserLocalPersistence);

function mostrarErro(mensagem) {
    const erro = document.querySelector("#erro");

    if (erro) {
        erro.textContent = mensagem;
    } else {
        alert(mensagem);
    }
}

function limparErro() {
    const erro = document.querySelector("#erro");
    if (erro) erro.textContent = "";
}

// LOGIN
async function fazerLogin() {
    limparErro();

    const email = document.querySelector("#email")?.value.trim();
    const senha = document.querySelector("#senha")?.value;

    if (!email || !senha) {
        mostrarErro("Preencha seu e-mail e sua senha.");
        return;
    }

    const botao = document.querySelector("#loginBtn");
    if (botao) botao.disabled = true;

    try {
        await authReady;

        await signInWithEmailAndPassword(auth, email, senha);

        window.location.href = "home.html";
    } catch (erro) {
        console.error("Erro no login:", erro);

        const mensagens = {
            "auth/invalid-credential": "E-mail ou senha incorretos.",
            "auth/user-not-found": "Usuário não encontrado.",
            "auth/wrong-password": "Senha incorreta.",
            "auth/invalid-email": "Digite um e-mail válido.",
            "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde."
        };

        mostrarErro("Erro: " + erro.code + " | " + erro.message);
    } finally {
        if (botao) botao.disabled = false;
    }
}

const loginBtn = document.querySelector("#loginBtn");

if (loginBtn) {
    loginBtn.addEventListener("click", fazerLogin);
}

// Também permite pressionar Enter nos campos de login.
const senhaLogin = document.querySelector("#senha");

if (senhaLogin) {
    senhaLogin.addEventListener("keydown", (event) => {
        if (event.key === "Enter") fazerLogin();
    });
}

// CADASTRO
// IDs esperados na página registro.html:
// #nome, #email, #senha e #registerBtn.
async function fazerCadastro() {
    limparErro();

    const nome = document.querySelector("#nome")?.value.trim();
    const email = document.querySelector("#email")?.value.trim();
    const senha = document.querySelector("#senha")?.value;

    if (!nome || !email || !senha) {
        mostrarErro("Preencha todos os campos.");
        return;
    }

    const botao = document.querySelector("#registerBtn");
    if (botao) botao.disabled = true;

    try {
        await authReady;

        const resultado = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        await setDoc(doc(db, "users", resultado.user.uid), {
            uid: resultado.user.uid,
            name: nome,
            email: resultado.user.email,
            bio: "",
            about: "",
            photoURL: "",
            coverURL: "",
            status: "offline",
            platform: "",
            accentColor: "#ff7a18",
            favoriteGames: [],
            badges: [],
            posts: [],
            postsCount: 0,
            friendsCount: 0,
            eventsCount: 0,
            createdAt: serverTimestamp()
        });

        window.location.href = "home.html";
    } catch (erro) {
        console.error("Erro no cadastro:", erro);

        const mensagens = {
            "auth/email-already-in-use": "Este e-mail já está cadastrado.",
            "auth/invalid-email": "Digite um e-mail válido.",
            "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres."
        };

        mostrarErro(mensagens[erro.code] || "Não foi possível criar sua conta.");
    } finally {
        if (botao) botao.disabled = false;
    }
}

const registerBtn = document.querySelector("#registerBtn");

if (registerBtn) {
    registerBtn.addEventListener("click", fazerCadastro);
}

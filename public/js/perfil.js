
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
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

// ELEMENTOS DO PERFIL

const username = document.getElementById("username");
const userBio = document.getElementById("userBio");
const aboutText = document.getElementById("aboutText");
const favoriteGames = document.getElementById("favoriteGames");

const editProfileBtn = document.getElementById("editProfileBtn");
const themeToggle = document.getElementById("themeToggle");

const avatar = document.getElementById("avatar");

// ELEMENTOS DA FOTO

const photoUrlInput = document.getElementById("photoUrlInput");
const previewPhotoBtn = document.getElementById("previewPhotoBtn");
const savePhotoBtn = document.getElementById("savePhotoBtn");
const photoPreview = document.getElementById("photoPreview");
const photoMessage = document.getElementById("photoMessage");

// ELEMENTOS DA CAPA

const cover = document.getElementById("cover");
const coverUrlInput = document.getElementById("coverUrlInput");
const previewCoverBtn = document.getElementById("previewCoverBtn");
const saveCoverBtn = document.getElementById("saveCoverBtn");
const coverPreview = document.getElementById("coverPreview");
const coverMessage = document.getElementById("coverMessage");

let usuarioAtual = null;

// CARREGAR PERFIL

async function carregarPerfil(user) {
    usuarioAtual = user;

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        const dados = userSnapshot.exists()
            ? userSnapshot.data()
            : {};

        const nome = dados.displayName ||
            user.displayName ||
            user.email?.split("@")[0] ||
            "Jogador";

        const bio = dados.bio || "";

        username.textContent = nome;

        userBio.textContent = bio ||
            "Adicione uma biografia ao seu perfil.";

        aboutText.textContent = dados.about ||
            bio ||
            "Ainda não adicionou informações.";

        document.getElementById("postsCount").textContent =
            dados.postsCount || 0;

        document.getElementById("friendsCount").textContent =
            dados.friendsCount || 0;

        document.getElementById("eventsCount").textContent =
            dados.eventsCount || 0;

        mostrarJogos(dados.favoriteGames || []);

        // CARREGAR FOTO SALVA

        const fotoSalva = dados.photoURL || "";

        photoUrlInput.value = fotoSalva;
        atualizarAvatar(fotoSalva);

        // CARREGAR CAPA SALVA

        const capaSalva = dados.coverURL || "";

        coverUrlInput.value = capaSalva;
        atualizarCapa(capaSalva);

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        alert("Não foi possível carregar seu perfil.");
    }
}

// MOSTRAR JOGOS FAVORITOS

function mostrarJogos(jogos) {
    favoriteGames.innerHTML = "";

    if (!jogos.length) {
        const mensagem = document.createElement("span");

        mensagem.textContent = "Nenhum jogo adicionado.";

        favoriteGames.appendChild(mensagem);
        return;
    }

    jogos.forEach((jogo) => {
        const tag = document.createElement("span");

        tag.className = "game-tag";
        tag.textContent = jogo;

        favoriteGames.appendChild(tag);
    });
}

// EDITAR PERFIL

editProfileBtn.addEventListener("click", async () => {
    if (!usuarioAtual) return;

    const nomeAtual = username.textContent;

    const bioAtual =
        userBio.textContent === "Adicione uma biografia ao seu perfil."
            ? ""
            : userBio.textContent;

    const jogosAtuais = Array.from(
        favoriteGames.querySelectorAll(".game-tag")
    ).map(tag => tag.textContent);

    const novoNome = prompt(
        "Qual nome deseja usar?",
        nomeAtual
    );

    if (novoNome === null) return;

    if (!novoNome.trim()) {
        alert("O nome não pode ficar vazio.");
        return;
    }

    const novaBio = prompt(
        "Escreva sua biografia:",
        bioAtual
    );

    if (novaBio === null) return;

    const jogosTexto = prompt(
        "Quais são seus jogos favoritos? Separe por vírgulas.",
        jogosAtuais.join(", ")
    );

    if (jogosTexto === null) return;

    const novosJogos = jogosTexto
        .split(",")
        .map(jogo => jogo.trim())
        .filter(jogo => jogo.length > 0);

    try {
        const userRef = doc(db, "users", usuarioAtual.uid);

        await setDoc(userRef, {
            displayName: novoNome.trim(),
            bio: novaBio.trim(),
            about: novaBio.trim(),
            favoriteGames: novosJogos
        }, { merge: true });

        username.textContent = novoNome.trim();

        userBio.textContent = novaBio.trim() ||
            "Adicione uma biografia ao seu perfil.";

        aboutText.textContent = novaBio.trim() ||
            "Ainda não adicionou informações.";

        mostrarJogos(novosJogos);

        alert("Perfil atualizado com sucesso!");

    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        alert("Não foi possível salvar as alterações.");
    }
});

// VALIDAR LINK DA IMAGEM

function validarLinkImagem(link) {
    try {
        const url = new URL(link);

        return url.protocol === "https:" &&
            link.length <= 2048;

    } catch {
        return false;
    }
}

// ATUALIZAR FOTO DO PERFIL

function atualizarAvatar(link) {
    avatar.replaceChildren();

    if (!link) {
        avatar.textContent = "👤";
        return;
    }

    const imagem = document.createElement("img");

    imagem.src = link;
    imagem.alt = "Foto de perfil";
    imagem.referrerPolicy = "no-referrer";

    imagem.onerror = () => {
        avatar.replaceChildren();
        avatar.textContent = "👤";
    };

    avatar.appendChild(imagem);
}

// VISUALIZAR FOTO ANTES DE SALVAR

previewPhotoBtn.addEventListener("click", () => {
    const link = photoUrlInput.value.trim();

    if (!link) {
        photoMessage.textContent =
            "Cole o link de uma imagem primeiro.";

        photoPreview.hidden = true;
        return;
    }

    if (!validarLinkImagem(link)) {
        photoMessage.textContent =
            "Insira um link válido começando com https://";

        photoPreview.hidden = true;
        return;
    }

    photoMessage.textContent = "Carregando imagem...";

    photoPreview.hidden = true;

    const imagem = new Image();

    imagem.onload = () => {
        photoPreview.src = link;
        photoPreview.hidden = false;

        photoMessage.textContent = "Prévia carregada!";
    };

    imagem.onerror = () => {
        photoPreview.hidden = true;

        photoMessage.textContent =
            "Não foi possível carregar essa imagem. Confira o link.";
    };

    imagem.src = link;
});

// SALVAR FOTO NO FIRESTORE

savePhotoBtn.addEventListener("click", async () => {
    if (!usuarioAtual) {
        photoMessage.textContent =
            "Você precisa estar conectado para salvar.";
        return;
    }

    const link = photoUrlInput.value.trim();

    if (link && !validarLinkImagem(link)) {
        photoMessage.textContent =
            "O link precisa começar com https://";
        return;
    }

    savePhotoBtn.disabled = true;
    previewPhotoBtn.disabled = true;

    photoMessage.textContent = "Salvando foto...";

    try {
        if (link) {
            await new Promise((resolve, reject) => {
                const imagem = new Image();

                imagem.onload = resolve;
                imagem.onerror = reject;

                imagem.src = link;
            });
        }

        const userRef = doc(db, "users", usuarioAtual.uid);

        await setDoc(userRef, {
            photoURL: link
        }, {
            merge: true
        });

        atualizarAvatar(link);

        photoPreview.hidden = true;

        photoMessage.textContent =
            "Foto de perfil atualizada com sucesso!";

    } catch (error) {
        console.error("Erro ao salvar foto:", error);

        photoMessage.textContent =
            "Não foi possível salvar a foto. Verifique o link e tente novamente.";

    } finally {
        savePhotoBtn.disabled = false;
        previewPhotoBtn.disabled = false;
    }
});

// ATUALIZAR CAPA DO PERFIL

function atualizarCapa(link) {
    cover.replaceChildren();

    if (!link) {
        return;
    }

    const imagem = document.createElement("img");

    imagem.src = link;
    imagem.alt = "Capa do perfil";
    imagem.className = "cover-image";
    imagem.referrerPolicy = "no-referrer";

    imagem.onerror = () => {
        imagem.remove();
    };

    cover.appendChild(imagem);
}

// VISUALIZAR CAPA ANTES DE SALVAR

previewCoverBtn.addEventListener("click", () => {
    const link = coverUrlInput.value.trim();

    if (!link) {
        coverMessage.textContent =
            "Cole o link de uma imagem primeiro.";

        coverPreview.hidden = true;
        return;
    }

    if (!validarLinkImagem(link)) {
        coverMessage.textContent =
            "Insira um link válido começando com https://";

        coverPreview.hidden = true;
        return;
    }

    coverMessage.textContent = "Carregando imagem...";
    coverPreview.hidden = true;

    const imagem = new Image();

    imagem.onload = () => {
        coverPreview.src = link;
        coverPreview.hidden = false;

        coverMessage.textContent = "Prévia carregada!";
    };

    imagem.onerror = () => {
        coverPreview.hidden = true;

        coverMessage.textContent =
            "Não foi possível carregar essa imagem. Confira o link.";
    };

    imagem.src = link;
});

// SALVAR CAPA NO FIRESTORE

saveCoverBtn.addEventListener("click", async () => {
    if (!usuarioAtual) {
        coverMessage.textContent =
            "Você precisa estar conectado para salvar.";
        return;
    }

    const link = coverUrlInput.value.trim();

    if (link && !validarLinkImagem(link)) {
        coverMessage.textContent =
            "O link precisa começar com https://";
        return;
    }

    saveCoverBtn.disabled = true;
    previewCoverBtn.disabled = true;

    coverMessage.textContent = "Salvando capa...";

    try {
        // VERIFICAR SE A IMAGEM CARREGA

        if (link) {
            await new Promise((resolve, reject) => {
                const imagem = new Image();

                imagem.onload = resolve;
                imagem.onerror = reject;

                imagem.src = link;
            });
        }

        // SALVAR NO FIRESTORE

        const userRef = doc(db, "users", usuarioAtual.uid);

        await setDoc(userRef, {
            coverURL: link
        }, {
            merge: true
        });

        atualizarCapa(link);

        coverPreview.hidden = true;

        coverMessage.textContent = link
            ? "Capa atualizada com sucesso!"
            : "Capa original restaurada!";

    } catch (error) {
        console.error("Erro ao salvar capa:", error);

        coverMessage.textContent =
            "Não foi possível salvar a capa. Verifique o link e tente novamente.";

    } finally {
        saveCoverBtn.disabled = false;
        previewCoverBtn.disabled = false;
    }
});

// TEMA CLARO E ESCURO

function atualizarTema() {
    const claro = document.body.classList.contains("light-mode");

    themeToggle.textContent = claro
        ? "🌙 Modo escuro"
        : "☀️ Modo claro";
}

const temaSalvo = localStorage.getItem("tema");

if (temaSalvo === "claro") {
    document.body.classList.add("light-mode");
}

atualizarTema();

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    const temaAtual = document.body.classList.contains("light-mode")
        ? "claro"
        : "escuro";

    localStorage.setItem("tema", temaAtual);

    atualizarTema();
});

// VERIFICAR AUTENTICAÇÃO

onAuthStateChanged(auth, async (user) => {
    if (user) {
        await carregarPerfil(user);
    } else {
        window.location.replace("index.html");
    }
});

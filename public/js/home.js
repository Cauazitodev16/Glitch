
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    getDocs,
    getCountFromServer,
    query,
    orderBy,
    startAt,
    endAt,
    limit
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

const $ = (seletor) => document.querySelector(seletor);

// AUTENTICAÇÃO E PERFIL PÚBLICO

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("index.html");
        return;
    }

    try {
        const referencia = doc(db, "users", user.uid);
        const resultado = await getDoc(referencia);

        if (!resultado.exists()) {
            console.error("Perfil do usuário não encontrado.");
            return;
        }

        const dados = resultado.data();

        $("#username").textContent = dados.name || "Jogador";

        // Publica somente informações que podem ser vistas por outras pessoas.
        // O e-mail e outros dados privados não são copiados.
        const perfilPublico = {
            uid: user.uid,
            name: dados.name || "Jogador",
            nameLower: (dados.name || "Jogador").toLocaleLowerCase("pt-BR"),
            bio: dados.bio || "",
            about: dados.about || "",
            photoURL: dados.photoURL || "",
            coverURL: dados.coverURL || "",
            status: dados.status || "offline",
            platform: dados.platform || "",
            favoriteGames: Array.isArray(dados.favoriteGames)
                ? dados.favoriteGames
                : [],
            badges: Array.isArray(dados.badges)
                ? dados.badges
                : [],
            posts: Array.isArray(dados.posts)
                ? dados.posts
                : [],
            postsCount: dados.postsCount || 0,
            friendsCount: dados.friendsCount || 0,
            eventsCount: dados.eventsCount || 0,
            updatedAt: new Date().toISOString()
        };

        await setDoc(
            doc(db, "publicUsers", user.uid),
            perfilPublico
        );

    } catch (error) {
        console.error("Erro ao preparar perfil público:", error);
    }

    carregarEstatisticas();
});

// ESTATÍSTICAS

async function carregarEstatisticas() {
    try {
        const usuarios = await getCountFromServer(
            collection(db, "publicUsers")
        );

        $("#totalUsers").textContent = usuarios.data().count;

    } catch (error) {
        console.error("Erro ao contar jogadores:", error);
    }

    try {
        const lobbies = await getCountFromServer(
            collection(db, "lobbies")
        );

        $("#totalLobbies").textContent = lobbies.data().count;

    } catch (error) {
        console.error("Erro ao contar lobbies:", error);
    }

    try {
        const eventos = await getCountFromServer(
            collection(db, "events")
        );

        $("#totalEvents").textContent = eventos.data().count;

    } catch (error) {
        console.error("Erro ao contar eventos:", error);
    }
}

// BUSCA DE JOGADORES

const searchInput = $("#searchInput");
const searchResults = $("#searchResults");

let temporizadorBusca = null;
let ultimaBusca = 0;

function mostrarMensagemBusca(texto) {
    searchResults.replaceChildren();

    const mensagem = document.createElement("div");
    mensagem.className = "search-message";
    mensagem.textContent = texto;

    searchResults.appendChild(mensagem);
    searchResults.classList.add("visible");
}

function criarResultado(usuario) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "search-result";
    botao.setAttribute("role", "option");

    const foto = usuario.photoURL;

    if (
        typeof foto === "string" &&
        foto.startsWith("https://")
    ) {
        const imagem = document.createElement("img");
        imagem.src = foto;
        imagem.alt = "";
        imagem.loading = "lazy";
        botao.appendChild(imagem);
    } else {
        const avatar = document.createElement("div");
        avatar.className = "search-avatar";
        avatar.textContent = "👤";
        botao.appendChild(avatar);
    }

    const informacoes = document.createElement("div");
    informacoes.className = "search-result-info";

    const nome = document.createElement("strong");
    nome.textContent = usuario.name || "Jogador";

    const bio = document.createElement("small");
    bio.textContent = usuario.bio || "Sem biografia";

    informacoes.append(nome, bio);
    botao.appendChild(informacoes);

    botao.addEventListener("click", () => {
        window.location.href =
            `perfil-publico.html?uid=${encodeURIComponent(usuario.uid)}`;
    });

    return botao;
}

async function pesquisarJogadores(termo) {
    const numeroBusca = ++ultimaBusca;

    if (termo.length < 2) {
        searchResults.classList.remove("visible");
        searchResults.replaceChildren();
        return;
    }

    mostrarMensagemBusca("Pesquisando jogadores...");

    try {
        const termoNormalizado = termo.toLocaleLowerCase("pt-BR");

        const consulta = query(
            collection(db, "publicUsers"),
            orderBy("nameLower"),
            startAt(termoNormalizado),
            endAt(termoNormalizado + "\uf8ff"),
            limit(8)
        );

        const resultado = await getDocs(consulta);

        // Evita que uma pesquisa antiga substitua uma mais recente.
        if (numeroBusca !== ultimaBusca) return;

        searchResults.replaceChildren();

        if (resultado.empty) {
            mostrarMensagemBusca("Nenhum jogador encontrado.");
            return;
        }

        resultado.forEach((documento) => {
            const usuario = documento.data();

            if (!usuario.uid) return;

            searchResults.appendChild(
                criarResultado(usuario)
            );
        });

        searchResults.classList.add("visible");

    } catch (error) {
        console.error("Erro na busca:", error);
        mostrarMensagemBusca(
            "Não foi possível pesquisar. Verifique as regras do Firestore."
        );
    }
}

searchInput.addEventListener("input", () => {
    clearTimeout(temporizadorBusca);

    const termo = searchInput.value.trim();

    temporizadorBusca = setTimeout(() => {
        pesquisarJogadores(termo);
    }, 300);
});

// Fecha os resultados ao clicar fora da busca.
document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-wrap")) {
        searchResults.classList.remove("visible");
    }
});

searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim().length >= 2) {
        pesquisarJogadores(searchInput.value.trim());
    }
});

// TEMA CLARO E ESCURO

const themeToggle = $("#themeToggle");

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

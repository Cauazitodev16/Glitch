
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDdGZsfDOqY7xqI_Nd4pUc52PkXH0Hjt0g",
  authDomain: "meetq-9b370.firebaseapp.com",
  projectId: "meetq-9b370",
  storageBucket: "meetq-9b370.firebasestorage.app",
  messagingSenderId: "889397323612",
  appId: "1:889397323612:web:fb375053f9cb15e7168399"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (seletor) => document.querySelector(seletor);

function imagemSegura(url) {
    if (typeof url !== "string" || !url.trim()) return "";

    try {
        const endereco = new URL(url);
        return endereco.protocol === "https:" ? endereco.href : "";
    } catch {
        return "";
    }
}

function texto(seletor, valor) {
    const elemento = $(seletor);
    if (elemento) elemento.textContent = valor ?? "";
}

function mostrarMensagem(valor) {
    const mensagem = $("#profileMessage");
    mensagem.textContent = valor;
    mensagem.hidden = false;
    $("#profileContent").hidden = true;
}

function criarElemento(tag, classe, conteudo) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (conteudo !== undefined) elemento.textContent = conteudo;
    return elemento;
}

function renderizarAvatar(dados) {
    const avatar = $("#publicAvatar");
    avatar.replaceChildren();

    const foto = imagemSegura(dados.photoURL);

    if (foto) {
        const imagem = document.createElement("img");
        imagem.src = foto;
        imagem.alt = "Foto de perfil";
        avatar.appendChild(imagem);
    } else {
        avatar.textContent = "👤";
    }
}

function renderizarCapa(dados) {
    const capa = $("#publicCover");
    const url = imagemSegura(dados.coverURL);

    capa.style.backgroundImage = url ? `url("${url}")` : "";
}

function renderizarStatus(dados) {
    const status = dados.status || "offline";

    const nomes = {
        online: "● Disponível",
        away: "● Ausente",
        offline: "● Offline"
    };

    const badge = $("#publicStatus");
    badge.textContent = nomes[status] || nomes.offline;
    badge.className = `status-badge status-${status}`;

    const plataforma = dados.platform || "";
    const textoPlataforma = plataforma
        ? `🎮 ${plataforma}`
        : "🎮 Plataforma não definida";

    texto("#publicPlatform", textoPlataforma);
    texto("#publicPlatformInfo", textoPlataforma);
    texto("#publicStatusInfo", nomes[status] || nomes.offline);
}

function renderizarJogos(jogos) {
    const container = $("#publicGames");
    container.replaceChildren();

    if (!jogos.length) {
        container.textContent = "Nenhum jogo adicionado.";
        return;
    }

    jogos.forEach((jogo) => {
        const nome = typeof jogo === "string" ? jogo : jogo?.name;
        const imagem = typeof jogo === "object"
            ? imagemSegura(jogo.imageURL)
            : "";

        if (!nome) return;

        const card = criarElemento("article", "game-card");

        if (imagem) {
            const img = document.createElement("img");
            img.src = imagem;
            img.alt = nome;
            img.loading = "lazy";
            card.appendChild(img);
        } else {
            card.appendChild(
                criarElemento("div", "game-placeholder", "🎮")
            );
        }

        card.appendChild(criarElemento("p", "", nome));
        container.appendChild(card);
    });
}

function renderizarEmblemas(emblemas) {
    const container = $("#publicBadges");
    container.replaceChildren();

    if (!emblemas.length) {
        container.textContent = "Nenhum emblema selecionado.";
        return;
    }

    const nomes = {
        first_post: "✍️ Primeira publicação",
        explorer: "🧭 Explorador",
        team_player: "🤝 Espírito de equipe",
        game_master: "🏆 Mestre dos jogos",
        creator: "🎨 Criador"
    };

    emblemas.forEach((emblema) => {
        const item = criarElemento("span", "", nomes[emblema] || emblema);
        item.style.padding = "10px 13px";
        item.style.background = "var(--surface-2)";
        item.style.border = "1px solid var(--border)";
        item.style.borderRadius = "10px";
        item.style.fontSize = "13px";
        container.appendChild(item);
    });
}

function renderizarPublicacoes(publicacoes, dados) {
    const container = $("#publicPosts");
    container.replaceChildren();

    if (!publicacoes.length) {
        container.appendChild(
            criarElemento("p", "empty-message", "Nenhuma publicação ainda.")
        );
        return;
    }

    [...publicacoes].reverse().forEach((post) => {
        const artigo = criarElemento("article", "post-card");

        const autor = criarElemento("div", "post-author");

        const foto = imagemSegura(dados.photoURL);
        if (foto) {
            const avatar = document.createElement("img");
            avatar.className = "post-avatar";
            avatar.src = foto;
            avatar.alt = "";
            autor.appendChild(avatar);
        }

        const nome = criarElemento(
            "strong",
            "",
            post.author || dados.name || dados.displayName || "Jogador"
        );

        autor.appendChild(nome);

        const textoPost = criarElemento("p", "post-text", post.text || "");
        artigo.append(autor, textoPost);

        const imagemURL = imagemSegura(post.imageURL);

        if (imagemURL) {
            const imagem = document.createElement("img");
            imagem.className = "post-image";
            imagem.src = imagemURL;
            imagem.alt = "Imagem da publicação";
            imagem.loading = "lazy";
            artigo.appendChild(imagem);
        }

        container.appendChild(artigo);
    });
}

async function carregarPerfilPublico(uid) {
    const referencia = doc(db, "publicUsers", uid);
    const resultado = await getDoc(referencia);

    if (!resultado.exists()) {
        throw new Error("Perfil público não encontrado.");
    }

    const dados = resultado.data();

    texto("#publicName", dados.name || dados.displayName || "Jogador");
    texto(
        "#publicBio",
        dados.bio || "Este jogador ainda não adicionou uma biografia."
    );
    texto(
        "#publicAbout",
        dados.about || "Ainda não adicionou informações."
    );

    const jogos = Array.isArray(dados.favoriteGames)
        ? dados.favoriteGames
        : [];

    const emblemas = Array.isArray(dados.badges)
        ? dados.badges
        : [];

    const publicacoes = Array.isArray(dados.posts)
        ? dados.posts
        : [];

    texto("#publicPostsCount", dados.postsCount ?? publicacoes.length);
    texto("#publicFriendsCount", dados.friendsCount ?? 0);
    texto("#publicEventsCount", dados.eventsCount ?? 0);

    renderizarAvatar(dados);
    renderizarCapa(dados);
    renderizarStatus(dados);
    renderizarJogos(jogos);
    renderizarEmblemas(emblemas);
    renderizarPublicacoes(publicacoes, dados);

    if (dados.accentColor && /^#[0-9a-fA-F]{6}$/.test(dados.accentColor)) {
        document.documentElement.style.setProperty("--accent", dados.accentColor);
    }

    $("#profileMessage").hidden = true;
    $("#profileContent").hidden = false;

    document.title = `${dados.name || dados.displayName || "Jogador"} | Glitch`;
}

function aplicarTema() {
    const tema = localStorage.getItem("tema") || "dark";
    document.body.classList.toggle("light-theme", tema === "light");
}

aplicarTema();

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("index.html");
        return;
    }

    const parametros = new URLSearchParams(window.location.search);
    const uid = parametros.get("uid");

    if (!uid) {
        mostrarMensagem("Não foi informado qual perfil deseja visualizar.");
        return;
    }

    try {
        await carregarPerfilPublico(uid);
    } catch (erro) {
        console.error("Erro ao carregar perfil público:", erro);

        mostrarMensagem(
            "Não foi possível carregar esse perfil. Verifique se o jogador já possui um perfil público."
        );
    }
});

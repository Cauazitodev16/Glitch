
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDdGZsfDOqY7xqI_Nd4pUc52PkXH0Hjt0g",
  authDomain: "meetq-9b370.firebaseapp.com",
  projectId: "meetq-9b370",
  storageBucket: "meetq-9b370.firebasestorage.app",
  messagingSenderId: "889397323612",
  appId: "1:889397323612:web:fb375053f9cb15e7168399"
};
// Reutiliza o app Firebase, caso já exista.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

let usuarioAtual = null;
let dadosPerfil = null;
let perfilCarregado = false;

const $ = (seletor) => document.querySelector(seletor);

function mensagem(seletor, texto) {
    const elemento = $(seletor);
    if (elemento) elemento.textContent = texto;
}

function imagemSegura(url) {
    if (!url || typeof url !== "string") return "";

    try {
        const endereco = new URL(url);
        return endereco.protocol === "https:" ? endereco.href : "";
    } catch {
        return "";
    }
}

function atualizarTexto(seletor, texto) {
    const elemento = $(seletor);
    if (elemento) elemento.textContent = texto ?? "";
}

function referenciaPerfil() {
    return doc(db, "users", usuarioAtual.uid);
}

async function salvarDados(dados) {
    if (!usuarioAtual || !dadosPerfil) {
        throw new Error("Perfil ainda não carregado.");
    }

    await updateDoc(referenciaPerfil(), dados);
    Object.assign(dadosPerfil, dados);
}

// CARREGAR PERFIL
async function carregarPerfil(user) {
    const referencia = doc(db, "users", user.uid);
    const resultado = await getDoc(referencia);

    if (resultado.exists()) {
        dadosPerfil = resultado.data();
    } else {
        dadosPerfil = {
            uid: user.uid,
            name: user.displayName || "Jogador",
            email: user.email || "",
            bio: "",
            about: "",
            photoURL: user.photoURL || "",
            coverURL: "",
            status: "offline",
            platform: "",
            accentColor: "#ff7a18",
            favoriteGames: [],
            badges: [],
            posts: [],
            postsCount: 0,
            friendsCount: 0,
            eventsCount: 0
        };

        await setDoc(referencia, dadosPerfil);
    }

    renderizarPerfil();
    perfilCarregado = true;
}

// RENDERIZAR PERFIL
function renderizarPerfil() {
    if (!dadosPerfil) return;

    atualizarTexto("#username", dadosPerfil.name || "Jogador");
    atualizarTexto("#userBio", dadosPerfil.bio || "Adicione uma biografia.");
    atualizarTexto("#aboutText", dadosPerfil.about || "Ainda não adicionou informações.");

    const posts = Array.isArray(dadosPerfil.posts) ? dadosPerfil.posts : [];

    atualizarTexto("#postsCount", dadosPerfil.postsCount ?? posts.length);
    atualizarTexto("#friendsCount", dadosPerfil.friendsCount ?? 0);
    atualizarTexto("#eventsCount", dadosPerfil.eventsCount ?? 0);

    const status = dadosPerfil.status || "offline";
    const statusBadge = $("#statusBadge");

    if (statusBadge) {
        const nomes = {
            online: "● Disponível",
            away: "● Ausente",
            offline: "● Offline"
        };

        statusBadge.textContent = nomes[status] || "● Offline";
        statusBadge.className = `status-badge status-${status}`;
    }

    const plataforma = dadosPerfil.platform || "";

    atualizarTexto(
        "#platformBadge",
        plataforma ? `🎮 ${plataforma}` : "🎮 Plataforma não definida"
    );

    const avatar = $("#avatar");
    const foto = imagemSegura(dadosPerfil.photoURL);

    if (avatar) {
        avatar.replaceChildren();

        if (foto) {
            const img = document.createElement("img");
            img.src = foto;
            img.alt = "Foto de perfil";
            avatar.appendChild(img);
        } else {
            avatar.textContent = "👤";
        }
    }

    const capa = imagemSegura(dadosPerfil.coverURL);
    const cover = $("#cover");

    if (cover) {
        cover.style.backgroundImage = capa ? `url("${capa}")` : "";
    }

    if ($("#statusSelect")) $("#statusSelect").value = status;
    if ($("#platformSelect")) $("#platformSelect").value = plataforma;

    if ($("#accentColor")) {
        $("#accentColor").value = dadosPerfil.accentColor || "#ff7a18";

        document.documentElement.style.setProperty(
            "--accent",
            $("#accentColor").value
        );
    }

    renderizarJogos();
    renderizarEmblemas();
    renderizarPublicacoes();
}

// EDITAR PERFIL
$("#editProfileBtn")?.addEventListener("click", async () => {
    if (!dadosPerfil) return;

    const nome = prompt("Qual nome deseja usar?", dadosPerfil.name || "");
    if (nome === null) return;

    const bio = prompt("Escreva sua biografia:", dadosPerfil.bio || "");
    if (bio === null) return;

    const sobre = prompt("Conte um pouco sobre você:", dadosPerfil.about || "");
    if (sobre === null) return;

    try {
        await salvarDados({
            name: nome.trim() || "Jogador",
            bio: bio.trim(),
            about: sobre.trim()
        });

        renderizarPerfil();
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível salvar seu perfil.");
    }
});

// FOTO DE PERFIL
$("#previewPhotoBtn")?.addEventListener("click", () => {
    const url = imagemSegura($("#photoUrlInput")?.value.trim());

    if (!url) {
        mensagem("#photoMessage", "Insira um link HTTPS válido.");
        return;
    }

    const preview = $("#photoPreview");
    preview.src = url;
    preview.hidden = false;
    mensagem("#photoMessage", "Prévia carregada.");
});

$("#savePhotoBtn")?.addEventListener("click", async () => {
    const url = imagemSegura($("#photoUrlInput")?.value.trim());

    if (!url) {
        mensagem("#photoMessage", "Insira um link HTTPS válido.");
        return;
    }

    try {
        await salvarDados({ photoURL: url });
        renderizarPerfil();
        mensagem("#photoMessage", "Foto salva com sucesso!");
    } catch (erro) {
        console.error(erro);
        mensagem("#photoMessage", "Não foi possível salvar a foto.");
    }
});

// CAPA
$("#previewCoverBtn")?.addEventListener("click", () => {
    const url = imagemSegura($("#coverUrlInput")?.value.trim());

    if (!url) {
        mensagem("#coverMessage", "Insira um link HTTPS válido.");
        return;
    }

    const preview = $("#coverPreview");
    preview.src = url;
    preview.hidden = false;
    mensagem("#coverMessage", "Prévia carregada.");
});

$("#saveCoverBtn")?.addEventListener("click", async () => {
    const url = imagemSegura($("#coverUrlInput")?.value.trim());

    if (!url) {
        mensagem("#coverMessage", "Insira um link HTTPS válido.");
        return;
    }

    try {
        await salvarDados({ coverURL: url });
        renderizarPerfil();
        mensagem("#coverMessage", "Capa salva com sucesso!");
    } catch (erro) {
        console.error(erro);
        mensagem("#coverMessage", "Não foi possível salvar a capa.");
    }
});

// PREFERÊNCIAS
$("#savePreferencesBtn")?.addEventListener("click", async () => {
    const status = $("#statusSelect")?.value || "offline";
    const platform = $("#platformSelect")?.value || "";
    const accentColor = $("#accentColor")?.value || "#ff7a18";

    try {
        await salvarDados({ status, platform, accentColor });

        document.documentElement.style.setProperty("--accent", accentColor);

        renderizarPerfil();
        mensagem("#preferencesMessage", "Preferências salvas!");
    } catch (erro) {
        console.error(erro);
        mensagem("#preferencesMessage", "Erro ao salvar preferências.");
    }
});

// JOGOS FAVORITOS
function renderizarJogos() {
    const container = $("#favoriteGames");
    if (!container) return;

    container.replaceChildren();

    const jogos = Array.isArray(dadosPerfil.favoriteGames)
        ? dadosPerfil.favoriteGames
        : [];

    if (!jogos.length) {
        container.textContent = "Nenhum jogo adicionado.";
        return;
    }

    jogos.forEach((jogo, indice) => {
        const card = document.createElement("div");
        card.className = "game-card";

        const nome = typeof jogo === "string" ? jogo : jogo.name;
        const imagem = typeof jogo === "object" ? imagemSegura(jogo.imageURL) : "";

        if (imagem) {
            const img = document.createElement("img");
            img.src = imagem;
            img.alt = nome || "Jogo favorito";
            img.loading = "lazy";
            card.appendChild(img);
        } else {
            const placeholder = document.createElement("div");
            placeholder.className = "game-placeholder";
            placeholder.textContent = "🎮";
            card.appendChild(placeholder);
        }

        const titulo = document.createElement("p");
        titulo.textContent = nome || "Jogo";
        card.appendChild(titulo);

        const remover = document.createElement("button");
        remover.type = "button";
        remover.className = "remove-game";
        remover.textContent = "×";
        remover.setAttribute("aria-label", "Remover jogo");
        remover.addEventListener("click", () => removerJogo(indice));

        card.appendChild(remover);
        container.appendChild(card);
    });
}

$("#addGameBtn")?.addEventListener("click", async () => {
    if (!dadosPerfil) return;

    const nome = $("#gameNameInput")?.value.trim();
    const imagemInformada = $("#gameImageInput")?.value.trim();

    if (!nome) {
        mensagem("#gamesMessage", "Digite o nome do jogo.");
        return;
    }

    if (imagemInformada && !imagemSegura(imagemInformada)) {
        mensagem("#gamesMessage", "O link da imagem precisa ser HTTPS.");
        return;
    }

    const jogos = [...(dadosPerfil.favoriteGames || [])];

    jogos.push({
        name: nome,
        imageURL: imagemSegura(imagemInformada)
    });

    try {
        await salvarDados({ favoriteGames: jogos });

        $("#gameNameInput").value = "";
        $("#gameImageInput").value = "";

        renderizarJogos();
        mensagem("#gamesMessage", "Jogo adicionado!");
    } catch (erro) {
        console.error(erro);
        mensagem("#gamesMessage", "Não foi possível adicionar o jogo.");
    }
});

async function removerJogo(indice) {
    const jogos = [...(dadosPerfil.favoriteGames || [])];
    jogos.splice(indice, 1);

    try {
        await salvarDados({ favoriteGames: jogos });
        renderizarJogos();
        mensagem("#gamesMessage", "Jogo removido.");
    } catch (erro) {
        console.error(erro);
        mensagem("#gamesMessage", "Não foi possível remover o jogo.");
    }
}

// EMBLEMAS
function renderizarEmblemas() {
    const selecionados = dadosPerfil.badges || [];

    document.querySelectorAll("#badgesList input[type='checkbox']").forEach((checkbox) => {
        checkbox.checked = selecionados.includes(checkbox.value);
    });
}

$("#saveBadgesBtn")?.addEventListener("click", async () => {
    const badges = Array.from(
        document.querySelectorAll("#badgesList input[type='checkbox']:checked")
    ).map((checkbox) => checkbox.value);

    try {
        await salvarDados({ badges });
        mensagem("#badgesMessage", "Emblemas salvos!");
    } catch (erro) {
        console.error(erro);
        mensagem("#badgesMessage", "Não foi possível salvar os emblemas.");
    }
});

// PUBLICAÇÕES POR LINK DE IMAGEM
function renderizarPublicacoes() {
    const container = $("#postsList");
    if (!container) return;

    container.replaceChildren();

    const posts = Array.isArray(dadosPerfil.posts) ? dadosPerfil.posts : [];

    if (!posts.length) {
        const vazio = document.createElement("p");
        vazio.className = "empty-message";
        vazio.textContent = "Nenhuma publicação ainda.";
        container.appendChild(vazio);
        return;
    }

    [...posts].reverse().forEach((post) => {
        const artigo = document.createElement("article");
        artigo.className = "post-card";

        const autor = document.createElement("div");
        autor.className = "post-author";

        const nomeAutor = document.createElement("strong");
        nomeAutor.textContent = post.author || dadosPerfil.name || "Jogador";
        autor.appendChild(nomeAutor);

        const texto = document.createElement("p");
        texto.className = "post-text";
        texto.textContent = post.text || "";

        artigo.append(autor, texto);

        const imagemUrl = imagemSegura(post.imageURL);

        if (imagemUrl) {
            const imagem = document.createElement("img");
            imagem.className = "post-image";
            imagem.src = imagemUrl;
            imagem.alt = "Imagem da publicação";
            imagem.loading = "lazy";
            artigo.appendChild(imagem);
        }

        container.appendChild(artigo);
    });
}

$("#publishPostBtn")?.addEventListener("click", async () => {
    if (!dadosPerfil) return;

    const texto = $("#postTextInput")?.value.trim();
    const imagemInformada = $("#postImageInput")?.value.trim();

    if (!texto && !imagemInformada) {
        mensagem("#postMessage", "Escreva algo ou adicione um link de imagem.");
        return;
    }

    if (imagemInformada && !imagemSegura(imagemInformada)) {
        mensagem("#postMessage", "O link da imagem precisa ser HTTPS.");
        return;
    }

    const posts = [...(dadosPerfil.posts || [])];

    posts.push({
        text: texto,
        imageURL: imagemSegura(imagemInformada),
        author: dadosPerfil.name || "Jogador",
        createdAt: new Date().toISOString()
    });

    try {
        await salvarDados({
            posts,
            postsCount: posts.length
        });

        $("#postTextInput").value = "";
        $("#postImageInput").value = "";

        renderizarPublicacoes();
        atualizarTexto("#postsCount", posts.length);
        mensagem("#postMessage", "Publicação criada!");
    } catch (erro) {
        console.error(erro);
        mensagem("#postMessage", "Não foi possível publicar.");
    }
});

// TEMA
const themeToggle = $("#themeToggle");

function aplicarTema(tema) {
    document.body.classList.toggle("light-theme", tema === "light");

    if (themeToggle) {
        themeToggle.textContent = tema === "light"
            ? "🌙 Modo escuro"
            : "☀️ Modo claro";
    }
}

const temaSalvo = localStorage.getItem("tema") || "dark";
aplicarTema(temaSalvo);

themeToggle?.addEventListener("click", () => {
    const novoTema = document.body.classList.contains("light-theme")
        ? "dark"
        : "light";

    localStorage.setItem("tema", novoTema);
    aplicarTema(novoTema);
});

// SAIR
$("#logoutBtn")?.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.replace("index.html");
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível sair da conta.");
    }
});

// AUTENTICAÇÃO
async function iniciarAutenticacao() {
    try {
        await setPersistence(auth, browserLocalPersistence);

        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // Só redireciona depois da verificação inicial do Firebase.
                if (!perfilCarregado) {
                    window.location.replace("index.html");
                }
                return;
            }

            usuarioAtual = user;

            try {
                await carregarPerfil(user);
            } catch (erro) {
                console.error("Erro ao carregar perfil:", erro);
                alert("Não foi possível carregar os dados do perfil. Verifique as regras do Firestore.");
            }
        });
    } catch (erro) {
        console.error("Erro ao iniciar autenticação:", erro);
        alert("Não foi possível verificar sua sessão. Confira a configuração do Firebase.");
    }
}

iniciarAutenticacao();


import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// CONFIGURAÇÃO FIREBASE
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

// ELEMENTOS
const userSearch = document.getElementById("userSearch");
const searchResults = document.getElementById("searchResults");
const conversationList = document.getElementById("conversationList");

const chatEmpty = document.getElementById("chatEmpty");
const chatActive = document.getElementById("chatActive");
const chatContainer = document.querySelector(".chat-container");

const chatAvatar = document.getElementById("chatAvatar");
const chatName = document.getElementById("chatName");

const messagesList = document.getElementById("messagesList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const messageStatus = document.getElementById("messageStatus");

// ESTADO
let currentUser = null;
let currentUserName = "Jogador";
let currentUserPhoto = "";

let publicPlayers = [];
let conversations = [];
let activeConversationId = null;

let unsubscribeConversations = null;
let unsubscribeMessages = null;

// ID DA CONVERSA PARA DIAGNÓSTICO
const conversationIdTeste =
    "Ti7UYdyEj4ht9fZv59jjwYFclN03__dNrMvvXzRCShyIYAPBeESWZr6JH2";

// IMAGENS SEGURAS
function imagemSegura(url) {
    if (typeof url !== "string") return "";

    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" ? parsed.href : "";
    } catch {
        return "";
    }
}

function nomeDoJogador(data = {}) {
    return data.displayName || data.name || "Jogador";
}

function fotoDoJogador(data = {}) {
    return imagemSegura(data.photoURL || "");
}

function criarAvatar(url, nome) {
    const img = document.createElement("img");

    img.alt = `Foto de ${nome}`;
    img.src = fotoDoJogador({ photoURL: url }) ||
        "assets/avatar-padrao.png";

    img.onerror = () => {
        img.removeAttribute("src");
        img.alt = "Avatar não disponível";
    };

    return img;
}

// CARREGAR DADOS DO USUÁRIO
async function carregarDadosDoUsuario() {
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const data = userSnap.data();

        currentUserName = nomeDoJogador(data);
        currentUserPhoto = fotoDoJogador(data);
    } else {
        currentUserName = currentUser.displayName || "Jogador";
        currentUserPhoto = imagemSegura(currentUser.photoURL || "");
    }
}

// CARREGAR JOGADORES PÚBLICOS
async function carregarJogadores() {
    const snapshot = await getDocs(collection(db, "publicUsers"));

    publicPlayers = snapshot.docs
        .filter(player => player.id !== currentUser.uid)
        .map(player => ({
            uid: player.id,
            ...player.data()
        }));
}

// PESQUISAR JOGADORES
function pesquisarJogadores() {
    const termo = userSearch.value.trim().toLowerCase();

    searchResults.replaceChildren();

    if (termo.length < 2) {
        searchResults.classList.remove("visible");
        return;
    }

    const encontrados = publicPlayers
        .filter(player =>
            nomeDoJogador(player).toLowerCase().includes(termo)
        )
        .slice(0, 10);

    searchResults.classList.add("visible");

    if (!encontrados.length) {
        const mensagem = document.createElement("p");
        mensagem.className = "empty-state";
        mensagem.textContent = "Nenhum jogador encontrado.";
        searchResults.appendChild(mensagem);
        return;
    }

    encontrados.forEach(player => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "search-user";

        button.appendChild(
            criarAvatar(player.photoURL, nomeDoJogador(player))
        );

        const info = document.createElement("span");

        const nome = document.createElement("strong");
        nome.textContent = nomeDoJogador(player);

        const plataforma = document.createElement("small");
        plataforma.textContent = player.platform || "Jogador do Glitch";

        info.append(nome, plataforma);
        button.appendChild(info);

        button.addEventListener("click", () => {
            iniciarConversa(player);
        });

        searchResults.appendChild(button);
    });
}

// ID ÚNICO DA CONVERSA
function criarIdConversa(uid1, uid2) {
    return [uid1, uid2].sort().join("__");
}

// INICIAR OU ABRIR CONVERSA
async function iniciarConversa(player) {
    if (!currentUser || !player?.uid) return;
    if (player.uid === currentUser.uid) return;

    const conversationId = criarIdConversa(
        currentUser.uid,
        player.uid
    );

    const conversationRef = doc(db, "conversations", conversationId);

    const members = [
        currentUser.uid,
        player.uid
    ];

    const memberNames = {
        [currentUser.uid]: currentUserName,
        [player.uid]: nomeDoJogador(player)
    };

    const memberPhotos = {
        [currentUser.uid]: currentUserPhoto,
        [player.uid]: fotoDoJogador(player)
    };

    try {
        await setDoc(conversationRef, {
            members,
            memberNames,
            memberPhotos
        }, { merge: true });

        const conversation = {
            id: conversationId,
            members,
            memberNames,
            memberPhotos
        };

        const index = conversations.findIndex(
            item => item.id === conversationId
        );

        if (index >= 0) {
            conversations[index] = {
                ...conversations[index],
                ...conversation
            };
        } else {
            conversations.unshift(conversation);
        }

        userSearch.value = "";
        searchResults.classList.remove("visible");

        renderizarConversas();
        abrirConversa(conversation, player);

    } catch (error) {
        console.error("Erro ao iniciar conversa:", error);
        alert("Não foi possível iniciar a conversa. Verifique as regras do Firestore.");
    }
}

// ABRIR CONVERSA
function abrirConversa(conversation, player = null) {
    activeConversationId = conversation.id;

    const otherUid = conversation.members.find(
        uid => uid !== currentUser.uid
    );

    const otherPlayer = player ||
        publicPlayers.find(item => item.uid === otherUid);

    const nome = conversation.memberNames?.[otherUid] ||
        (otherPlayer ? nomeDoJogador(otherPlayer) : "Jogador");

    const foto = conversation.memberPhotos?.[otherUid] ||
        (otherPlayer ? fotoDoJogador(otherPlayer) : "");

    chatName.textContent = nome;

    chatAvatar.src = foto || "assets/avatar-padrao.png";
    chatAvatar.alt = `Foto de ${nome}`;

    chatAvatar.onerror = () => {
        chatAvatar.removeAttribute("src");
    };

    chatEmpty.hidden = true;
    chatActive.hidden = false;

    chatContainer.classList.add("mobile-chat-open");

    messageStatus.textContent = "";

    carregarMensagens(conversation.id);
    renderizarConversas();
}

// CARREGAR MENSAGENS EM TEMPO REAL
function carregarMensagens(conversationId) {
    if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
    }

    messagesList.replaceChildren();

    const messagesRef = collection(
        db,
        "conversations",
        conversationId,
        "messages"
    );

    const messagesQuery = query(
        messagesRef,
        orderBy("createdAt", "asc")
    );

    unsubscribeMessages = onSnapshot(
        messagesQuery,
        snapshot => {
            const estavaNoFinal =
                messagesList.scrollHeight -
                messagesList.scrollTop -
                messagesList.clientHeight < 100;

            messagesList.replaceChildren();

            if (snapshot.empty) {
                const empty = document.createElement("p");
                empty.className = "empty-state";
                empty.textContent =
                    "Esta conversa ainda não tem mensagens.";

                messagesList.appendChild(empty);
                return;
            }

            snapshot.forEach(messageDoc => {
                const message = messageDoc.data();

                const bubble = document.createElement("div");
                bubble.className = "message-bubble";

                if (message.senderId === currentUser.uid) {
                    bubble.classList.add("mine");
                }

                const text = document.createElement("p");
                text.textContent = message.text || "";

                const time = document.createElement("time");

                if (message.createdAt?.toDate) {
                    time.textContent = message.createdAt
                        .toDate()
                        .toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit"
                        });
                } else {
                    time.textContent = "Enviando...";
                }

                bubble.append(text, time);
                messagesList.appendChild(bubble);
            });

            if (estavaNoFinal) {
                messagesList.scrollTop = messagesList.scrollHeight;
            }
        },
        error => {
            console.error("Erro ao carregar mensagens:", error);

            messageStatus.textContent =
                "Não foi possível carregar as mensagens.";
        }
    );
}

// ENVIAR MENSAGEM
messageForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentUser || !activeConversationId) return;

    const text = messageInput.value.trim();

    if (!text) return;

    if (text.length > 2000) {
        messageStatus.textContent =
            "A mensagem ultrapassou o limite permitido.";
        return;
    }

    sendMessageBtn.disabled = true;
    messageStatus.textContent = "";

    try {
        const conversationRef = doc(
            db,
            "conversations",
            activeConversationId
        );

        const messagesRef = collection(
            conversationRef,
            "messages"
        );

        const messageRef = doc(messagesRef);

        const batch = writeBatch(db);

        batch.set(messageRef, {
            text,
            senderId: currentUser.uid,
            createdAt: serverTimestamp()
        });

        batch.update(conversationRef, {
            lastMessage: text,
            lastSenderId: currentUser.uid,
            lastMessageAt: serverTimestamp()
        });

        await batch.commit();

        messageInput.value = "";
        messageInput.focus();

    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);

        messageStatus.textContent =
            "Erro ao enviar. Tente novamente.";
    } finally {
        sendMessageBtn.disabled = false;
    }
});

// TESTE 1: LER UM DOCUMENTO ESPECÍFICO
async function testarLeituraConversa() {
    console.log("========== TESTE 1: GETDOC ==========");
    console.log("Projeto Firebase:", app.options.projectId);
    console.log("UID autenticado:", currentUser.uid);

    try {
        const conversationRef = doc(
            db,
            "conversations",
            conversationIdTeste
        );

        const teste = await getDoc(conversationRef);

        console.log("Documento encontrado:", teste.exists());

        if (teste.exists()) {
            console.log(
                "Participantes encontrados:",
                teste.data().members
            );
        }

        console.log("========== FIM TESTE 1 ==========");

    } catch (error) {
        console.error("Erro no teste de leitura:", error);
        console.error("Código:", error.code);
        console.error("Mensagem:", error.message);
    }
}

// TESTE 2: CONSULTAR CONVERSAS COM GETDOCS
async function testarConsultaConversas() {
    console.log("========== TESTE 2: GETDOCS ==========");
    console.log("UID usado na consulta:", currentUser.uid);

    try {
        const testeQuery = query(
            collection(db, "conversations"),
            where("members", "array-contains", currentUser.uid)
        );

        const resultado = await getDocs(testeQuery);

        console.log("Consulta autorizada!");
        console.log("Quantidade de conversas:", resultado.size);

        resultado.forEach(item => {
            console.log("ID da conversa:", item.id);
            console.log("Participantes:", item.data().members);
        });

        console.log("========== FIM TESTE 2 ==========");

        return true;

    } catch (error) {
        console.error("Falha no teste getDocs:", error);
        console.error("Código do erro:", error.code);
        console.error("Mensagem:", error.message);

        console.log("========== FIM TESTE 2 COM ERRO ==========");

        return false;
    }
}

// CARREGAR CONVERSAS EM TEMPO REAL
function carregarConversas() {
    const conversationsRef = collection(db, "conversations");

    const conversationsQuery = query(
        conversationsRef,
        where("members", "array-contains", currentUser.uid)
    );

    console.log("UID usado na consulta em tempo real:", currentUser.uid);

    unsubscribeConversations = onSnapshot(
        conversationsQuery,
        snapshot => {
            conversations = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

            conversations.sort((a, b) => {
                const dateA = a.lastMessageAt?.toMillis?.() || 0;
                const dateB = b.lastMessageAt?.toMillis?.() || 0;

                return dateB - dateA;
            });

            renderizarConversas();
        },
        error => {
            console.error("Erro ao carregar conversas:", error);
            console.error("Código:", error.code);
            console.error("Mensagem:", error.message);

            conversationList.textContent =
                "Não foi possível carregar as conversas.";
        }
    );
}

// RENDERIZAR LISTA DE CONVERSAS
function renderizarConversas() {
    conversationList.replaceChildren();

    if (!conversations.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";

        empty.textContent =
            "Você ainda não tem conversas. Pesquise um jogador para começar.";

        conversationList.appendChild(empty);
        return;
    }

    conversations.forEach(conversation => {
        const otherUid = conversation.members?.find(
            uid => uid !== currentUser.uid
        );

        if (!otherUid) return;

        const player = publicPlayers.find(
            item => item.uid === otherUid
        );

        const name = conversation.memberNames?.[otherUid] ||
            (player ? nomeDoJogador(player) : "Jogador");

        const photo = conversation.memberPhotos?.[otherUid] ||
            (player ? fotoDoJogador(player) : "");

        const button = document.createElement("button");
        button.type = "button";
        button.className = "conversation-item";

        if (conversation.id === activeConversationId) {
            button.classList.add("selected");
        }

        button.appendChild(criarAvatar(photo, name));

        const info = document.createElement("div");
        info.className = "conversation-info";

        const title = document.createElement("strong");
        title.textContent = name;

        const preview = document.createElement("p");

        const prefix = conversation.lastSenderId === currentUser.uid
            ? "Você: "
            : "";

        preview.textContent = prefix +
            (conversation.lastMessage || "Comece uma conversa");

        info.append(title, preview);
        button.appendChild(info);

        button.addEventListener("click", () => {
            abrirConversa(conversation, player);
        });

        conversationList.appendChild(button);
    });
}

// PESQUISA
userSearch.addEventListener("input", pesquisarJogadores);

document.addEventListener("click", event => {
    if (!event.target.closest(".user-search")) {
        searchResults.classList.remove("visible");
    }
});

// AUTENTICAÇÃO
onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = user;

    try {
        await carregarDadosDoUsuario();
        await carregarJogadores();

        // TESTE 1
        await testarLeituraConversa();

        // TESTE 2
        await testarConsultaConversas();

        // LISTENER EM TEMPO REAL
        carregarConversas();

    } catch (error) {
        console.error("Erro ao inicializar mensagens:", error);
        console.error("Código:", error.code);
        console.error("Mensagem:", error.message);

        conversationList.textContent =
            "Erro ao carregar. Verifique sua conexão e as permissões.";
    }
});

// LIMPEZA DOS OUVINTES
window.addEventListener("beforeunload", () => {
    if (unsubscribeConversations) unsubscribeConversations();
    if (unsubscribeMessages) unsubscribeMessages();
});

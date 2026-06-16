import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs
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
const db = getFirestore(app);

async function carregarEstatisticas() {

    try {

        const usersSnapshot =
            await getDocs(collection(db, "users"));

        const lobbiesSnapshot =
            await getDocs(collection(db, "lobbies"));

        const eventsSnapshot =
            await getDocs(collection(db, "events"));

        document.getElementById("totalUsers").textContent =
            usersSnapshot.size;

        document.getElementById("totalLobbies").textContent =
            lobbiesSnapshot.size;

        document.getElementById("totalEvents").textContent =
            eventsSnapshot.size;

    } catch (error) {

        console.error(error);

    }

}

carregarEstatisticas();

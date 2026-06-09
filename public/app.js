console.log("script carregou");

function toggleTheme() {
    document.body.classList.toggle("light");

    const logo = document.getElementById("logo");
    const btn = document.getElementById("themeBtn");

    const isLight = document.body.classList.contains("light");

    logo.src = isLight
        ? "assets/logo-glitch-light.png"
        : "assets/logo-glitch.png";

    btn.textContent = isLight ? "🌙" : "🔅";
}
function toggleTheme() {
    document.body.classList.toggle("light");

    const logo = document.getElementById("logo");

    if (document.body.classList.contains("light")) {
        logo.src = "assets/logo-glitch-light.png";
    } else {
        logo.src = "assets/logo-glitch.png";
    }
}
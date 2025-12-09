function showSignup() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("signupForm").classList.remove("hidden");
}

function showLogin() {
    document.getElementById("signupForm").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
}

function signup() {
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const vehicle = document.getElementById("signupVehicle").value;

    if (!name || !email || !password || !vehicle) {
        alert("Please complete all fields.");
        return;
    }

    const user = { name, email, password, vehicle };
    localStorage.setItem("evUser", JSON.stringify(user));

    alert("Account created successfully!");
    showLogin();
}

function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const savedUser = JSON.parse(localStorage.getItem("evUser"));

    if (!savedUser || savedUser.email !== email || savedUser.password !== password) {
        alert("Incorrect email or password!");
        return;
    }

    window.location.href = "map.html";
}

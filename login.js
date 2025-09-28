// --- LOGIN.JS ---
// Inicializamos Firebase Auth
const auth = firebase.auth();

// Elementos del formulario
const loginButton = document.querySelector("button");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// Evento al hacer click en "Ingresar"
loginButton.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  // Iniciar sesión con Firebase
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Si todo está bien → redirige al panel
      window.location.href = "panel.html";
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
});
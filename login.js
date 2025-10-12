const auth = firebase.auth();
const loginButton = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

loginButton.addEventListener("click", (event) => {
  event.preventDefault(); // Evita que se recargue la página si está dentro de un form

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Por favor, ingresa tu correo y contraseña.",
      confirmButtonColor: "#667eea"
    });
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Usuario logueado:", userCredential.user);

      // ✅ Cartel de bienvenida
      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: "Pudiste entrar a BATA EU BATA",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
        customClass: {
          icon: "swal2-icon-custom"
        }
      }).then(() => {
        window.location.href = "formulario.html"; // Redirección igual que antes
      });
    })
    .catch((error) => {
      console.error(error);

      // ❌ Cartel de error
      Swal.fire({
        icon: "error",
        title: "Lo siento, no pudiste entrar a BATA EU BATA",
        confirmButtonText: "OK",
        confirmButtonColor: "#667eea",
        customClass: {
          icon: "swal2-icon-custom"
        }
      });
    });
});
import { auth, log_instance as log } from "./firebase.js";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const provider = new GoogleAuthProvider();
const signInBttn = document.getElementById("signIn");

// Service Worker Registration
const sw = new URL("../../service-worker.js", import.meta.url);
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(sw.href, {
      scope: "/pwa-todo-app/",
    })
    .then((_) => log.info("Service Worker Registered"))
    .catch((err) => log.error("Service Worker Error:", err));
}

function signIn() {
  signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      localStorage.setItem("email", JSON.stringify(user.email));
      window.location = "tasks.html";
    })
    .catch((error) => {
      log.error("Sign-in error:", error);
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData?.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
      alert("Failed to sign in. Please try again.");
    });
}

signInBttn.addEventListener("click", function (event) {
  signIn();
});

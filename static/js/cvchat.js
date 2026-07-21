document.addEventListener("DOMContentLoaded", () => {

    // ELEMENTOS
    const messagesBox = document.querySelector(".cvchat-messages");
    const input = document.querySelector(".cvchat-input");
    const sendBtn = document.querySelector(".cvchat-send-btn");
    const welcome = document.querySelector(".cvchat-welcome");

    // Autosize
    autosize(input);

    // AÑADE MENSAJE AL CHAT
    function addMessage(text, sender = "user") {

        if (welcome) welcome.style.display = "none";

        const msg = document.createElement("div");
        msg.className = sender === "user"
            ? "cvchat-message cvchat-user"
            : "cvchat-message cvchat-bot";

        msg.textContent = text;
        messagesBox.appendChild(msg);

        animateMessage(msg);
        scrollToBottom();
    }

    // ANIMACIÓN
    function animateMessage(el) {
        gsap.from(el, {
            opacity: 0,
            y: 18,
            duration: 0.35,
            ease: "power2.out"
        });
    }

    // SCROLL
    function scrollToBottom() {
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    // LIMITE DE CARACTERES (debe coincidir con IACHAT_MAX_MESSAGE_LENGTH)
    const MAX_LENGTH = 300;
    input.setAttribute("maxlength", MAX_LENGTH);

    // TOKEN CSRF
    function getCookie(name) {
        const match = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
        return match ? match.pop() : "";
    }

    // Evita envíos simultáneos si el usuario hace clic varias veces:
    // cada clic extra sería una llamada de pago a la API.
    let sending = false;

    // ENVIAR MENSAJE
    async function sendMessage() {
        if (sending) return;

        const text = input.value.trim();
        if (!text) return;

        sending = true;
        sendBtn.disabled = true;
        input.disabled = true;

        addMessage(text, "user");

        input.value = "";
        autosize.update(input);

        try {
            const response = await fetch("/api/chat/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify({ message: text })
            });

            if (response.status === 429) {
                addMessage("⏳ Has enviado demasiados mensajes. Espera un momento.", "bot");
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                addMessage("⚠️ " + (data.error || "Error del servidor"), "bot");
                return;
            }

            addMessage(data.reply || "⚠️ Error: Respuesta vacía", "bot");

        } catch (error) {
            addMessage("⚠️ Error al conectar con la IA", "bot");
        } finally {
            sending = false;
            sendBtn.disabled = false;
            input.disabled = false;
            input.focus();
        }
    }

    // EVENTOS
    sendBtn.addEventListener("click", sendMessage);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

});

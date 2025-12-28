const form = document.getElementById("giftForm")
const giftsContainer = document.getElementById("gifts");
const modal = document.getElementById("notificationModal");
const modalMessage = document.getElementById("modalMessage");
const closeModal = document.getElementById("closeModal");
const passwordModal = document.getElementById("passwordModal");
const closePasswordModal = document.getElementById("closePasswordModal");
const modalPasswordInput = document.getElementById("modalPasswordInput");
const modalPasswordSubmit = document.getElementById("modalPasswordSubmit");
let passwordCallback = null;

function showPasswordModal(promptMessage, callback) {
    document.getElementById("passwordModalMessage").textContent = promptMessage;
    modalPasswordInput.value = "";
    passwordCallback = callback;
    passwordModal.style.display = "block";
}

closePasswordModal.onclick = () => {
    passwordModal.style.display = "none";
}

window.onclick = (event) => {
    if (event.target == passwordModal) {
        passwordModal.style.display = "none";
    }
}

modalPasswordSubmit.onclick = () => {
    if (passwordCallback) {
        passwordCallback(modalPasswordInput.value);
    }
    passwordModal.style.display = "none";
}

function showModal(message) {
    modalMessage.textContent = message;
    modal.style.display = "block";
}

closeModal.onclick = () => {
    modal.style.display = "none";
}

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

async function loadGifts() {
    const response = await fetch('/gifts');
    const gifts = await response.json();
    
    giftsContainer.innerHTML = '';
    gifts.forEach(gift => {
        const item = document.createElement("p");
        item.textContent = `Gift for ${gift.name}: ${gift.gift} ${gift.complete ? "(Completed)" : ""}`;
        if (!gift.complete) {
            const button = document.createElement("button");
            button.textContent = "Mark Complete";
            button.onclick = () => {
                showPasswordModal("Enter password to mark gift complete:", async (password) => {
                    const response = await fetch(`/gifts/${gift.id}/complete`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password })
                    });
                    const result = await response.json();
                    showModal(response.ok ? result.success : result.error);
                    loadGifts();
                });
            };
            item.appendChild(button);
        }
        giftsContainer.appendChild(item);
    });
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = form.elements.name.value;
    const gift = form.elements.gift.value;
    const password = form.elements.password.value;
    const response = await fetch('/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gift, password })
    });

    const result = await response.json();
    if (response.ok) {
        showModal(result.success);
    } else {
        showModal(result.error);
    }
    form.reset();
    await loadGifts();
});

loadGifts();
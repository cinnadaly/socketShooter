document.addEventListener("DOMContentLoaded", () => {

    const BASE_URL = "http://localhost:3000/api/";

    const form = document.getElementById("registerForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const email = document.getElementById("email").value.trim();

        try {

            const response = await fetch(`${BASE_URL}register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password,
                    email
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);

                form.reset();

                // login rdirect
                window.location.href = "/";
            }
            else {
                alert(data.errorMessage);
            }

        } catch (error) {
            console.error(error);
            alert("Error connecting to server.");
        }
    });

});
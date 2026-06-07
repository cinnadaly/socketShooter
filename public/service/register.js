document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registerForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        try {

            const response = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);

                form.reset();

                // login rdirect
                window.location.href = "/login.html";
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
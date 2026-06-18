document.addEventListener("DOMContentLoaded", () => {
    const BASE_URL = "http://localhost:3000/api/auth/";

    const btnLogout = document.getElementById("btnLogout");

    btnLogout.addEventListener("click", async (e) => {
        try {

        console.log("btnLogout")
            const response = await fetch(`${BASE_URL}logout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
               
            });

            const data = await response.json();

            if (response.ok) {
                console.log("logged out")

                // login direct
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

            const response = await fetch(`${BASE_URL}me`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials:"include"
            });

            const data = await response.json();
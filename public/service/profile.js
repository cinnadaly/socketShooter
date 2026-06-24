/*const form = document.querySelector("#editProfileForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Extract new values
    const formData = new FormData(form);
    const updatedData = {
      username: formData.get("username").trim(),
      email: formData.get("email").trim(),
      password: formData.get("password").trim()
    };

    console.log(updatedData);
 
  });

  function deleteAccount(){
    console.log("delete account");
  }*/

const form = document.querySelector("#editProfileForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData(form);

    const updatedData = {
      username: formData.get("username")?.trim(),
      email: formData.get("email")?.trim(),
      password: formData.get("password")?.trim()
    };

    // Eliminar campos vacíos
    Object.keys(updatedData).forEach(key => {
      if (!updatedData[key]) delete updatedData[key];
    });

    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:3000/api/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Credentials: `include`
      },
      body: JSON.stringify(updatedData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al actualizar perfil");
    }

    alert("Perfil actualizado correctamente");
    console.log(data);

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

async function deleteAccount() {
  const confirmDelete = confirm(
    "¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer."
  );

  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:3000/api/users/profile", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al eliminar cuenta");
    }

    alert("Cuenta eliminada correctamente");

    localStorage.removeItem("token");
    window.location.href = "/login";

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}
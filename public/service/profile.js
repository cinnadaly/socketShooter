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


    const response = await fetch("http://localhost:3000/api/users/profile", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedData)
    });

    //TEST
    const text = await response.text();
    console.log(text);

    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Server did not return JSON");
    }

    if (!response.ok) {
      throw new Error(data.message || "Error updating profile");
    }

    console.log("Profile updated succesfully");
    console.log(data);
    //window.location.reload();

    const meResponse = await fetch("http://localhost:3000/api/users/me", {
      credentials: "include"
    });


    //window.location.reload();

    const me = await meResponse.json();
    console.log(me)
    // actualizar UI
    //document.querySelector("#username").value = me.username;
    //document.querySelector("#email").value = me.email;


  } catch (error) {
    console.error(error);
    //alert(error.message);
  }
});

async function deleteAccount() {
  const confirmDelete = confirm(
    "Are you sure? this action cannot be undone"
  );

  if (!confirmDelete) return;

  try {

    const response = await fetch("http://localhost:3000/api/users/profile", {
      method: "DELETE",
      headers: {
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error deleting account");
    }

    alert("Account deleted succesfully");

    localStorage.removeItem("token");
    window.location.href = "/login";

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}
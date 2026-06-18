const form = document.querySelector("#editProfileForm");

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

    /*
    try {
      // 1. Send data to the backend
      // Replace with your actual API endpoint
      const response = await fetch('/api/user/profile', {
        method: 'PUT', // or PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      // 2. Update local state
      state.name = updatedData.name;
      state.bio = updatedData.bio;

      // 3. Update DOM with the new state
      displayElements.name.textContent = state.name;
      displayElements.bio.textContent = state.bio;

      // 4. Revert to view mode & show success
      toggleEditMode(false);
      statusMessage.textContent = "Profile updated successfully!";
      statusMessage.style.color = "green";

    } catch (error) {
      console.error('Error updating profile:', error);
      statusMessage.textContent = "Error saving changes. Please try again.";
      statusMessage.style.color = "red";
    }
      */
  });

  function deleteAccount(){
    console.log("delete account");
  }
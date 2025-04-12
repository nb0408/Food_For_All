document.addEventListener("DOMContentLoaded", function () {
    const authLink = document.getElementById("auth-link");

    // Check if user is logged in
    const loggedInUser = localStorage.getItem("user");

    if (loggedInUser) {
        authLink.innerHTML = `<a href="#" id="logout-btn">Logout (${loggedInUser})</a>`;

        // Logout functionality
        document.getElementById("logout-btn").addEventListener("click", function () {
            localStorage.removeItem("user"); // Remove user data
            window.location.reload(); // Refresh page
        });
    } else {
        authLink.innerHTML = `<a href="login.html">Login</a>`;
    }
});

// Function to log in user (call this in login form)
function loginUser(event) {
    event.preventDefault(); // Prevent form submission

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("pw").value;
    const confirmPassword = document.getElementById("cpw").value;
    const address = document.getElementById("address").value;

    if (!name || !email || !password || !confirmPassword || !address) {
        alert("Please fill in all fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    localStorage.setItem("user", name);  // Store username
    alert("Login successful!");
    window.location.href = "home.html";  // Redirect to home page
}

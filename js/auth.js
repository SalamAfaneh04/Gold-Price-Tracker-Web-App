let currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {
    email: "",
    firstName: "",
    lastName: "",
    gender: "",
    isLoggedIn: false
};

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const assetsBtn = document.getElementById('assetsBtn');
const redirectToSignUp = document.getElementById('redirectToSignUp');
const redirectToSignIn = document.getElementById('redirectToSignIn');
const xBtn = document.querySelectorAll('.xBtn');

if (currentUser.isLoggedIn) {
    loginBtn.style.display = "none";
    registerBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
}

function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

function checkEmailExists(email) {
    const users = getUsers();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
}

function updateNavbar(isLoggedIn) {
    loginBtn.style.display = isLoggedIn ? "none" : "inline-block";
    registerBtn.style.display = isLoggedIn ? "none" : "inline-block";
    logoutBtn.style.display = isLoggedIn ? "inline-block" : "none";
}

const loginModal = document.getElementById('loginModal');
const loginModalInstance = new bootstrap.Modal(loginModal);

const registerModal = document.getElementById('registerModal');
const registerModalInstance = new bootstrap.Modal(registerModal);

loginBtn.addEventListener('click', () => loginModalInstance.show());
registerBtn.addEventListener('click', () => registerModalInstance.show());

assetsBtn.addEventListener('click', function (event) {
    event.preventDefault();
    if (currentUser.isLoggedIn) {
        window.location.href = "../html/myAssets.html";
    } else {
        loginModalInstance.show();
    }
});

logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("currentUser");
    window.location.href = "../html/index.html";
});

xBtn.forEach(btn => {
    btn.addEventListener('click', () => {
        loginModalInstance.hide();
        registerModalInstance.hide();
    });
});

redirectToSignUp.addEventListener('click', () => {
    loginModalInstance.hide();
    registerModalInstance.show();
});

redirectToSignIn.addEventListener('click', () => {
    registerModalInstance.hide();
    loginModalInstance.show();
});

const registerForm = document.getElementById("registerForm");
registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let users = getUsers();
    const newUser = { firstName: "", lastName: "", email: "", gender: "", password: "" };
    const formData = new FormData(this);
    let isValid = true;

    const errorFirst = document.getElementById("error-fName");
    const errorLast = document.getElementById("error-lName");
    const errorEmail = document.getElementById("error-registerEmail");
    const errorConfirmEmail = document.getElementById("error-confirmEmail");
    const errorGender = document.getElementById("error-gender");
    const errorPassword = document.getElementById("error-registerPassword");
    const errorConfirmPassword = document.getElementById("error-confirmPassword");

    const fName = formData.get("fName").trim();
    const lName = formData.get("lName").trim();
    const email = formData.get("email").trim();
    const cEmail = formData.get("confirmEmail").trim();
    const gender = formData.get("gender");
    const password = formData.get("password");
    const cPassword = formData.get("confirmPassword");

    const namePattern = /^[A-Za-z]+$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordPattern = /^[A-Z](?=.*(?:\d.*){2,})(?=.*[!@#$%^&*(),.?":{}|<>]).{7,31}$/;

    // Clear all errors
    [errorFirst, errorLast, errorEmail, errorConfirmEmail,
        errorGender, errorPassword, errorConfirmPassword]
        .forEach(el => el.textContent = "");

    if (fName.length === 0) {
        errorFirst.textContent = "First name is required.";
        isValid = false;
    } else if (!namePattern.test(fName)) {
        errorFirst.textContent = "Only letters.";
        isValid = false;
    } else {
        newUser.firstName = fName;
    }

    if (lName.length === 0) {
        errorLast.textContent = "Last name is required.";
        isValid = false;
    } else if (!namePattern.test(lName)) {
        errorLast.textContent = "Only letters.";
        isValid = false;
    } else {
        newUser.lastName = lName;
    }

    if (email.length === 0) {
        errorEmail.textContent = "Email is required.";
        isValid = false;
    } else if (!emailPattern.test(email)) {
        errorEmail.textContent = "Please enter a valid email.";
        isValid = false;
    } else if (checkEmailExists(email)) {
        errorEmail.textContent = "Email already exists.";
        isValid = false;
    } else if (email !== cEmail) {
        errorConfirmEmail.textContent = "Emails do not match.";
        isValid = false;
    } else {
        newUser.email = email;
    }

    if (gender === null) {
        errorGender.textContent = "Please select your gender.";
        isValid = false;
    } else {
        newUser.gender = gender;
    }

    if (password.length === 0) {
        errorPassword.textContent = "Password is required.";
        isValid = false;
    } else if (!passwordPattern.test(password)) {
        errorPassword.textContent = "Password must start with a capital letter, contain at least 2 numbers, at least 1 special character, and be between 8 and 32 characters.";
        isValid = false;
    } else if (cPassword.length === 0) {
        errorConfirmPassword.textContent = "Please confirm your password.";
        isValid = false;
    } else if (cPassword !== password) {
        errorConfirmPassword.textContent = "Passwords do not match.";
        isValid = false;
    } else {
        newUser.password = sha256(password);
    }

    if (isValid) {
        newUser.password = sha256(password);
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        currentUser.email = newUser.email;
        currentUser.firstName = newUser.firstName;
        currentUser.lastName = newUser.lastName;
        currentUser.gender = newUser.gender;
        currentUser.isLoggedIn = true;

        sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
        updateNavbar(true);
        alert("Account created successfully!");
        registerForm.reset();
        registerModalInstance.hide();
    }
});

const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    let isValid = true;
    const errorEmail = document.getElementById("error-loginEmail");
    const errorPassword = document.getElementById("error-loginPassword");
    const email = formData.get("loginEmail").trim();
    const password = formData.get("loginPassword");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    errorEmail.textContent = "";
    errorPassword.textContent = "";

    if (email.length === 0) {
        errorEmail.textContent = "Email is required.";
        isValid = false;
    } else if (!emailPattern.test(email)) {
        errorEmail.textContent = "Please enter a valid email.";
        isValid = false;
    } else if (!checkEmailExists(email)) {
        errorEmail.textContent = "No account found with this email.";
        isValid = false;
    }

    if (password.length === 0) {
        errorPassword.textContent = "Password is required.";
        isValid = false;
    }

    if (isValid) {
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user && user.password === sha256(password)) {
            currentUser.email = user.email;
            currentUser.firstName = user.firstName;
            currentUser.lastName = user.lastName;
            currentUser.gender = user.gender;
            currentUser.isLoggedIn = true;

            sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
            updateNavbar(true);
            alert("Login successful!");
            loginForm.reset();
            loginModalInstance.hide();
        } else {
            errorPassword.textContent = "Incorrect password.";
        }
    }
});
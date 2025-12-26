

async function initProfilePage() {
    const user = getLoggedInCustomer();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Load latest data
    await loadUserProfile(user.CustomerID);
}

async function loadUserProfile(id) {
    try {
        const res = await apiJson(`/api/auth/me/${id}`);
        if (res) {
            document.getElementById('firstName').value = res.FirstName;
            document.getElementById('lastName').value = res.LastName;
            document.getElementById('email').value = res.Email;
            document.getElementById('phoneNumber').value = res.PhoneNumber;
            document.getElementById('address').value = res.Address;

            localStorage.setItem('customer', JSON.stringify(res));
            updateUserDisplay();
        }
    } catch (e) {
        console.error('Failed to load profile:', e);
    }
}

function updateUserDisplay() {
    const user = getLoggedInCustomer();
    const nameEl = document.getElementById('userName');
    if (nameEl && user) {
        nameEl.innerText = `${user.FirstName} ${user.LastName}`;
    }
}

window.initProfilePage = initProfilePage;

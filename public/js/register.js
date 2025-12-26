
async function initRegisterPage() {
    const typeSelect = document.getElementById('custType');
    const regionDiv = document.getElementById('regionDiv');
    const countryDiv = document.getElementById('countryDiv');

    // Load dropdowns
    loadRegions();
    loadCountries();

    typeSelect.addEventListener('change', () => {
        if (typeSelect.value === 'domestic') {
            regionDiv.classList.remove('d-none');
            countryDiv.classList.add('d-none');
        } else if (typeSelect.value === 'international') {
            regionDiv.classList.add('d-none');
            countryDiv.classList.remove('d-none');
        } else {
            regionDiv.classList.add('d-none');
            countryDiv.classList.add('d-none');
        }
    });

    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

async function loadRegions() {
    try {
        const res = await apiJson('/api/auth/regions');
        const s = document.getElementById('custRegionId');
        s.innerHTML = '<option value="">Select Region</option>';
        res.forEach(r => {
            s.innerHTML += `<option value="${r.RegionID}">${r.RegionName}</option>`;
        });
    } catch (e) { console.error(e); }
}

async function loadCountries() {
    try {
        const res = await apiJson('/api/auth/countries');
        const s = document.getElementById('custCountryId');
        s.innerHTML = '<option value="">Select Country</option>';
        res.forEach(c => {
            s.innerHTML += `<option value="${c.CountryID}">${c.CountryName}</option>`;
        });
    } catch (e) { console.error(e); }
}

async function handleRegister(e) {
    e.preventDefault();
    const msg = document.getElementById('regMsg');
    msg.innerText = '';

    const body = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        customerType: document.getElementById('custType').value,
        regionId: document.getElementById('custRegionId').value,
        countryId: document.getElementById('custCountryId').value
    };

    try {
        const res = await apiText('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = safeJsonParse(res, null);
        if (data && data.ok) {
            alert('Registration successful! You can now login.');
            window.location.href = 'login.html';
        } else {
            msg.innerText = 'Error: ' + res;
            msg.className = 'text-danger fw-bold';
        }
    } catch (err) {
        msg.innerText = 'Error: ' + err.message;
        msg.className = 'text-danger fw-bold';
    }
}

window.initRegisterPage = initRegisterPage;

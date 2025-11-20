// Credenciais de exemplo
const validUsers = [
    { email: "admin@mps.com", password: "SenhaSegura123", isAdmin: true },
    { email: "user@mps.com", password: "Direito2024", isAdmin: false }
];

// Login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.querySelector('input[type="email"]').value;
    const password = document.getElementById('password').value;
    
    const user = validUsers.find(u => u.email === email && u.password === password);
    
    if(user) {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        if(user.isAdmin) {
            document.getElementById('adminSection').classList.remove('hidden');
        }
    } else {
        alert('Credenciais inválidas. Tente novamente.');
    }
});

// Mostrar/Esconder Senha
function togglePassword() {
    const passwordField = document.getElementById('password');
    const toggleButton = document.querySelector('#password + button');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleButton.textContent = 'Ocultar';
    } else {
        passwordField.type = 'password';
        toggleButton.textContent = 'Mostrar';
    }
}

// Sidebar Mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
    sidebar.classList.toggle('absolute');
    sidebar.classList.toggle('z-50');
}
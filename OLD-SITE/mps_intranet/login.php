<?php
session_start();
require_once 'includes/config.php';
require_once 'includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = trim($_POST['email']);
    $password = trim($_POST['password']);
    
    if (empty($email) || empty($password)) {
        $error = "Por favor, preencha todos os campos";
    } else {
        $sql = "SELECT id, nome, email, senha, perfil FROM usuarios WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        
        if ($stmt->rowCount() == 1) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($password, $user['senha'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['nome'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_profile'] = $user['perfil'];
                
                header('Location: dashboard.php');
                exit();
            } else {
                $error = "Senha incorreta";
            }
        } else {
            $error = "Usuário não encontrado";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <!-- Seu cabeçalho HTML aqui -->
</head>
<body>
    <div class="login-container">
        <h2>Acesso à Intranet</h2>
        <?php if (!empty($error)) echo "<div class='error'>$error</div>"; ?>
        <form method="POST">
            <input type="email" name="email" placeholder="E-mail" required>
            <input type="password" name="password" placeholder="Senha" required>
            <button type="submit">Entrar</button>
        </form>
    </div>
</body>
</html>
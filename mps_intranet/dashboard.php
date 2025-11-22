<?php
require_once 'includes/auth.php';
require_once 'includes/header.php';

// Obter dados do usuário logado
$user_id = $_SESSION['user_id'];
$user_name = $_SESSION['user_name'];
$user_profile = $_SESSION['user_profile'];

// Consultar prazos processuais
$sql_deadlines = "SELECT * FROM prazos 
                 WHERE responsavel_id = :user_id 
                 AND data >= CURDATE() 
                 ORDER BY data ASC 
                 LIMIT 5";
$stmt_deadlines = $pdo->prepare($sql_deadlines);
$stmt_deadlines->bindParam(':user_id', $user_id, PDO::PARAM_INT);
$stmt_deadlines->execute();
$deadlines = $stmt_deadlines->fetchAll(PDO::FETCH_ASSOC);

// Consultar reuniões agendadas
$sql_meetings = "SELECT * FROM reunioes 
                WHERE (responsavel_id = :user_id OR FIND_IN_SET(:user_id, participantes)) 
                AND data >= NOW() 
                ORDER BY data ASC 
                LIMIT 5";
$stmt_meetings = $pdo->prepare($sql_meetings);
$stmt_meetings->bindParam(':user_id', $user_id, PDO::PARAM_INT);
$stmt_meetings->execute();
$meetings = $stmt_meetings->fetchAll(PDO::FETCH_ASSOC);

// Consultar tarefas pendentes
$sql_tasks = "SELECT * FROM tarefas 
             WHERE responsavel_id = :user_id 
             AND status = 'pendente' 
             ORDER BY prioridade DESC, data_limite ASC 
             LIMIT 5";
$stmt_tasks = $pdo->prepare($sql_tasks);
$stmt_tasks->bindParam(':user_id', $user_id, PDO::PARAM_INT);
$stmt_tasks->execute();
$tasks = $stmt_tasks->fetchAll(PDO::FETCH_ASSOC);

// Consultar métricas
$sql_metrics = "SELECT 
               COUNT(DISTINCT p.id) as processos_ativos,
               SUM(p.horas_faturadas) as horas_faturadas,
               COUNT(DISTINCT t.id) as tarefas_pendentes
               FROM processos p
               LEFT JOIN tarefas t ON t.processo_id = p.id AND t.status = 'pendente'
               WHERE p.responsavel_id = :user_id";
$stmt_metrics = $pdo->prepare($sql_metrics);
$stmt_metrics->bindParam(':user_id', $user_id, PDO::PARAM_INT);
$stmt_metrics->execute();
$metrics = $stmt_metrics->fetch(PDO::FETCH_ASSOC);

// Consultar avisos
$sql_announcements = "SELECT a.*, u.nome as autor 
                     FROM avisos a
                     JOIN usuarios u ON u.id = a.autor_id
                     WHERE a.data_publicacao <= NOW()
                     AND (a.data_expiracao IS NULL OR a.data_expiracao >= NOW())
                     ORDER BY a.data_publicacao DESC
                     LIMIT 3";
$stmt_announcements = $pdo->prepare($sql_announcements);
$stmt_announcements->execute();
$announcements = $stmt_announcements->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="dashboard">
    <!-- Welcome Banner -->
    <div class="welcome-banner">
        <div>
            <h1>Bem-vindo(a), <?php echo htmlspecialchars($user_name); ?></h1>
            <p id="currentDate"><?php echo date('l, j \d\e F \d\e Y'); ?></p>
        </div>
        <div class="date-time">
            <div class="time" id="currentTime"><?php echo date('H:i'); ?></div>
            <div>Último acesso: <?php echo date('d/m/Y H:i', strtotime($_SESSION['last_login'])); ?></div>
        </div>
    </div>

    <!-- Cards Container -->
    <div class="cards-container">
        <!-- Deadlines Card -->
        <div class="card">
            <div class="card-header">
                <h3>Próximos Prazos</h3>
                <span class="material-icons" id="deadlinesMenu">more_vert</span>
            </div>
            
            <?php foreach ($deadlines as $deadline): ?>
            <div class="deadline-item" data-process="<?php echo $deadline['processo_id']; ?>">
                <span class="material-icons">warning</span>
                <div class="deadline-info">
                    <div class="deadline-title <?php echo (strtotime($deadline['data']) - time() < 86400) ? 'urgent' : ''; ?>">
                        <?php echo htmlspecialchars($deadline['tipo']); ?> - Processo <?php echo htmlspecialchars($deadline['processo_numero']); ?>
                    </div>
                    <div class="deadline-time">
                        <?php echo date('d/m/Y H:i', strtotime($deadline['data'])); ?> - <?php echo htmlspecialchars($deadline['cliente']); ?>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
            
            <div class="card-footer">
                <a href="processos.php?filter=prazos" class="view-all">Ver todos</a>
            </div>
        </div>
        
        <!-- Meetings Card -->
        <div class="card">
            <div class="card-header">
                <h3>Reuniões Agendadas</h3>
                <span class="material-icons" id="meetingsMenu">more_vert</span>
            </div>
            
            <?php foreach ($meetings as $meeting): ?>
            <div class="meeting-item" data-meeting="<?php echo $meeting['id']; ?>">
                <span class="material-icons"><?php echo ($meeting['tipo'] == 'virtual') ? 'videocam' : 'groups'; ?></span>
                <div class="meeting-info">
                    <div class="meeting-title"><?php echo htmlspecialchars($meeting['titulo']); ?></div>
                    <div class="meeting-time">
                        <?php echo date('d/m/Y H:i', strtotime($meeting['data'])); ?>
                        (<?php echo ($meeting['tipo'] == 'virtual') ? $meeting['plataforma'] : $meeting['local']; ?>)
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
            
            <div class="card-footer">
                <a href="calendario.php" class="view-all">Ver calendário</a>
            </div>
        </div>
        
        <!-- Tasks Card -->
        <div class="card">
            <div class="card-header">
                <h3>Tarefas Pendentes</h3>
                <span class="material-icons" id="tasksMenu">more_vert</span>
            </div>
            
            <?php foreach ($tasks as $task): ?>
            <div class="task-item" data-task="<?php echo $task['id']; ?>">
                <span class="material-icons toggle-task">check_box_outline_blank</span>
                <div class="task-info">
                    <div class="task-title"><?php echo htmlspecialchars($task['titulo']); ?></div>
                    <div class="task-time">
                        <?php echo ($task['processo_numero']) ? 'Processo: ' . htmlspecialchars($task['processo_numero']) : 'Tarefa administrativa'; ?>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
            
            <div class="card-footer">
                <a href="tarefas.php" class="view-all">Ver todas</a>
            </div>
        </div>
        
        <!-- KPIs Card -->
        <div class="card">
            <div class="card-header">
                <h3>Métricas Chave</h3>
                <span class="material-icons" id="kpisMenu">more_vert</span>
            </div>
            
            <div class="kpi-container">
                <div class="kpi-item">
                    <div class="kpi-value"><?php echo $metrics['processos_ativos']; ?></div>
                    <div class="kpi-label">Processos Ativos</div>
                </div>
                <div class="kpi-item">
                    <div class="kpi-value"><?php echo $metrics['horas_faturadas']; ?></div>
                    <div class="kpi-label">Horas Faturadas</div>
                </div>
                <div class="kpi-item">
                    <div class="kpi-value"><?php echo $metrics['tarefas_pendentes']; ?></div>
                    <div class="kpi-label">Pendências</div>
                </div>
            </div>
            
            <div class="chart-container">
                <canvas id="processesChart"></canvas>
            </div>
            
            <div class="quick-actions">
                <button class="quick-action-btn" id="newPetitionBtn">
                    <span class="material-icons">description</span>
                    Petição Urgente
                </button>
                <button class="quick-action-btn" id="searchProcessBtn">
                    <span class="material-icons">search</span>
                    Consultar Processo
                </button>
                <button class="quick-action-btn" id="generateReportBtn">
                    <span class="material-icons">insert_chart</span>
                    Gerar Relatório
                </button>
                <button class="quick-action-btn" id="newDocumentBtn">
                    <span class="material-icons">add</span>
                    Novo Documento
                </button>
            </div>
        </div>
        
        <!-- Announcements Card -->
        <div class="card">
            <div class="card-header">
                <h3>Mural de Avisos</h3>
                <span class="material-icons" id="announcementsMenu">more_vert</span>
            </div>
            
            <?php foreach ($announcements as $announcement): ?>
            <div class="announcement-item" data-announcement="<?php echo $announcement['id']; ?>">
                <div class="announcement-title"><?php echo htmlspecialchars($announcement['titulo']); ?></div>
                <p><?php echo htmlspecialchars($announcement['resumo']); ?></p>
                <div class="announcement-meta">
                    <span><?php echo htmlspecialchars($announcement['autor']); ?> - <?php echo date('d/m/Y', strtotime($announcement['data_publicacao'])); ?></span>
                    <?php if (!isset($_SESSION['read_announcements'][$announcement['id']])): ?>
                    <span class="announcement-confirm" data-id="<?php echo $announcement['id']; ?>">Confirmar leitura</span>
                    <?php else: ?>
                    <span>Lido em <?php echo date('d/m/Y', strtotime($_SESSION['read_announcements'][$announcement['id']]))); ?></span>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
            
            <div class="card-footer">
                <a href="avisos.php" class="view-all">Ver todos</a>
            </div>
        </div>
        
        <!-- Risk Alerts Card -->
        <div class="card">
            <div class="card-header">
                <h3>Alertas de Risco</h3>
                <span class="material-icons">notifications_active</span>
            </div>
            
            <?php
            $sql_alerts = "SELECT * FROM alertas 
                          WHERE (responsavel_id = :user_id OR responsavel_id IS NULL)
                          AND data >= NOW() - INTERVAL 7 DAY
                          ORDER BY prioridade DESC, data DESC
                          LIMIT 2";
            $stmt_alerts = $pdo->prepare($sql_alerts);
            $stmt_alerts->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt_alerts->execute();
            $alerts = $stmt_alerts->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($alerts as $alert):
            ?>
            <div class="announcement-item" data-alert="<?php echo $alert['id']; ?>">
                <div class="announcement-title <?php echo ($alert['prioridade'] == 'alta') ? 'urgent' : ''; ?>">
                    <?php echo htmlspecialchars($alert['titulo']); ?>
                </div>
                <p><?php echo htmlspecialchars($alert['descricao']); ?></p>
                <div class="announcement-meta">
                    <span>Sistema - <?php echo date('d/m/Y H:i', strtotime($alert['data'])); ?></span>
                </div>
            </div>
            <?php endforeach; ?>
            
            <div class="card-footer">
                <a href="alertas.php" class="view-all">Ver todos</a>
            </div>
        </div>
        
        <!-- Process Areas Card -->
        <div class="card">
            <div class="card-header">
                <h3>Áreas de Atuação</h3>
                <span class="material-icons">category</span>
            </div>
            
            <?php
            $sql_areas = "SELECT a.nome, COUNT(p.id) as total 
                         FROM areas a
                         LEFT JOIN processos p ON p.area_id = a.id AND p.responsavel_id = :user_id
                         GROUP BY a.id
                         ORDER BY total DESC";
            $stmt_areas = $pdo->prepare($sql_areas);
            $stmt_areas->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt_areas->execute();
            $areas = $stmt_areas->fetchAll(PDO::FETCH_ASSOC);
            ?>
            
            <div class="process-areas">
                <?php foreach ($areas as $area): ?>
                <span class="process-area"><?php echo htmlspecialchars($area['nome']); ?> (<?php echo $area['total']; ?>)</span>
                <?php endforeach; ?>
            </div>
            
            <div class="chart-container">
                <canvas id="areasChart"></canvas>
            </div>
        </div>
        
        <!-- Documents Status Card -->
        <div class="card">
            <div class="card-header">
                <h3>Status de Documentos</h3>
                <span class="material-icons">description</span>
            </div>
            
            <?php
            $sql_docs = "SELECT 
                        SUM(status = 'finalizado') as finalizados,
                        SUM(status = 'revisao') as em_revisao,
                        SUM(status = 'pendente') as pendentes
                        FROM documentos
                        WHERE responsavel_id = :user_id";
            $stmt_docs = $pdo->prepare($sql_docs);
            $stmt_docs->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt_docs->execute();
            $docs = $stmt_docs->fetch(PDO::FETCH_ASSOC);
            ?>
            
            <div class="document-status">
                <div class="status-item">
                    <div class="status-circle">
                        <span class="material-icons">check</span>
                    </div>
                    <div>Finalizados</div>
                    <div><?php echo $docs['finalizados']; ?></div>
                </div>
                <div class="status-item">
                    <div class="status-circle">
                        <span class="material-icons">edit</span>
                    </div>
                    <div>Em Revisão</div>
                    <div><?php echo $docs['em_revisao']; ?></div>
                </div>
                <div class="status-item">
                    <div class="status-circle">
                        <span class="material-icons">schedule</span>
                    </div>
                    <div>Pendentes</div>
                    <div><?php echo $docs['pendentes']; ?></div>
                </div>
            </div>
            
            <div class="card-footer">
                <a href="documentos.php" class="view-all">Gerenciar Documentos</a>
            </div>
        </div>
        
        <!-- Team Availability Card -->
        <div class="card">
            <div class="card-header">
                <h3>Disponibilidade da Equipe</h3>
                <span class="material-icons">group</span>
            </div>
            
            <?php
            $sql_team = "SELECT u.id, u.nome, u.perfil, s.status, s.ultima_atividade 
                        FROM usuarios u
                        LEFT JOIN status_usuario s ON s.usuario_id = u.id
                        WHERE u.ativo = 1
                        ORDER BY FIELD(u.perfil, 'socio', 'advogado', 'estagiario', 'secretaria'), u.nome
                        LIMIT 4";
            $stmt_team = $pdo->prepare($sql_team);
            $stmt_team->execute();
            $team = $stmt_team->fetchAll(PDO::FETCH_ASSOC);
            ?>
            
            <div class="team-availability">
                <?php foreach ($team as $member): 
                    $initials = implode('', array_map(function($v) { return $v[0]; }, explode(' ', $member['nome'])));
                    $status_class = 'status-' . $member['status'];
                    $status_text = '';
                    $icon = '';
                    
                    switch ($member['status']) {
                        case 'online':
                            $status_text = 'Online - ' . ucfirst($member['perfil']);
                            $icon = 'videocam';
                            break;
                        case 'busy':
                            $status_text = 'Em reunião - ' . ucfirst($member['perfil']);
                            $icon = 'schedule';
                            break;
                        case 'offline':
                            $last_seen = strtotime($member['ultima_atividade']);
                            $status_text = 'Offline - ' . (time() - $last_seen < 3600 ? 'Visto recentemente' : 'Visto ' . date('d/m H:i', $last_seen));
                            $icon = 'email';
                            break;
                    }
                ?>
                <div class="team-member">
                    <div class="team-member-avatar"><?php echo substr($initials, 0, 2); ?></div>
                    <div class="team-member-info">
                        <div class="team-member-name"><?php echo htmlspecialchars($member['nome']); ?></div>
                        <div class="team-member-status <?php echo $status_class; ?>"><?php echo $status_text; ?></div>
                    </div>
                    <span class="material-icons"><?php echo $icon; ?></span>
                </div>
                <?php endforeach; ?>
            </div>
            
            <div class="card-footer">
                <a href="equipe.php" class="view-all">Ver equipe completa</a>
            </div>
        </div>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>

<script>
// Inicialização dos gráficos
document.addEventListener('DOMContentLoaded', function() {
    // Gráfico de processos
    const processesCtx = document.getElementById('processesChart').getContext('2d');
    const processesChart = new Chart(processesCtx, {
        type: 'line',
        data: {
            labels: <?php echo json_encode(array_column(getLastSixMonths(), 'month')); ?>,
            datasets: [{
                label: 'Processos Ativos',
                data: <?php echo json_encode(array_column(getLastSixMonths(), 'count')); ?>,
                borderColor: '#2C5545',
                backgroundColor: 'rgba(44, 85, 69, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: false } }
        }
    });
    
    // Gráfico de áreas
    const areasCtx = document.getElementById('areasChart').getContext('2d');
    const areasChart = new Chart(areasCtx, {
        type: 'doughnut',
        data: {
            labels: <?php echo json_encode(array_column($areas, 'nome')); ?>,
            datasets: [{
                data: <?php echo json_encode(array_column($areas, 'total')); ?>,
                backgroundColor: [
                    '#2C5545', '#3a6b5a', '#4a7c6a', '#5a8d7a', '#6a9e8a', '#7aaf9a'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });
});

// Função auxiliar para obter dados dos últimos 6 meses
function getLastSixMonths() {
    // Esta função seria implementada ou substituída por uma chamada AJAX
    return [
        { month: 'Jan', count: 32 },
        { month: 'Fev', count: 35 },
        { month: 'Mar', count: 38 },
        { month: 'Abr', count: 40 },
        { month: 'Mai', count: 42 },
        { month: 'Jun', count: 45 }
    ];
}
</script>
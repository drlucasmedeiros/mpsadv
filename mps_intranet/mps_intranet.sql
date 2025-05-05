CREATE DATABASE IF NOT EXISTS `mps_intranet` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mps_intranet`;

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `perfil` enum('admin','advogado','estagiario','secretaria') NOT NULL DEFAULT 'advogado',
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `usuarios` (`nome`, `email`, `senha`, `perfil`) VALUES
('Admin', 'admin@mps.com', '$2y$10$ExemploHashSimulado', 'admin'),
('Carlos Silva', 'carlos@mps.com', '$2y$10$ExemploHashSimulado', 'advogado');

CREATE TABLE `processos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` varchar(50) NOT NULL,
  `cliente` varchar(100) NOT NULL,
  `area` varchar(50) NOT NULL,
  `responsavel_id` int(11) NOT NULL,
  `descricao` text DEFAULT NULL,
  `data_criacao` date NOT NULL,
  `prazo` date DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ativo',
  PRIMARY KEY (`id`),
  KEY `responsavel_id` (`responsavel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Adicione mais tabelas conforme necessário
-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           10.4.20-MariaDB - mariadb.org binary distribution
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              11.3.0.6295
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para wapp_atende
CREATE DATABASE IF NOT EXISTS `wapp_atende` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE `wapp_atende`;

-- Copiando estrutura para tabela wapp_atende.atendentes
CREATE TABLE IF NOT EXISTS `atendentes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `Atendente` varchar(50) NOT NULL DEFAULT '0',
  `chave` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chave` (`chave`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela wapp_atende.clientes
CREATE TABLE IF NOT EXISTS `clientes` (
  `idContato` int(11) NOT NULL AUTO_INCREMENT,
  `contato` varchar(50) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `atendente` varchar(50) NOT NULL DEFAULT 'bot',
  `cpf_cnpj` varchar(50) DEFAULT NULL,
  `ultimaMsg` datetime NOT NULL,
  `sala` varchar(100) DEFAULT NULL,
  `nomeSala` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idContato`),
  KEY `contato` (`contato`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela wapp_atende.grp_rocketchat
CREATE TABLE IF NOT EXISTS `grp_rocketchat` (
  `idGrupo` int(11) NOT NULL AUTO_INCREMENT,
  `nomeWhats` text DEFAULT NULL,
  `nomeRocket` text DEFAULT NULL,
  `canal` text DEFAULT NULL,
  `idGrpWhats` text DEFAULT NULL,
  PRIMARY KEY (`idGrupo`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4;

-- Exportação de dados foi desmarcado.

-- Copiando estrutura para tabela wapp_atende.roteamento
CREATE TABLE IF NOT EXISTS `roteamento` (
  `idRoteamento` int(11) NOT NULL AUTO_INCREMENT,
  `nome` tinytext NOT NULL,
  `whatsapp` text NOT NULL,
  `rota` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`idRoteamento`),
  UNIQUE KEY `whatsapp` (`whatsapp`) USING HASH,
  KEY `FK_roteamento_atendentes` (`rota`),
  CONSTRAINT `FK_roteamento_atendentes` FOREIGN KEY (`rota`) REFERENCES `atendentes` (`chave`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

-- Exportação de dados foi desmarcado.

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

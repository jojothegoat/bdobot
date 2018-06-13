-- MySQL dump 10.15  Distrib 10.0.34-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: bdo
-- ------------------------------------------------------
-- Server version	10.0.34-MariaDB-0ubuntu0.16.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `guilds_na`
--

DROP TABLE IF EXISTS `guilds_na`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `guilds_na` (
  `id` varchar(20) NOT NULL,
  `guild_name` varchar(20) NOT NULL,
  `master_user_no` int(10) NOT NULL,
  `master_user_nickname` varchar(50) DEFAULT NULL,
  `aquired_skill_point` int(10) unsigned NOT NULL,
  `guild_member` int(10) unsigned NOT NULL,
  `territory_key` int(10) unsigned DEFAULT NULL,
  `region_key` varchar(20) DEFAULT NULL,
  `region_key1` int(10) unsigned NOT NULL DEFAULT '0',
  `region_key2` int(10) unsigned NOT NULL DEFAULT '0',
  `region_key3` int(10) unsigned NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `master_user_no` (`master_user_no`),
  KEY `territory_key` (`territory_key`),
  KEY `region_key1` (`region_key1`),
  KEY `region_key2` (`region_key2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=COMPACT;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-06-13 14:20:48

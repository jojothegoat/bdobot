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
-- Table structure for table `guildlife_history_eu`
--

DROP TABLE IF EXISTS `guildlife_history_eu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `guildlife_history_eu` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rankingType` int(10) unsigned DEFAULT NULL,
  `rank` int(10) unsigned DEFAULT NULL,
  `guildNo` varchar(20) DEFAULT NULL,
  `guildName` varchar(20) DEFAULT NULL,
  `masterUserNo` int(10) unsigned DEFAULT NULL,
  `masterUserNickname` varchar(20) DEFAULT NULL,
  `regionKey1` int(10) unsigned DEFAULT NULL,
  `regionKey2` int(10) unsigned DEFAULT NULL,
  `regionKey3` int(10) unsigned DEFAULT NULL,
  `spotSiegeCount` int(10) unsigned DEFAULT NULL,
  `winCount` int(10) unsigned DEFAULT NULL,
  `aquiredSkillPoint` int(10) unsigned DEFAULT NULL,
  `memberCount` int(10) unsigned DEFAULT NULL,
  `variedMemberCount` int(10) unsigned DEFAULT NULL,
  `isIntroduction` tinyint(1) unsigned DEFAULT NULL,
  `guildIntroduction` varchar(250) DEFAULT NULL,
  `commentCount` int(11) DEFAULT NULL,
  `guildGrade` int(11) unsigned DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=186440 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=COMPACT;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-06-13 14:20:37

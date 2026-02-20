-- MySQL dump 10.13  Distrib 9.6.0, for macos26.2 (arm64)
--
-- Host: 127.0.0.1    Database: baby_growth
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `album_photos`
--

DROP TABLE IF EXISTS `album_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `album_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `child_id` int NOT NULL,
  `user_id` int NOT NULL,
  `openid` varchar(64) NOT NULL,
  `url` varchar(512) NOT NULL,
  `description` text,
  `qiniu_key` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_child_date` (`child_id`,`created_at`),
  KEY `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `album_photos`
--

LOCK TABLES `album_photos` WRITE;
/*!40000 ALTER TABLE `album_photos` DISABLE KEYS */;
/*!40000 ALTER TABLE `album_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `children`
--

DROP TABLE IF EXISTS `children`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `children` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `birthday` date DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `family_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `children`
--

LOCK TABLES `children` WRITE;
/*!40000 ALTER TABLE `children` DISABLE KEYS */;
INSERT INTO `children` VALUES (1,'郭路谦','2026-01-19','male',NULL,1,'2026-02-17 17:12:32');
/*!40000 ALTER TABLE `children` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `families`
--

DROP TABLE IF EXISTS `families`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `families` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT '我的家庭',
  `invite_code` varchar(20) DEFAULT NULL COMMENT '邀请码',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_code` (`invite_code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `families`
--

LOCK TABLES `families` WRITE;
/*!40000 ALTER TABLE `families` DISABLE KEYS */;
INSERT INTO `families` VALUES (1,'我的家庭','A881FE8E','2026-02-19 18:36:21'),(2,'我的家庭','0E1CF9B2','2026-02-19 18:46:38'),(3,'我的家庭','8C883445','2026-02-19 18:51:53');
/*!40000 ALTER TABLE `families` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `family_members`
--

DROP TABLE IF EXISTS `family_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `family_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `family_id` int DEFAULT NULL,
  `role` enum('father','mother','grandpa','grandma','other') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_admin` tinyint(1) DEFAULT '0' COMMENT '是否管理员',
  `status` enum('pending','active') DEFAULT 'pending' COMMENT '状态',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_child_user` (`user_id`),
  CONSTRAINT `family_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `family_members`
--

LOCK TABLES `family_members` WRITE;
/*!40000 ALTER TABLE `family_members` DISABLE KEYS */;
INSERT INTO `family_members` VALUES (1,2,1,'father','2026-02-19 18:24:00',1,'active'),(2,9,1,'mother','2026-02-19 19:08:12',1,'pending');
/*!40000 ALTER TABLE `family_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `records`
--

DROP TABLE IF EXISTS `records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `child_id` int NOT NULL,
  `user_id` int NOT NULL,
  `openid` varchar(64) NOT NULL,
  `type` enum('sleep','eat','play','study','emotion','milestone') NOT NULL,
  `content` text,
  `duration` int DEFAULT NULL,
  `value` decimal(10,2) DEFAULT NULL,
  `emotion` varchar(32) DEFAULT NULL,
  `images` json DEFAULT NULL,
  `recorded_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_openid_date` (`openid`,`recorded_at`),
  KEY `idx_child_date` (`child_id`,`recorded_at`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `records_ibfk_1` FOREIGN KEY (`child_id`) REFERENCES `children` (`id`),
  CONSTRAINT `records_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `records`
--

LOCK TABLES `records` WRITE;
/*!40000 ALTER TABLE `records` DISABLE KEYS */;
INSERT INTO `records` VALUES (1,1,2,'test_openid','eat','0点40，喝奶100毫升',0,NULL,NULL,NULL,'2026-02-18 16:40:00','2026-02-18 19:09:56'),(2,1,2,'test_openid','eat','3点40喝奶100毫升',0,NULL,NULL,NULL,'2026-02-18 19:40:00','2026-02-18 19:53:42'),(3,1,2,'test_openid','sleep','3点50到8点30睡觉',280,NULL,NULL,NULL,'2026-02-18 19:50:00','2026-02-18 19:54:03'),(4,1,2,'test_openid','play','0点50到3点20，玩耍',150,NULL,NULL,NULL,'2026-02-18 16:50:00','2026-02-18 19:54:26'),(5,1,2,'test_openid','sleep','0点到0点40，睡觉',40,NULL,NULL,NULL,'2026-02-18 16:00:00','2026-02-18 22:10:46'),(6,1,2,'test_openid','study','2点20进行一次色卡（彩色）学习',0,NULL,NULL,NULL,'2026-02-18 18:20:00','2026-02-18 22:12:03'),(7,1,2,'test_openid','eat','8:40喝奶100ml。',0,NULL,NULL,NULL,'2026-02-19 00:40:00','2026-02-19 01:35:50'),(8,1,2,'test_openid','eat','11:35喝奶100ml',0,NULL,NULL,NULL,'2026-02-19 03:35:00','2026-02-19 03:36:49'),(9,1,2,'test_openid','sleep','上午9点到10点睡觉',60,NULL,NULL,NULL,'2026-02-19 01:00:00','2026-02-19 05:44:35'),(10,1,2,'test_openid','sleep','中午12点到13点睡觉',60,NULL,NULL,NULL,'2026-02-19 04:00:00','2026-02-19 05:44:52'),(11,1,2,'test_openid','eat','14点喝奶100毫升。',0,NULL,NULL,NULL,'2026-02-19 06:00:00','2026-02-19 08:32:33'),(12,1,2,'test_openid','eat','16点30喝奶60毫升',0,NULL,NULL,NULL,'2026-02-19 08:30:00','2026-02-19 08:32:46'),(13,1,2,'test_openid','play','14点到15点，玩耍',60,NULL,NULL,NULL,'2026-02-19 06:00:00','2026-02-19 08:34:18'),(14,1,2,'test_openid','sleep','15点到16点30，睡觉',90,NULL,NULL,NULL,'2026-02-19 07:00:00','2026-02-19 08:34:26'),(15,1,2,'test_openid','sleep','17:00-18:00睡觉',60,NULL,NULL,NULL,'2026-02-19 09:00:00','2026-02-19 10:28:20'),(16,1,2,'test_openid','eat','18:20喝奶90ml',0,NULL,NULL,NULL,'2026-02-19 10:00:00','2026-02-19 10:28:33'),(18,1,2,'test_openid','eat','23点喝奶100毫升',0,NULL,NULL,NULL,'2026-02-19 15:00:00','2026-02-19 15:47:40'),(19,1,2,'test_openid','sleep','23点30到01点30分，睡觉',120,NULL,NULL,NULL,'2026-02-19 15:30:00','2026-02-19 15:47:53'),(20,1,2,'test_openid','sleep','19点到23点，睡觉',240,NULL,NULL,NULL,'2026-02-19 11:00:00','2026-02-19 15:52:54'),(21,1,2,'test_openid','eat','1点40，喝奶100毫升',0,NULL,NULL,NULL,'2026-02-19 17:40:00','2026-02-19 18:11:46'),(22,1,2,'test_openid','sleep','2点到5点50睡觉',230,NULL,NULL,NULL,'2026-02-19 18:00:00','2026-02-19 18:11:52'),(29,1,2,'phone_18516171260','study','12:02到12:30，色卡学习',28,NULL,NULL,NULL,'2026-02-19 04:02:00','2026-02-19 20:31:05'),(30,1,2,'phone_18516171260','eat','100ml，吃饭',0,100.00,NULL,NULL,'2026-02-19 21:56:00','2026-02-19 22:35:56'),(31,1,2,'phone_18516171260','sleep','6点10分到9点睡觉',170,NULL,NULL,NULL,'2026-02-19 22:10:00','2026-02-19 22:36:17'),(32,1,9,'user_tvd8uo4gqp','eat','90ml，吃饭+D3',0,90.00,NULL,NULL,'2026-02-20 04:20:00','2026-02-20 06:29:36'),(33,1,9,'user_tvd8uo4gqp','eat','90ml，吃饭',0,90.00,NULL,NULL,'2026-02-20 01:30:00','2026-02-20 06:30:03'),(34,1,9,'user_tvd8uo4gqp','sleep','09:50到11:30，睡觉',100,NULL,NULL,NULL,'2026-02-20 01:50:00','2026-02-20 06:31:38'),(35,1,9,'user_tvd8uo4gqp','play','11:40到12:20，玩耍',40,NULL,NULL,NULL,'2026-02-20 03:40:00','2026-02-20 06:32:48'),(36,1,9,'user_tvd8uo4gqp','sleep','13:00到13:30，睡觉',30,NULL,NULL,NULL,'2026-02-20 05:00:00','2026-02-20 06:34:38'),(37,1,2,'phone_18516171260','eat','14:30喂奶90ml',0,90.00,NULL,NULL,'2026-02-20 06:30:00','2026-02-20 08:52:38'),(38,1,2,'phone_18516171260','eat','16:30喂奶60ml',0,60.00,NULL,NULL,'2026-02-20 08:30:00','2026-02-20 08:52:53'),(39,1,2,'phone_18516171260','sleep','14:29到16:30，睡觉',121,NULL,NULL,NULL,'2026-02-20 06:29:00','2026-02-20 08:53:54'),(40,1,2,'phone_18516171260','sleep','16:45开始睡觉。',0,NULL,NULL,NULL,'2026-02-20 08:45:00','2026-02-20 08:56:07');
/*!40000 ALTER TABLE `records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openid` varchar(64) NOT NULL,
  `nickname` varchar(64) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `password` varchar(255) DEFAULT NULL COMMENT '密码',
  `is_admin` tinyint(1) DEFAULT '0' COMMENT '是否管理员',
  `is_active` tinyint(1) DEFAULT '0' COMMENT '是否激活',
  `family_id` int DEFAULT NULL COMMENT '家庭ID',
  `invited_by` int DEFAULT NULL COMMENT '邀请人ID',
  `current_child_id` int DEFAULT NULL COMMENT '当前抚养的孩子ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `openid` (`openid`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'phone_18516171260','郭老师',NULL,'2026-02-17 20:12:24','18516171260','123456',1,0,1,NULL,1),(9,'user_tvd8uo4gqp','卢老师',NULL,'2026-02-19 19:08:12','15000258598','123456',0,0,1,2,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-20 18:26:00

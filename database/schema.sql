-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 16, 2025 at 04:17 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lms_forbes`
--

-- --------------------------------------------------------

--
-- Table structure for table `applicant_pools`
--

CREATE TABLE `applicant_pools` (
  `id` int(11) NOT NULL,
  `pool_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applicant_pools`
--

INSERT INTO `applicant_pools` (`id`, `pool_name`, `description`, `created_by`, `created_at`) VALUES
(1, 'Loan Officer Pool', 'Candidates for loan officer roles', 1, '2025-03-01 00:00:00'),
(3, 'hahaha', 'ahahah', 1, '2025-03-14 16:28:08');

-- --------------------------------------------------------

--
-- Table structure for table `applicant_pool_assignments`
--

CREATE TABLE `applicant_pool_assignments` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `pool_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applicant_pool_assignments`
--

INSERT INTO `applicant_pool_assignments` (`id`, `application_id`, `pool_id`, `assigned_at`) VALUES
(1, 1, 1, '2025-03-13 14:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `job_role` varchar(50) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `status` enum('pending','shortlisted','hired','rejected') DEFAULT 'pending',
  `evaluation_score` decimal(5,2) DEFAULT NULL,
  `fst_score` decimal(5,2) DEFAULT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`id`, `user_id`, `program_id`, `job_role`, `department`, `status`, `evaluation_score`, `fst_score`, `applied_at`, `updated_at`) VALUES
(1, 4, 1, 'Loan Officer', 'Operations', 'shortlisted', 88.50, 92.00, '2025-03-10 09:00:00', '2025-03-13 14:00:00'),
(2, 4, 2, 'Financial Educator', 'Training', 'pending', NULL, NULL, '2025-03-11 10:00:00', NULL),
(3, 4, 3, 'Loan Officer', 'Operations', 'rejected', 65.00, 70.00, '2025-03-12 11:00:00', '2025-03-14 08:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `backups`
--

CREATE TABLE `backups` (
  `id` int(11) NOT NULL,
  `backup_name` varchar(100) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `backup_type` enum('scheduled','manual') NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `backups`
--

INSERT INTO `backups` (`id`, `backup_name`, `file_path`, `backup_type`, `created_by`, `created_at`) VALUES
(1, '2025-03-07_backup', '/backups/2025-03-07.sql', 'scheduled', 1, '2025-03-06 16:00:00'),
(2, '2025-03-14_manual', '/backups/2025-03-14.sql', 'manual', 1, '2025-03-14 06:00:00'),
(4, 'Manual_Backup_2025-03-16_475', 'C:\\xampp\\htdocs\\lms-forbes\\backend\\api\\admin/../../backups/backup_2025-03-16_03-07-28.sql', 'manual', 1, '2025-03-16 02:07:29');

-- --------------------------------------------------------

--
-- Table structure for table `milestones`
--

CREATE TABLE `milestones` (
  `id` int(11) NOT NULL,
  `program_id` int(11) DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `milestones`
--

INSERT INTO `milestones` (`id`, `program_id`, `title`, `description`, `due_date`, `created_by`, `created_at`) VALUES
(1, 1, 'Complete Loan Basics', 'Finish introductory module', '2025-03-15', 2, '2025-02-28 20:00:00'),
(2, 2, 'Policy Review', 'Review updated policies', '2025-03-10', 2, '2025-03-01 21:00:00'),
(3, 3, 'Case Study Submission', 'Submit loan case study', '2025-03-20', 2, '2025-03-05 22:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `milestone_progress`
--

CREATE TABLE `milestone_progress` (
  `id` int(11) NOT NULL,
  `milestone_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
  `completion_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `milestone_progress`
--

INSERT INTO `milestone_progress` (`id`, `milestone_id`, `user_id`, `status`, `completion_date`) VALUES
(1, 1, 3, 'in_progress', NULL),
(2, 3, 3, 'completed', '2025-03-13 08:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('info','warning','success','error') NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `created_at`, `read_at`) VALUES
(1, 4, 'success', 'Application Shortlisted', 'Your application for Loan Officer Basics has been shortlisted.', '2025-03-13 14:00:00', NULL),
(2, 4, 'error', 'Application Rejected', 'Your application for Advanced Loan Training was rejected.', '2025-03-14 08:00:00', NULL),
(3, 3, 'warning', 'Milestone Overdue', 'Policy Review milestone is overdue.', '2025-03-11 00:00:00', NULL),
(4, 2, 'info', 'New Trainee Enrolled', 'Trainee Trainee enrolled in Loan Officer Basics.', '2025-03-09 16:00:00', '2025-03-14 07:12:16');

-- --------------------------------------------------------

--
-- Table structure for table `performance_incidents`
--

CREATE TABLE `performance_incidents` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `incident_type` enum('low_quiz_score','policy_violation','other') NOT NULL,
  `description` text DEFAULT NULL,
  `incident_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `reported_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `performance_incidents`
--

INSERT INTO `performance_incidents` (`id`, `user_id`, `incident_type`, `description`, `incident_date`, `reported_by`) VALUES
(1, 3, 'low_quiz_score', 'Scored below 70 on policy quiz', '2025-03-12 02:00:00', 2),
(2, 3, 'policy_violation', 'Missed mandatory session', '2025-03-13 10:00:00', 2),
(4, 3, 'low_quiz_score', 'haha', '2025-03-15 18:57:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `role` enum('administrator','trainer','trainee','applicant') NOT NULL,
  `permission` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `role`, `permission`, `description`) VALUES
(1, 'administrator', 'manage_users', 'Can create, edit, and deactivate user accounts'),
(2, 'administrator', 'manage_backups', 'Can schedule and restore backups'),
(3, 'trainer', 'create_quiz', 'Can create and manage quizzes'),
(4, 'trainer', 'set_milestones', 'Can set objectives and milestones'),
(5, 'trainee', 'view_progress', 'Can view own progress'),
(6, 'applicant', 'view_applications', 'Can view own application status');

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

CREATE TABLE `programs` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('regular','refresher') DEFAULT 'regular',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`id`, `title`, `description`, `type`, `created_by`, `created_at`) VALUES
(1, 'Loan Officer Basics', 'Introduction to loan processing', 'regular', 2, '2025-02-28 17:00:00'),
(2, 'Policy Refresher 2025', 'Updated company policies', 'refresher', 2, '2025-03-01 18:00:00'),
(3, 'Advanced Loan Training', 'Deep dive into loan management', 'regular', 2, '2025-03-04 19:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `program_enrollments`
--

CREATE TABLE `program_enrollments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `enrollment_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `completion_status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
  `completion_percentage` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `program_enrollments`
--

INSERT INTO `program_enrollments` (`id`, `user_id`, `program_id`, `enrollment_date`, `completion_status`, `completion_percentage`) VALUES
(1, 3, 1, '2025-03-09 16:00:00', 'in_progress', 50.00),
(2, 3, 2, '2025-03-10 16:00:00', 'not_started', 0.00),
(3, 3, 3, '2025-03-11 16:00:00', 'completed', 100.00);

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

CREATE TABLE `quizzes` (
  `id` int(11) NOT NULL,
  `program_id` int(11) DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `time_limit` int(11) DEFAULT NULL,
  `passing_score` decimal(5,2) DEFAULT 70.00,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('draft','active') NOT NULL DEFAULT 'draft'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quizzes`
--

INSERT INTO `quizzes` (`id`, `program_id`, `title`, `description`, `time_limit`, `passing_score`, `created_by`, `created_at`, `status`) VALUES
(1, 1, 'Loan Basics Quiz', 'Test basic loan knowledge', 30, 70.00, 2, '2025-03-01 18:00:00', 'active'),
(2, 2, 'Policy Quiz', 'Policy comprehension test', 20, 75.00, 2, '2025-03-02 19:00:00', 'draft'),
(3, 3, 'Advanced Loan Quiz', 'Advanced loan scenarios', 45, 80.00, 2, '2025-03-05 20:00:00', 'draft'),
(4, 3, 'ahaha', 'haha', 29, 70.00, 2, '2025-03-16 06:03:08', 'draft');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempts`
--

CREATE TABLE `quiz_attempts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `score` decimal(5,2) DEFAULT 0.00,
  `time_taken` int(11) DEFAULT NULL,
  `attempt_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `feedback` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quiz_attempts`
--

INSERT INTO `quiz_attempts` (`id`, `user_id`, `quiz_id`, `score`, `time_taken`, `attempt_date`, `feedback`) VALUES
(1, 3, 1, 85.00, 25, '2025-03-12 02:00:00', 'Good effort, review loan terms.'),
(2, 3, 3, 92.00, 40, '2025-03-13 06:00:00', 'Excellent work!'),
(3, 3, 1, 75.00, 28, '2025-03-16 02:00:00', 'Nice attempt, focus on credit scores.');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempt_answers`
--

CREATE TABLE `quiz_attempt_answers` (
  `id` int(11) NOT NULL,
  `attempt_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `selected_answer` varchar(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quiz_attempt_answers`
--

INSERT INTO `quiz_attempt_answers` (`id`, `attempt_id`, `question_id`, `selected_answer`) VALUES
(1, 1, 8, 'c'),
(2, 1, 9, 'a'),
(3, 2, 4, 'a'),
(4, 3, 8, 'c'),
(5, 3, 9, 'b'),
(6, 3, 11, 'c'),
(7, 3, 12, 'a');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `option_a` varchar(255) NOT NULL,
  `option_b` varchar(255) NOT NULL,
  `option_c` varchar(255) DEFAULT NULL,
  `option_d` varchar(255) DEFAULT NULL,
  `correct_answer` enum('a','b','c','d') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quiz_questions`
--

INSERT INTO `quiz_questions` (`id`, `quiz_id`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`) VALUES
(3, 2, 'New policy effective date?', 'Jan 1', 'Mar 1', 'Jun 1', 'Dec 1', 'b'),
(4, 3, 'What is a balloon payment?', 'Full payment', 'Partial payment', 'Interest only', 'None', 'a'),
(8, 1, 'What is the max loan term?', '30 days', '60 days', '90 days', '120 days', 'c'),
(9, 1, 'Who approves loans?', 'Manager', 'Officer', 'Client', 'System', 'b'),
(10, 4, 'haha', 'sss', 'ss', 'ss', 'ss', 'a'),
(11, 1, 'What is the minimum credit score required?', '600', '650', '700', '750', 'b'),
(12, 1, 'What does APR stand for?', 'Annual Percentage Rate', 'Average Payment Rate', 'Adjusted Principal Rate', 'None', 'a');

-- --------------------------------------------------------

--
-- Table structure for table `records`
--

CREATE TABLE `records` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `record_type` enum('training','applicant','backup','other') NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `records`
--

INSERT INTO `records` (`id`, `user_id`, `record_type`, `category`, `file_path`, `description`, `created_at`) VALUES
(1, 3, 'training', 'certificates', '/uploads/trainee/loan_cert.pdf', 'Loan Basics Certificate', '2025-03-13 01:00:00'),
(2, 4, 'applicant', 'evaluations', '/uploads/applicant/resume.pdf', 'Resume', '2025-03-10 09:30:00'),
(3, 4, 'applicant', 'evaluations', '/uploads/applicant/cover_letter.pdf', 'Cover Letter', '2025-03-11 10:30:00'),
(4, 2, 'training', 'guides', '/uploads/trainer/quiz_guide.pdf', 'Quiz Creation Guide', '2025-03-05 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `trainer_profiles`
--

CREATE TABLE `trainer_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trainer_profiles`
--

INSERT INTO `trainer_profiles` (`id`, `user_id`, `phone`, `bio`, `created_at`) VALUES
(1, 2, '', '', '2025-03-16 13:49:51');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('administrator','trainer','trainee','applicant') NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `email`, `role`, `status`, `created_at`, `last_login`, `department`) VALUES
(1, 'admin', '$2y$10$JG9FFbj5qBvv.DHPSagJjufZSUwP5L4TMDVipopHLbX5Dz.Jw8iVO', 'Admin Admin', 'admin@gmail.com', 'administrator', 'active', '2025-03-09 13:16:01', '2025-03-16 03:11:33', NULL),
(2, 'trainer', '$2y$10$FEGX/BEZrQ03299K6o/OQ.5BeRbcyZm0YOfUHAJ.ezjm4xdYhHhXK', 'Trainer Trainers', 'trainer@gmail.com', 'trainer', 'active', '2025-03-09 13:39:22', '2025-03-16 13:48:28', NULL),
(3, 'trainee', '$2y$10$o.JBoWQaMQpuMuzaxukgT.XuKXrOxcd1jF1W1XVXFx3IOBe6ByOq.', 'Trainee Trainee', 'trainee@gmail.com', 'trainee', 'active', '2025-03-09 13:38:54', '2025-03-16 14:00:59', NULL),
(4, 'applicant', '$2y$10$TONg2cTG/RZkaPi/PjD1hOx0xCb6crYoJZNrO1rvH7qFxUpWVqLhi', 'Applicant Applicant', 'applicant@gmail.com', 'applicant', 'active', '2025-03-09 13:15:17', '2025-03-15 14:44:35', NULL),
(5, 'admin1', '$2y$10$5PuQqTMqIwxi7Ol1Nw48huWuPgmzMuCqJ7usq4ezYzBSq31W68swG', 'admin1 admin1', 'admin1@gmail.com', 'administrator', 'active', '2025-03-14 15:17:21', '2025-03-14 15:17:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_activity`
--

CREATE TABLE `user_activity` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity_type` enum('login','logout','attendance') NOT NULL,
  `activity_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `details` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_activity`
--

INSERT INTO `user_activity` (`id`, `user_id`, `activity_type`, `activity_time`, `details`) VALUES
(1, 1, 'login', '2025-03-14 06:37:18', 'Admin logged in'),
(2, 2, 'login', '2025-03-14 07:12:16', 'Trainer logged in'),
(3, 3, 'login', '2025-03-14 07:12:25', 'Trainee logged in'),
(4, 3, 'attendance', '2025-03-14 07:15:00', 'Attended Loan Basics session'),
(5, 4, 'login', '2025-03-14 07:15:43', 'Applicant logged in'),
(6, 2, '', '2025-03-16 13:49:51', 'Updated profile information'),
(7, 2, '', '2025-03-16 14:00:40', 'Updated profile information');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `applicant_pools`
--
ALTER TABLE `applicant_pools`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `applicant_pool_assignments`
--
ALTER TABLE `applicant_pool_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `application_pool` (`application_id`,`pool_id`),
  ADD KEY `pool_id` (`pool_id`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_program` (`user_id`,`program_id`),
  ADD KEY `program_id` (`program_id`);

--
-- Indexes for table `backups`
--
ALTER TABLE `backups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `milestones`
--
ALTER TABLE `milestones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `program_id` (`program_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `milestone_progress`
--
ALTER TABLE `milestone_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `milestone_user` (`milestone_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `performance_incidents`
--
ALTER TABLE `performance_incidents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `reported_by` (`reported_by`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permission` (`role`,`permission`);

--
-- Indexes for table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `program_enrollments`
--
ALTER TABLE `program_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_program` (`user_id`,`program_id`),
  ADD KEY `program_id` (`program_id`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `program_id` (`program_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `quiz_attempt_answers`
--
ALTER TABLE `quiz_attempt_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attempt_id` (`attempt_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `records`
--
ALTER TABLE `records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `trainer_profiles`
--
ALTER TABLE `trainer_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_activity`
--
ALTER TABLE `user_activity`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `applicant_pools`
--
ALTER TABLE `applicant_pools`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `applicant_pool_assignments`
--
ALTER TABLE `applicant_pool_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `backups`
--
ALTER TABLE `backups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `milestones`
--
ALTER TABLE `milestones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `milestone_progress`
--
ALTER TABLE `milestone_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `performance_incidents`
--
ALTER TABLE `performance_incidents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `programs`
--
ALTER TABLE `programs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `program_enrollments`
--
ALTER TABLE `program_enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `quiz_attempt_answers`
--
ALTER TABLE `quiz_attempt_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `records`
--
ALTER TABLE `records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `trainer_profiles`
--
ALTER TABLE `trainer_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `user_activity`
--
ALTER TABLE `user_activity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `applicant_pools`
--
ALTER TABLE `applicant_pools`
  ADD CONSTRAINT `applicant_pools_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `applicant_pool_assignments`
--
ALTER TABLE `applicant_pool_assignments`
  ADD CONSTRAINT `applicant_pool_assignments_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applicant_pool_assignments_ibfk_2` FOREIGN KEY (`pool_id`) REFERENCES `applicant_pools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `backups`
--
ALTER TABLE `backups`
  ADD CONSTRAINT `backups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `milestones`
--
ALTER TABLE `milestones`
  ADD CONSTRAINT `milestones_ibfk_1` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `milestones_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `milestone_progress`
--
ALTER TABLE `milestone_progress`
  ADD CONSTRAINT `milestone_progress_ibfk_1` FOREIGN KEY (`milestone_id`) REFERENCES `milestones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `milestone_progress_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `performance_incidents`
--
ALTER TABLE `performance_incidents`
  ADD CONSTRAINT `performance_incidents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `performance_incidents_ibfk_2` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `programs`
--
ALTER TABLE `programs`
  ADD CONSTRAINT `programs_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `program_enrollments`
--
ALTER TABLE `program_enrollments`
  ADD CONSTRAINT `program_enrollments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `program_enrollments_ibfk_2` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quizzes_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_attempts_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_attempt_answers`
--
ALTER TABLE `quiz_attempt_answers`
  ADD CONSTRAINT `quiz_attempt_answers_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_attempt_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `records`
--
ALTER TABLE `records`
  ADD CONSTRAINT `records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `trainer_profiles`
--
ALTER TABLE `trainer_profiles`
  ADD CONSTRAINT `fk_trainer_profiles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_activity`
--
ALTER TABLE `user_activity`
  ADD CONSTRAINT `user_activity_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

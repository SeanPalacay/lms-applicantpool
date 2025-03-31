-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 30, 2025 at 03:03 AM
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
-- Table structure for table `access_codes`
--

CREATE TABLE `access_codes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `applicant_notes`
--

CREATE TABLE `applicant_notes` (
  `id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `applicant_pools`
--

CREATE TABLE `applicant_pools` (
  `id` int(11) NOT NULL,
  `pool_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `department` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applicant_pools`
--

INSERT INTO `applicant_pools` (`id`, `pool_name`, `description`, `created_by`, `created_at`, `department`) VALUES
(13, 'gg', 'gg', 1, '2025-03-26 05:00:29', 'Operations');

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
(15, 17, 13, '2025-03-26 07:17:25'),
(16, 18, 13, '2025-03-26 07:17:39');

-- --------------------------------------------------------

--
-- Table structure for table `applicant_pool_positions`
--

CREATE TABLE `applicant_pool_positions` (
  `id` int(11) NOT NULL,
  `pool_id` int(11) NOT NULL,
  `position_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applicant_pool_positions`
--

INSERT INTO `applicant_pool_positions` (`id`, `pool_id`, `position_name`, `created_at`) VALUES
(1, 13, 'Bookkeeper', '2025-03-26 05:00:29');

-- --------------------------------------------------------

--
-- Table structure for table `applicant_profiles`
--

CREATE TABLE `applicant_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `pool_id` int(11) NOT NULL,
  `job_role` varchar(50) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `status` enum('pending','shortlisted','hired','rejected','withdrawn') DEFAULT 'pending',
  `evaluation_score` decimal(5,2) DEFAULT NULL,
  `fst_score` decimal(5,2) DEFAULT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`id`, `user_id`, `pool_id`, `job_role`, `department`, `status`, `evaluation_score`, `fst_score`, `applied_at`, `updated_at`) VALUES
(17, 9, 13, 'Bookkeeper', 'Operations', 'pending', NULL, NULL, '2025-03-26 07:17:25', NULL),
(18, 4, 13, 'Bookkeeper', 'Operations', 'pending', NULL, NULL, '2025-03-26 07:17:39', '2025-03-26 07:18:12');

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
(2, '2025-03-14_manual', '/backups/2025-03-14.sql', 'manual', 1, '2025-03-14 06:00:00');

-- --------------------------------------------------------

--
-- Stand-in structure for view `department_positions`
-- (See below for the actual view)
--
CREATE TABLE `department_positions` (
`department` varchar(100)
,`positions` mediumtext
);

-- --------------------------------------------------------

--
-- Table structure for table `grade_configuration`
--

CREATE TABLE `grade_configuration` (
  `id` int(11) NOT NULL,
  `quiz_weight` decimal(5,2) NOT NULL DEFAULT 0.60,
  `practical_exam_weight` decimal(5,2) NOT NULL DEFAULT 0.40,
  `passing_grade` decimal(5,2) NOT NULL DEFAULT 70.00,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `grade_configuration`
--

INSERT INTO `grade_configuration` (`id`, `quiz_weight`, `practical_exam_weight`, `passing_grade`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 0.60, 0.40, 70.00, 1, '2025-03-25 07:59:07', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `job_positions`
--

CREATE TABLE `job_positions` (
  `id` int(11) NOT NULL,
  `department` varchar(100) NOT NULL,
  `position_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_positions`
--

INSERT INTO `job_positions` (`id`, `department`, `position_name`, `description`, `is_active`, `created_at`) VALUES
(1, 'Human Resources', 'HR Department Head', 'Oversees all HR operations and strategy', 1, '2025-03-25 09:17:02'),
(2, 'Human Resources', 'Employee Relations Specialist', 'Handles workplace disputes and employee engagement initiatives', 1, '2025-03-25 09:17:02'),
(3, 'Human Resources', 'Employee Welfare Specialist', 'Manages benefits, health programs, and work-life balance initiatives', 1, '2025-03-25 09:17:02'),
(4, 'Human Resources', 'Talent Acquisition Specialist', 'Focuses on recruitment and selection of new employees', 1, '2025-03-25 09:17:02'),
(5, 'Human Resources', 'Talent Development Specialist', 'Focuses on training, development, and career growth planning', 1, '2025-03-25 09:17:02'),
(6, 'Human Resources', 'Graphic Artist', 'Designs HR-related materials including posters and training materials', 1, '2025-03-25 09:17:02'),
(7, 'Accounting and Finance', 'Finance Department Head', 'Leads financial strategy and ensures compliance', 1, '2025-03-25 09:17:02'),
(8, 'Accounting and Finance', 'Accounting Specialist', 'Manages bookkeeping, financial reporting, and analysis', 1, '2025-03-25 09:17:02'),
(9, 'Accounting and Finance', 'Payroll Specialist', 'Handles employee compensation and benefits administration', 1, '2025-03-25 09:17:02'),
(10, 'Compliance and Strategic Support', 'Compliance Department Head', 'Ensures adherence to laws and regulations', 1, '2025-03-25 09:17:02'),
(11, 'Compliance and Strategic Support', 'Junior Compliance Officer', 'Assists in monitoring regulatory compliance', 1, '2025-03-25 09:17:02'),
(12, 'Compliance and Strategic Support', 'Research Analyst', 'Conducts market and industry research', 1, '2025-03-25 09:17:02'),
(13, 'Compliance and Strategic Support', 'Planning Officer', 'Develops strategic plans for organizational growth', 1, '2025-03-25 09:17:02'),
(14, 'Compliance and Strategic Support', 'Customer Service Representative', 'Handles client inquiries and support', 1, '2025-03-25 09:17:02'),
(15, 'Client Development and Services', 'CDS Department Head', 'Manages client relationships and service delivery', 1, '2025-03-25 09:17:02'),
(16, 'Client Development and Services', 'Social Services Specialist', 'Provides community-focused services', 1, '2025-03-25 09:17:02'),
(17, 'Client Development and Services', 'Enterprise Development Specialist', 'Supports business growth initiatives', 1, '2025-03-25 09:17:02'),
(18, 'Client Development and Services', 'Member Development Specialist', 'Enhances member satisfaction and retention', 1, '2025-03-25 09:17:02'),
(19, 'Internal Audit', 'Internal Audit Department Head', 'Oversees audit processes and reporting', 1, '2025-03-25 09:17:02'),
(20, 'Internal Audit', 'Internal Audit Staff', 'Conducts audits to ensure financial accuracy', 1, '2025-03-25 09:17:02'),
(21, 'Internal Audit', 'Credit Analyst', 'Validates loan applications and assesses creditworthiness', 1, '2025-03-25 09:17:02'),
(22, 'General Services', 'General Services Staff', 'Handles maintenance, logistics, and administrative tasks', 1, '2025-03-25 09:17:02'),
(23, 'General Services', 'IT Specialist', 'Manages IT infrastructure, networks and hardware', 1, '2025-03-25 09:17:02'),
(24, 'Operations', 'Operations Head', 'Leads overall operations', 1, '2025-03-25 09:17:02'),
(25, 'Operations', 'Area Manager', 'Supervises regional branches', 1, '2025-03-25 09:17:02'),
(26, 'Operations', 'Branch Manager', 'Manages individual branch operations', 1, '2025-03-25 09:17:02'),
(27, 'Operations', 'Bookkeeper', 'Handles branch-level financial records', 1, '2025-03-25 09:17:02'),
(28, 'Operations', 'Account Officer', 'Manages loans and client accounts', 1, '2025-03-25 09:17:02'),
(29, 'Operations', 'Loan Officer', 'Processes and manages loan applications', 1, '2025-03-25 09:17:02'),
(30, 'Operations', 'Support Staff', 'Assists with branch-level errands and tasks', 1, '2025-03-25 09:17:02');

-- --------------------------------------------------------

--
-- Table structure for table `job_requirements`
--

CREATE TABLE `job_requirements` (
  `id` int(11) NOT NULL,
  `position_id` int(11) NOT NULL,
  `requirement` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_requirements`
--

INSERT INTO `job_requirements` (`id`, `position_id`, `requirement`, `created_at`) VALUES
(1, 1, 'Bachelor\'s or Master\'s degree in Human Resources or related field', '2025-03-26 02:37:46'),
(2, 1, 'Minimum of 5 years of experience in HR management', '2025-03-26 02:37:46'),
(3, 1, 'Strong knowledge of labor laws and HR best practices', '2025-03-26 02:37:46'),
(4, 1, 'Excellent leadership and team management skills', '2025-03-26 02:37:46'),
(5, 1, 'Strong strategic planning and implementation abilities', '2025-03-26 02:37:46'),
(6, 2, 'Bachelor\'s degree in Human Resources or related field', '2025-03-26 02:37:46'),
(7, 2, '2-3 years of experience in employee relations', '2025-03-26 02:37:46'),
(8, 2, 'Strong conflict resolution and mediation skills', '2025-03-26 02:37:46'),
(9, 2, 'Knowledge of labor laws and company policies', '2025-03-26 02:37:46'),
(10, 2, 'Excellent interpersonal and communication skills', '2025-03-26 02:37:46'),
(11, 29, 'Bachelor\'s degree in Finance, Business, or related field', '2025-03-26 02:37:46'),
(12, 29, 'Strong analytical and decision-making skills', '2025-03-26 02:37:46'),
(13, 29, 'Excellent communication and interpersonal abilities', '2025-03-26 02:37:46'),
(14, 29, 'Knowledge of lending regulations and compliance requirements', '2025-03-26 02:37:46'),
(15, 29, 'Experience with financial analysis and risk assessment', '2025-03-26 02:37:46'),
(16, 8, 'Bachelor\'s degree in Accounting or Finance', '2025-03-26 02:37:46'),
(17, 8, 'Knowledge of accounting principles and practices', '2025-03-26 02:37:46'),
(18, 8, 'Proficiency in accounting software', '2025-03-26 02:37:46'),
(19, 8, 'Attention to detail and analytical thinking', '2025-03-26 02:37:46'),
(20, 8, 'Strong organizational and time management skills', '2025-03-26 02:37:46'),
(21, 21, 'Bachelor\'s degree in Finance, Economics, or related field', '2025-03-26 02:37:46'),
(22, 21, 'Strong analytical and quantitative skills', '2025-03-26 02:37:46'),
(23, 21, 'Knowledge of credit assessment methodologies', '2025-03-26 02:37:46'),
(24, 21, 'Attention to detail and critical thinking', '2025-03-26 02:37:46'),
(25, 21, 'Understanding of financial statements and risk indicators', '2025-03-26 02:37:46');

-- --------------------------------------------------------

--
-- Table structure for table `job_responsibilities`
--

CREATE TABLE `job_responsibilities` (
  `id` int(11) NOT NULL,
  `position_id` int(11) NOT NULL,
  `responsibility` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_responsibilities`
--

INSERT INTO `job_responsibilities` (`id`, `position_id`, `responsibility`, `created_at`) VALUES
(1, 1, 'Oversee all HR operations and strategy', '2025-03-26 02:37:46'),
(2, 1, 'Develop and implement HR policies and procedures', '2025-03-26 02:37:46'),
(3, 1, 'Lead recruitment, training, and performance management initiatives', '2025-03-26 02:37:46'),
(4, 1, 'Ensure compliance with labor laws and regulations', '2025-03-26 02:37:46'),
(5, 1, 'Provide guidance to department managers on HR-related issues', '2025-03-26 02:37:46'),
(6, 2, 'Handle workplace disputes and employee grievances', '2025-03-26 02:37:46'),
(7, 2, 'Implement employee engagement initiatives', '2025-03-26 02:37:46'),
(8, 2, 'Conduct investigations into workplace issues', '2025-03-26 02:37:46'),
(9, 2, 'Facilitate conflict resolution between employees', '2025-03-26 02:37:46'),
(10, 2, 'Support managers in addressing performance concerns', '2025-03-26 02:37:46'),
(11, 29, 'Process and evaluate loan applications', '2025-03-26 02:37:46'),
(12, 29, 'Conduct financial analysis and risk assessment', '2025-03-26 02:37:46'),
(13, 29, 'Ensure compliance with lending policies and regulations', '2025-03-26 02:37:46'),
(14, 29, 'Build and maintain client relationships', '2025-03-26 02:37:46'),
(15, 29, 'Document and maintain accurate records', '2025-03-26 02:37:46'),
(16, 8, 'Manage bookkeeping and financial reporting', '2025-03-26 02:37:46'),
(17, 8, 'Prepare and analyze financial statements', '2025-03-26 02:37:46'),
(18, 8, 'Process accounts payable and receivable', '2025-03-26 02:37:46'),
(19, 8, 'Assist with audits and financial analysis', '2025-03-26 02:37:46'),
(20, 8, 'Ensure compliance with accounting standards', '2025-03-26 02:37:46'),
(21, 21, 'Analyze loan applications and assess creditworthiness', '2025-03-26 02:37:46'),
(22, 21, 'Evaluate financial statements and credit reports', '2025-03-26 02:37:46'),
(23, 21, 'Determine appropriate loan amounts and terms', '2025-03-26 02:37:46'),
(24, 21, 'Prepare credit risk assessment reports', '2025-03-26 02:37:46'),
(25, 21, 'Monitor existing loan portfolios for potential issues', '2025-03-26 02:37:46');

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
(1, 1, 3, 'completed', '2025-03-17 16:05:32'),
(2, 3, 3, 'completed', '2025-03-16 08:42:43');

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
(4, 2, 'info', 'New Trainee Enrolled', 'Trainee Trainee enrolled in Loan Officer Basics.', '2025-03-09 16:00:00', '2025-03-14 07:12:16'),
(5, 2, 'info', 'New Practical Exam Submission', 'Trainee Trainee has submitted a practical exam for \"try11\"', '2025-03-25 04:57:52', NULL),
(6, 3, 'info', 'New Program Enrollment', 'You have been enrolled in the program: try1', '2025-03-25 07:20:14', NULL),
(7, 4, 'info', 'Application Submitted', 'Your application to the pool has been submitted successfully.', '2025-03-26 04:42:14', NULL),
(8, 4, 'info', 'Pool Assignment', 'You have been added to a new applicant pool.', '2025-03-26 04:43:04', NULL),
(9, 4, 'info', 'Application Submitted', 'Your application to the pool has been submitted successfully.', '2025-03-26 05:01:06', NULL),
(10, 4, 'success', 'Application Status Updated', 'Your application status has been updated to Shortlisted.', '2025-03-26 05:01:37', NULL),
(11, 4, 'info', 'Application Status Updated', 'Your application status has been updated to Pending.', '2025-03-26 05:01:38', NULL),
(12, 4, 'success', 'Application Status Updated', 'Your application status has been updated to Shortlisted.', '2025-03-26 05:17:35', NULL),
(13, 4, 'info', 'Application Status Updated', 'Your application status has been updated to Pending.', '2025-03-26 06:08:57', NULL),
(14, 4, 'error', 'Application Status Updated', 'Your application status has been updated to Rejected.', '2025-03-26 06:09:00', NULL),
(15, 4, 'info', 'Application Status Updated', 'Your application status has been updated to Pending.', '2025-03-26 06:10:03', NULL),
(16, 4, 'success', 'Application Status Updated', 'Your application status has been updated to Shortlisted.', '2025-03-26 07:17:53', NULL),
(17, 4, 'info', 'Application Status Updated', 'Your application status has been updated to Pending.', '2025-03-26 07:18:12', NULL),
(18, 3, 'success', 'Practical Exam Submitted', 'Your practical exam has been submitted successfully and is awaiting grading.', '2025-03-29 14:15:36', NULL);

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
-- Table structure for table `position_program_relation`
--

CREATE TABLE `position_program_relation` (
  `id` int(11) NOT NULL,
  `position_id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `position_program_relation`
--

INSERT INTO `position_program_relation` (`id`, `position_id`, `program_id`, `created_at`) VALUES
(1, 1, 2, '2025-03-26 02:37:46'),
(2, 2, 2, '2025-03-26 02:37:46'),
(3, 3, 2, '2025-03-26 02:37:46'),
(4, 4, 2, '2025-03-26 02:37:46'),
(5, 29, 1, '2025-03-26 02:37:46'),
(6, 29, 3, '2025-03-26 02:37:46'),
(7, 8, 2, '2025-03-26 02:37:46'),
(8, 21, 3, '2025-03-26 02:37:46');

-- --------------------------------------------------------

--
-- Table structure for table `practical_exams`
--

CREATE TABLE `practical_exams` (
  `id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `max_score` decimal(5,2) DEFAULT 100.00,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `practical_exams`
--

INSERT INTO `practical_exams` (`id`, `program_id`, `title`, `description`, `max_score`, `created_by`, `created_at`) VALUES
(1, 11, 'try', 'try', 100.00, 2, '2025-03-25 03:26:56'),
(2, 1, 'try11', '11', 100.00, 2, '2025-03-25 04:57:35');

-- --------------------------------------------------------

--
-- Table structure for table `practical_exam_attempts`
--

CREATE TABLE `practical_exam_attempts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `exam_id` int(11) NOT NULL,
  `submission_text` text NOT NULL,
  `score` decimal(5,2) DEFAULT 0.00,
  `feedback` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `graded_by` int(11) DEFAULT NULL,
  `graded_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `practical_exam_attempts`
--

INSERT INTO `practical_exam_attempts` (`id`, `user_id`, `exam_id`, `submission_text`, `score`, `feedback`, `submitted_at`, `graded_by`, `graded_at`) VALUES
(1, 3, 2, 'gege', 97.00, 'sad', '2025-03-25 04:57:52', 2, '2025-03-25 05:22:31'),
(2, 3, 1, 'gege', 90.00, 'gg', '2025-03-29 14:15:36', 2, '2025-03-29 14:16:06');

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
(3, 'Advanced Loan Training', 'Deep dive into loan management', 'regular', 2, '2025-03-04 19:00:00'),
(11, 'try1', 'try', 'regular', 2, '2025-03-25 02:33:59');

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
(1, 3, 1, '2025-03-09 16:00:00', 'completed', 100.00),
(2, 3, 2, '2025-03-10 16:00:00', 'not_started', 0.00),
(3, 3, 3, '2025-03-11 16:00:00', 'completed', 100.00),
(4, 3, 11, '2025-03-25 07:20:14', 'completed', 100.00);

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
  `status` enum('draft','active') NOT NULL DEFAULT 'draft',
  `grading_type` enum('standard','weighted','custom') DEFAULT 'standard',
  `auto_feedback` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quizzes`
--

INSERT INTO `quizzes` (`id`, `program_id`, `title`, `description`, `time_limit`, `passing_score`, `created_by`, `created_at`, `status`, `grading_type`, `auto_feedback`) VALUES
(1, 1, 'Loan Basics Quiz', 'Test basic loan knowledge', 30, 70.00, 2, '2025-03-01 18:00:00', 'active', 'standard', 0),
(2, 2, 'Policy Quiz', 'Policy comprehension test', 20, 75.00, 2, '2025-03-02 19:00:00', 'draft', 'standard', 0),
(3, 3, 'Advanced Loan Quiz', 'Advanced loan scenarios', 45, 80.00, 2, '2025-03-05 20:00:00', 'draft', 'standard', 0),
(5, 1, 'Trainee Practice Quiz', 'A practice quiz for trainees on loan basics', 15, 70.00, 2, '2025-03-16 15:21:27', 'active', 'standard', 0);

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
(3, 3, 1, 75.00, 28, '2025-03-16 02:00:00', 'Nice attempt, focus on credit scores.'),
(4, 3, 5, 66.67, NULL, '2025-03-16 15:22:18', 'Review the material and try again.');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempt_answers`
--

CREATE TABLE `quiz_attempt_answers` (
  `id` int(11) NOT NULL,
  `attempt_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `selected_answer` text NOT NULL
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
(7, 3, 12, 'a'),
(8, 4, 13, 'a'),
(9, 4, 14, 'd'),
(10, 4, 15, 'b');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_feedback_templates`
--

CREATE TABLE `quiz_feedback_templates` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `score_range_min` decimal(5,2) DEFAULT 0.00,
  `score_range_max` decimal(5,2) DEFAULT 100.00,
  `feedback_template` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_type` enum('multiple_choice','multiple_answer','true_false','identification','matching','essay') NOT NULL DEFAULT 'multiple_choice',
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

INSERT INTO `quiz_questions` (`id`, `quiz_id`, `question_type`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`) VALUES
(3, 2, 'multiple_choice', 'New policy effective date?', 'Jan 1', 'Mar 1', 'Jun 1', 'Dec 1', 'b'),
(4, 3, 'multiple_choice', 'What is a balloon payment?', 'Full payment', 'Partial payment', 'Interest only', 'None', 'a'),
(8, 1, 'multiple_choice', 'What is the max loan term?', '30 days', '60 days', '90 days', '120 days', 'c'),
(9, 1, 'multiple_choice', 'Who approves loans?', 'Manager', 'Officer', 'Client', 'System', 'b'),
(11, 1, 'multiple_choice', 'What is the minimum credit score required?', '600', '650', '700', '750', 'b'),
(12, 1, 'multiple_choice', 'What does APR stand for?', 'Annual Percentage Rate', 'Average Payment Rate', 'Adjusted Principal Rate', 'None', 'a'),
(13, 5, 'multiple_choice', 'What is the primary purpose of a loan?', 'To borrow money', 'To save money', 'To invest', 'To pay taxes', 'a'),
(14, 5, 'multiple_choice', 'Which factor most affects loan approval?', 'Credit score', 'Favorite color', 'Shoe size', 'Pet’s name', 'a'),
(15, 5, 'multiple_choice', 'What is an interest rate?', 'A fee for late payment', 'The cost of borrowing', 'A bonus for repayment', 'A tax deduction', 'b');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_question_answer_options`
--

CREATE TABLE `quiz_question_answer_options` (
  `id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `option_text` varchar(255) NOT NULL,
  `option_key` varchar(2) NOT NULL,
  `is_correct` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_question_matching_pairs`
--

CREATE TABLE `quiz_question_matching_pairs` (
  `id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `left_item` varchar(255) NOT NULL,
  `right_item` varchar(255) NOT NULL,
  `pair_key` varchar(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_question_weights`
--

CREATE TABLE `quiz_question_weights` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `weight` decimal(5,2) DEFAULT 1.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(4, 2, 'training', 'guides', '/uploads/trainer/quiz_guide.pdf', 'Quiz Creation Guide', '2025-03-05 00:00:00'),
(6, 9, 'applicant', 'evaluations', 'uploads/documents/9_1742974622_67e3ae9ec6609.pdf', 'LMS.pdf', '2025-03-26 07:37:02');

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
(1, 2, '123-456-7890', 'Experienced trainer in loan management', '2025-03-16 13:49:51');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `department` text DEFAULT NULL,
  `role` enum('administrator','trainer','trainee','applicant','employee') NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `email`, `phone`, `address`, `department`, `role`, `status`, `created_at`, `last_login`) VALUES
(1, 'admin', '$2y$10$JG9FFbj5qBvv.DHPSagJjufZSUwP5L4TMDVipopHLbX5Dz.Jw8iVO', 'Admin Admin', 'admin@gmail.com', NULL, NULL, 'Management', 'administrator', 'active', '2025-03-09 13:16:01', '2025-03-29 14:22:07'),
(2, 'trainer', '$2y$10$FEGX/BEZrQ03299K6o/OQ.5BeRbcyZm0YOfUHAJ.ezjm4xdYhHhXK', 'Trainer Trainers', 'trainer@gmail.com', NULL, NULL, 'Human Resources', 'trainer', 'active', '2025-03-09 13:39:22', '2025-03-29 14:15:47'),
(3, 'trainee', '$2y$10$o.JBoWQaMQpuMuzaxukgT.XuKXrOxcd1jF1W1XVXFx3IOBe6ByOq.', 'Trainee Trainee', 'trainee@gmail.com', NULL, NULL, 'Operations', 'trainee', 'active', '2025-03-09 13:38:54', '2025-03-29 14:16:13'),
(4, 'applicant', '$2y$10$TONg2cTG/RZkaPi/PjD1hOx0xCb6crYoJZNrO1rvH7qFxUpWVqLhi', 'Applicant Applicant', 'applicant@gmail.com', NULL, NULL, 'Operations', 'applicant', 'active', '2025-03-09 13:15:17', '2025-03-29 14:21:51'),
(5, 'admin1', '$2y$10$5PuQqTMqIwxi7Ol1Nw48huWuPgmzMuCqJ7usq4ezYzBSq31W68swG', 'admin1 admin1', 'admin1@gmail.com', NULL, NULL, NULL, 'administrator', 'active', '2025-03-14 15:17:21', '2025-03-18 03:06:38'),
(8, 'applicant2', '$2y$10$rvxU.uX6yUR90npUGrH3q.hObW2FiKXVFs2vcMeKD0kSxEzulFw4K', 'applicant2 applicant2', 'applicant2@gmail.com', NULL, NULL, 'Accounting and Finance', 'applicant', 'active', '2025-03-18 02:24:08', '2025-03-26 07:24:35'),
(9, 'applicant1', '$2y$10$iZawKoM2ITue2Og2xD8D9eTrSc3P/gLpnFzV.eV1k/TaviUu1Rl8u', 'applicant1 applicant1', 'applicant1@gmail.com', NULL, NULL, 'Compliance and Strategic Support', 'applicant', 'active', '2025-03-18 02:24:46', '2025-03-26 07:46:06'),
(10, 'trainee1', '$2y$10$rgUXb4MDGOc1LMIOoGS6pOddG./JU3XmLiE3UWEmi9VSAZhE1g7G.', 'trainee1', 'trainee1@gmail.com', NULL, NULL, 'Client Development and Services', 'trainee', 'active', '2025-03-18 03:07:04', '2025-03-26 15:53:40'),
(11, 'employee', '$2y$10$lct7rJQrUSse7C/876vGp.asPqskev0mSlL/wZLUlklXE0x94GVIa', 'employee employee', 'employee@gmail.com', NULL, NULL, NULL, 'employee', 'active', '2025-03-26 08:50:16', '2025-03-26 15:30:04');

-- --------------------------------------------------------

--
-- Table structure for table `user_activity`
--

CREATE TABLE `user_activity` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity_type` enum('login','logout','attendance','profile_update') NOT NULL DEFAULT 'login',
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
(7, 2, '', '2025-03-16 14:00:40', 'Updated profile information'),
(8, 3, '', '2025-03-16 17:06:40', 'Updated profile information'),
(9, 3, '', '2025-03-22 15:49:45', 'Viewed own profile'),
(10, 3, '', '2025-03-22 15:49:45', 'Viewed own profile'),
(11, 3, '', '2025-03-22 16:09:29', 'Viewed own profile'),
(12, 3, '', '2025-03-22 16:09:30', 'Viewed own profile'),
(13, 3, '', '2025-03-22 16:10:43', 'Viewed own profile'),
(14, 3, '', '2025-03-22 16:10:43', 'Viewed own profile'),
(15, 3, '', '2025-03-22 16:10:50', 'Viewed own profile'),
(16, 3, '', '2025-03-22 16:10:50', 'Viewed own profile'),
(17, 3, '', '2025-03-22 16:10:54', 'Viewed own profile'),
(18, 3, '', '2025-03-22 16:10:54', 'Viewed own profile'),
(19, 3, '', '2025-03-22 16:10:59', 'Viewed own profile'),
(20, 3, '', '2025-03-22 16:10:59', 'Viewed own profile'),
(21, 3, 'profile_update', '2025-03-22 16:11:21', 'Updated profile information'),
(22, 3, '', '2025-03-22 16:19:36', 'Viewed own profile'),
(23, 3, '', '2025-03-22 16:19:43', 'Viewed own profile'),
(24, 3, '', '2025-03-22 16:19:43', 'Viewed own profile'),
(25, 3, 'profile_update', '2025-03-22 16:19:59', 'Updated profile information (uploaded resume)'),
(26, 3, '', '2025-03-22 16:20:03', 'Viewed own profile'),
(27, 3, '', '2025-03-22 16:20:03', 'Viewed own profile'),
(28, 3, '', '2025-03-22 16:20:16', 'Viewed own profile'),
(29, 3, '', '2025-03-22 16:20:16', 'Viewed own profile'),
(30, 3, '', '2025-03-22 16:22:27', 'Viewed own profile'),
(31, 3, '', '2025-03-22 16:22:27', 'Viewed own profile'),
(32, 3, '', '2025-03-22 16:22:52', 'Viewed own profile'),
(33, 3, '', '2025-03-22 16:22:52', 'Viewed own profile'),
(34, 3, '', '2025-03-22 16:22:54', 'Viewed own profile'),
(35, 3, '', '2025-03-22 16:22:54', 'Viewed own profile'),
(36, 3, '', '2025-03-22 16:24:07', 'Viewed own profile'),
(37, 3, '', '2025-03-22 16:24:07', 'Viewed own profile'),
(38, 3, '', '2025-03-22 16:30:38', 'Viewed own profile'),
(39, 3, '', '2025-03-22 16:30:38', 'Viewed own profile'),
(40, 3, '', '2025-03-22 16:37:04', 'Viewed own profile'),
(41, 3, '', '2025-03-22 16:37:04', 'Viewed own profile'),
(42, 3, '', '2025-03-22 16:44:47', 'Viewed own profile'),
(43, 3, '', '2025-03-22 16:44:48', 'Viewed own profile'),
(44, 3, '', '2025-03-22 16:44:53', 'Viewed own profile'),
(45, 3, '', '2025-03-22 16:44:54', 'Viewed own profile'),
(46, 3, '', '2025-03-24 17:34:58', 'Viewed own profile'),
(47, 3, '', '2025-03-24 17:34:58', 'Viewed own profile'),
(48, 3, '', '2025-03-24 18:00:55', 'Viewed own profile'),
(49, 3, '', '2025-03-24 18:00:55', 'Viewed own profile'),
(50, 3, '', '2025-03-24 18:12:03', 'Viewed own profile'),
(51, 3, '', '2025-03-24 18:12:28', 'Viewed own profile'),
(52, 3, '', '2025-03-24 18:13:04', 'Viewed own profile'),
(53, 3, '', '2025-03-24 18:13:12', 'Viewed own profile'),
(54, 3, '', '2025-03-24 18:13:12', 'Viewed own profile'),
(55, 3, '', '2025-03-24 18:14:14', 'Viewed own profile'),
(56, 3, '', '2025-03-24 18:14:22', 'Viewed own profile'),
(57, 3, '', '2025-03-24 18:14:24', 'Viewed own profile'),
(58, 3, '', '2025-03-24 18:14:24', 'Viewed own profile'),
(59, 3, '', '2025-03-24 18:18:20', 'Viewed own profile'),
(60, 3, '', '2025-03-24 18:18:23', 'Viewed own profile'),
(61, 3, '', '2025-03-24 18:18:23', 'Viewed own profile'),
(62, 3, 'profile_update', '2025-03-24 18:18:31', 'Updated profile information (uploaded resume)'),
(63, 3, '', '2025-03-24 18:18:40', 'Viewed own profile'),
(64, 3, '', '2025-03-24 18:18:40', 'Viewed own profile'),
(65, 3, '', '2025-03-24 18:18:56', 'Viewed resume: LMS.pdf'),
(66, 3, '', '2025-03-24 18:38:15', 'Viewed own profile'),
(67, 3, '', '2025-03-24 18:38:15', 'Viewed own profile'),
(68, 3, '', '2025-03-24 18:38:18', 'Viewed own profile'),
(69, 3, '', '2025-03-24 18:38:18', 'Viewed own profile'),
(70, 3, '', '2025-03-24 18:38:23', 'Viewed resume: LMS.pdf'),
(71, 3, '', '2025-03-24 18:38:31', 'Viewed own profile'),
(72, 3, '', '2025-03-24 18:38:31', 'Viewed own profile'),
(73, 3, 'profile_update', '2025-03-24 18:38:36', 'Updated profile information'),
(74, 10, '', '2025-03-25 08:19:26', 'Viewed own profile'),
(75, 10, '', '2025-03-25 08:19:26', 'Viewed own profile'),
(76, 3, '', '2025-03-25 08:22:17', 'Viewed own profile'),
(77, 3, '', '2025-03-25 08:22:17', 'Viewed own profile'),
(78, 11, '', '2025-03-26 09:10:55', 'Viewed own profile'),
(79, 11, '', '2025-03-26 09:10:55', 'Viewed own profile'),
(80, 11, '', '2025-03-26 09:11:00', 'Viewed own profile'),
(81, 11, '', '2025-03-26 09:11:00', 'Viewed own profile'),
(82, 11, '', '2025-03-26 09:20:08', 'Viewed own profile'),
(83, 11, '', '2025-03-26 09:20:08', 'Viewed own profile'),
(84, 11, '', '2025-03-26 15:27:15', 'Viewed own profile'),
(85, 11, '', '2025-03-26 15:27:15', 'Viewed own profile'),
(86, 3, '', '2025-03-29 14:15:41', 'Viewed own profile'),
(87, 3, '', '2025-03-29 14:15:41', 'Viewed own profile'),
(88, 3, '', '2025-03-29 14:17:16', 'Viewed own profile'),
(89, 3, '', '2025-03-29 14:17:16', 'Viewed own profile'),
(90, 3, '', '2025-03-29 14:17:22', 'Viewed own profile'),
(91, 3, '', '2025-03-29 14:17:22', 'Viewed own profile'),
(92, 3, '', '2025-03-29 14:19:00', 'Viewed own profile'),
(93, 3, '', '2025-03-29 14:19:00', 'Viewed own profile');

-- --------------------------------------------------------

--
-- Table structure for table `user_education`
--

CREATE TABLE `user_education` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `degree` varchar(100) NOT NULL,
  `institution` varchar(100) NOT NULL,
  `graduation_year` int(4) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_experience`
--

CREATE TABLE `user_experience` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `position` varchar(100) NOT NULL,
  `company` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_resumes`
--

CREATE TABLE `user_resumes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_resumes`
--

INSERT INTO `user_resumes` (`id`, `user_id`, `file_path`, `original_name`, `uploaded_at`) VALUES
(1, 3, 'uploads/resume/3_1742840311_LMS.pdf', 'LMS.pdf', '2025-03-24 18:18:31');

-- --------------------------------------------------------

--
-- Table structure for table `user_skills`
--

CREATE TABLE `user_skills` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `skill` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `department_positions`
--
DROP TABLE IF EXISTS `department_positions`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `department_positions`  AS SELECT `job_positions`.`department` AS `department`, group_concat(`job_positions`.`position_name` separator ', ') AS `positions` FROM `job_positions` WHERE `job_positions`.`is_active` = 1 GROUP BY `job_positions`.`department` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `access_codes`
--
ALTER TABLE `access_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_code` (`user_id`,`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `fk_access_codes_creator` (`created_by`),
  ADD KEY `idx_access_code` (`code`),
  ADD KEY `idx_expiration` (`expires_at`);

--
-- Indexes for table `applicant_notes`
--
ALTER TABLE `applicant_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `applicant_id` (`applicant_id`),
  ADD KEY `created_by` (`created_by`);

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
-- Indexes for table `applicant_pool_positions`
--
ALTER TABLE `applicant_pool_positions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pool_id` (`pool_id`);

--
-- Indexes for table `applicant_profiles`
--
ALTER TABLE `applicant_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_pool` (`user_id`,`pool_id`),
  ADD KEY `pool_id` (`pool_id`);

--
-- Indexes for table `backups`
--
ALTER TABLE `backups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `grade_configuration`
--
ALTER TABLE `grade_configuration`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `job_positions`
--
ALTER TABLE `job_positions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_requirements`
--
ALTER TABLE `job_requirements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `position_id` (`position_id`);

--
-- Indexes for table `job_responsibilities`
--
ALTER TABLE `job_responsibilities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `position_id` (`position_id`);

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
-- Indexes for table `position_program_relation`
--
ALTER TABLE `position_program_relation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `position_program` (`position_id`,`program_id`),
  ADD KEY `program_id` (`program_id`);

--
-- Indexes for table `practical_exams`
--
ALTER TABLE `practical_exams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `program_id` (`program_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `practical_exam_attempts`
--
ALTER TABLE `practical_exam_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `exam_id` (`exam_id`),
  ADD KEY `graded_by` (`graded_by`);

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
-- Indexes for table `quiz_feedback_templates`
--
ALTER TABLE `quiz_feedback_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `quiz_question_answer_options`
--
ALTER TABLE `quiz_question_answer_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `quiz_question_matching_pairs`
--
ALTER TABLE `quiz_question_matching_pairs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `quiz_question_weights`
--
ALTER TABLE `quiz_question_weights`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `quiz_question` (`quiz_id`,`question_id`),
  ADD KEY `question_id` (`question_id`);

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
-- Indexes for table `user_education`
--
ALTER TABLE `user_education`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `user_experience`
--
ALTER TABLE `user_experience`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `user_resumes`
--
ALTER TABLE `user_resumes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `user_skills`
--
ALTER TABLE `user_skills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `access_codes`
--
ALTER TABLE `access_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `applicant_notes`
--
ALTER TABLE `applicant_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `applicant_pools`
--
ALTER TABLE `applicant_pools`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `applicant_pool_assignments`
--
ALTER TABLE `applicant_pool_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `applicant_pool_positions`
--
ALTER TABLE `applicant_pool_positions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `applicant_profiles`
--
ALTER TABLE `applicant_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `backups`
--
ALTER TABLE `backups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `grade_configuration`
--
ALTER TABLE `grade_configuration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `job_positions`
--
ALTER TABLE `job_positions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `job_requirements`
--
ALTER TABLE `job_requirements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `job_responsibilities`
--
ALTER TABLE `job_responsibilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

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
-- AUTO_INCREMENT for table `position_program_relation`
--
ALTER TABLE `position_program_relation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `practical_exams`
--
ALTER TABLE `practical_exams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `practical_exam_attempts`
--
ALTER TABLE `practical_exam_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `programs`
--
ALTER TABLE `programs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `program_enrollments`
--
ALTER TABLE `program_enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `quiz_attempt_answers`
--
ALTER TABLE `quiz_attempt_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `quiz_feedback_templates`
--
ALTER TABLE `quiz_feedback_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `quiz_question_answer_options`
--
ALTER TABLE `quiz_question_answer_options`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `quiz_question_matching_pairs`
--
ALTER TABLE `quiz_question_matching_pairs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz_question_weights`
--
ALTER TABLE `quiz_question_weights`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `records`
--
ALTER TABLE `records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `trainer_profiles`
--
ALTER TABLE `trainer_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `user_activity`
--
ALTER TABLE `user_activity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `user_education`
--
ALTER TABLE `user_education`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_experience`
--
ALTER TABLE `user_experience`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_resumes`
--
ALTER TABLE `user_resumes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_skills`
--
ALTER TABLE `user_skills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `access_codes`
--
ALTER TABLE `access_codes`
  ADD CONSTRAINT `fk_access_codes_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_access_codes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `applicant_notes`
--
ALTER TABLE `applicant_notes`
  ADD CONSTRAINT `applicant_notes_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicant_pool_assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applicant_notes_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
-- Constraints for table `applicant_pool_positions`
--
ALTER TABLE `applicant_pool_positions`
  ADD CONSTRAINT `fk_pool_positions_pool` FOREIGN KEY (`pool_id`) REFERENCES `applicant_pools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `applicant_profiles`
--
ALTER TABLE `applicant_profiles`
  ADD CONSTRAINT `applicant_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`pool_id`) REFERENCES `applicant_pools` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `backups`
--
ALTER TABLE `backups`
  ADD CONSTRAINT `backups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `grade_configuration`
--
ALTER TABLE `grade_configuration`
  ADD CONSTRAINT `grade_configuration_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `job_requirements`
--
ALTER TABLE `job_requirements`
  ADD CONSTRAINT `job_requirements_ibfk_1` FOREIGN KEY (`position_id`) REFERENCES `job_positions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `job_responsibilities`
--
ALTER TABLE `job_responsibilities`
  ADD CONSTRAINT `job_responsibilities_ibfk_1` FOREIGN KEY (`position_id`) REFERENCES `job_positions` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `position_program_relation`
--
ALTER TABLE `position_program_relation`
  ADD CONSTRAINT `position_program_relation_ibfk_1` FOREIGN KEY (`position_id`) REFERENCES `job_positions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `position_program_relation_ibfk_2` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `practical_exams`
--
ALTER TABLE `practical_exams`
  ADD CONSTRAINT `practical_exams_ibfk_1` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `practical_exams_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `practical_exam_attempts`
--
ALTER TABLE `practical_exam_attempts`
  ADD CONSTRAINT `practical_exam_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `practical_exam_attempts_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `practical_exams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `practical_exam_attempts_ibfk_3` FOREIGN KEY (`graded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
-- Constraints for table `quiz_feedback_templates`
--
ALTER TABLE `quiz_feedback_templates`
  ADD CONSTRAINT `quiz_feedback_templates_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_question_answer_options`
--
ALTER TABLE `quiz_question_answer_options`
  ADD CONSTRAINT `quiz_question_answer_options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_question_matching_pairs`
--
ALTER TABLE `quiz_question_matching_pairs`
  ADD CONSTRAINT `quiz_question_matching_pairs_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_question_weights`
--
ALTER TABLE `quiz_question_weights`
  ADD CONSTRAINT `quiz_question_weights_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_question_weights_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE;

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

--
-- Constraints for table `user_education`
--
ALTER TABLE `user_education`
  ADD CONSTRAINT `user_education_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_experience`
--
ALTER TABLE `user_experience`
  ADD CONSTRAINT `user_experience_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_resumes`
--
ALTER TABLE `user_resumes`
  ADD CONSTRAINT `user_resumes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_skills`
--
ALTER TABLE `user_skills`
  ADD CONSTRAINT `user_skills_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

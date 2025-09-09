SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('profile-images', 'profile-images', NULL, '2025-04-07 17:53:08.319054+00', '2025-04-07 17:53:08.319054+00', true, false, 2097152, NULL, NULL, 'STANDARD'),
	('event-images', 'event-images', NULL, '2025-04-07 17:53:08.504403+00', '2025-04-07 17:53:08.504403+00', true, false, 5242880, NULL, NULL, 'STANDARD'),
	('job-attachments', 'job-attachments', NULL, '2025-04-07 17:53:08.597373+00', '2025-04-07 17:53:08.597373+00', true, false, 10485760, NULL, NULL, 'STANDARD'),
	('avatars', 'avatars', NULL, '2025-04-28 11:59:52.920768+00', '2025-04-28 11:59:52.920768+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('message_attachments', 'message_attachments', NULL, '2025-06-18 09:33:31.046938+00', '2025-06-18 09:33:31.046938+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('resumes', 'resumes', NULL, '2025-06-20 05:23:09.991183+00', '2025-06-20 05:23:09.991183+00', true, false, 5242880, NULL, NULL, 'STANDARD'),
	('cover-letters', 'cover-letters', NULL, '2025-06-20 05:23:09.991183+00', '2025-06-20 05:23:09.991183+00', true, false, 5242880, NULL, NULL, 'STANDARD'),
	('feedback_screenshots', 'feedback_screenshots', NULL, '2025-07-03 08:01:02.745384+00', '2025-07-03 08:01:02.745384+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('company-logos', 'company-logos', NULL, '2025-07-24 13:44:50.098349+00', '2025-07-24 13:44:50.098349+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('post_images', 'post_images', NULL, '2025-07-26 16:25:52.62008+00', '2025-07-26 16:25:52.62008+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('csv_files', 'csv_files', NULL, '2025-07-26 17:25:55.289944+00', '2025-07-26 17:25:55.289944+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('images', 'images', NULL, '2025-09-06 06:42:16.82694+00', '2025-09-06 06:42:16.82694+00', false, false, 52428800, '{image/png,image/jpeg}', NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."prefixes" ("bucket_id", "name", "created_at", "updated_at") VALUES
	('company-logos', '1d560107-817a-41cf-8026-4e54e428ce91', '2025-08-26 17:28:53.769955+00', '2025-08-26 17:28:53.769955+00'),
	('resumes', '5371e2d5-0697-46c0-bf5b-aab2e4d88b58', '2025-08-26 17:28:53.769955+00', '2025-08-26 17:28:53.769955+00'),
	('company-logos', '5371e2d5-0697-46c0-bf5b-aab2e4d88b58', '2025-08-26 17:28:53.769955+00', '2025-08-26 17:28:53.769955+00'),
	('resumes', '971d5e60-222f-46f3-acc2-d7e390089326', '2025-08-26 17:28:53.769955+00', '2025-08-26 17:28:53.769955+00'),
	('avatars', 'avatars', '2025-08-26 17:28:53.769955+00', '2025-08-26 17:28:53.769955+00'),
	('avatars', 'avatars/5371e2d5-0697-46c0-bf5b-aab2e4d88b58', '2025-08-26 17:28:53.769955+00', '2025-08-26 17:28:53.769955+00'),
	('message_attachments', 'message_attachments', '2025-08-26 17:28:53.769955+00', '2025-08-26 17:28:53.769955+00'),
	('message_attachments', 'message_attachments/e941e82e-5928-4c42-a073-99daa7d73843', '2025-08-26 17:28:53.769955+00', '2025-08-26 17:28:53.769955+00'),
	('avatars', 'profile-images', '2025-08-26 17:28:53.769955+00', '2025-08-26 17:28:53.769955+00'),
	('avatars', 'profile-pictures', '2025-08-26 17:28:53.769955+00', '2025-08-26 17:28:53.769955+00');


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- PostgreSQL database dump complete
--

RESET ALL;

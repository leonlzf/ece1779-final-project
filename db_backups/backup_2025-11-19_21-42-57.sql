--
-- PostgreSQL database dump
--

\restrict GAb7w5MQ3ZMTmc341qQt2OMBqkyyxF3bo9b6y1qi1IwoULWulFJMirNptYBkCnR

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg13+1)

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.comments (
    id uuid NOT NULL,
    file_id uuid NOT NULL,
    version_no integer NOT NULL,
    parent_id uuid,
    user_id uuid NOT NULL,
    text text NOT NULL,
    anchor jsonb,
    is_resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.comments OWNER TO admin;

--
-- Name: file_permissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.file_permissions (
    file_id uuid NOT NULL,
    user_id uuid NOT NULL,
    can_read boolean DEFAULT true,
    can_write boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    granted_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.file_permissions OWNER TO admin;

--
-- Name: file_versions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.file_versions (
    file_id uuid NOT NULL,
    version_no integer NOT NULL,
    name text NOT NULL,
    size_bytes bigint,
    uploaded_by uuid,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.file_versions OWNER TO admin;

--
-- Name: files; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.files (
    file_id uuid NOT NULL,
    name text NOT NULL,
    latest_version integer DEFAULT 1,
    owner_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    tag text
);


ALTER TABLE public.files OWNER TO admin;

--
-- Name: test; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.test (
    id integer NOT NULL,
    name text
);


ALTER TABLE public.test OWNER TO admin;

--
-- Name: test_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.test_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_id_seq OWNER TO admin;

--
-- Name: test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.test_id_seq OWNED BY public.test.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'OWNER'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['OWNER'::text, 'COLLAB'::text, 'VIEWER'::text])))
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: test id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.test ALTER COLUMN id SET DEFAULT nextval('public.test_id_seq'::regclass);


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.comments (id, file_id, version_no, parent_id, user_id, text, anchor, is_resolved, created_at, updated_at) FROM stdin;
93556cb6-3f68-4925-a0b6-c3b22e42e712	97ced9a3-59e8-4fdf-b07a-29a264a58756	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	lol\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoyNDcwLCJlbmQiOjI1MjEsImV4YWN0Ijoib2R1bGVzL2JjcnlwdC9saWIvYmluZGluZy9uYXBpLXYzL2JjcnlwdF9saWIubm9kZScgIiwicHJlZml4Ijoicm9qZWN0L1JlcG8vZWNlMTc3OS1maW5hbC1wcm9qZWN0L25vZGVfbSIsInN1ZmZpeCI6Iihub3QgYSBtYWNoLW8gZmlsZSlcbmBgYCJ9-->	{"end": 2521, "kind": "text", "exact": "odules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' ", "start": 2470, "prefix": "roject/Repo/ece1779-final-project/node_m", "suffix": "(not a mach-o file)\\n```"}	f	2025-11-19 01:26:25.858+00	2025-11-19 01:26:25.858+00
73644d2c-c9a8-4b2d-9910-f621ac356278	97ced9a3-59e8-4fdf-b07a-29a264a58756	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	plpl\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxMDgzLCJlbmQiOjEyNDgsImV4YWN0IjoiXG4gICAgYXQgT2JqZWN0Lm5vZGVEZXZIb29rIFthcyAubm9kZV0gKC9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL3RzLW5vZGUtZGV2L2xpYi9ob29rLmpzOjYzOjEzKSIsInByZWZpeCI6Im5vZGU6aW50ZXJuYWwvbW9kdWxlcy9janMvbG9hZGVyOjE5MjA6MTgiLCJzdWZmaXgiOiJcbiAgICBhdCBNb2R1bGUubG9hZCAobm9kZTppbnRlcm5hbC9tb2R1bCJ9-->	{"end": 1248, "kind": "text", "exact": "\\n    at Object.nodeDevHook [as .node] (/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/ts-node-dev/lib/hook.js:63:13)", "start": 1083, "prefix": "node:internal/modules/cjs/loader:1920:18", "suffix": "\\n    at Module.load (node:internal/modul"}	f	2025-11-19 01:26:41.13+00	2025-11-19 01:26:41.13+00
c9c8e3d9-72c4-475f-a8fc-bd7a240f965c	3c518c0d-f586-4506-a994-b7a05cbe70e4	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	heoe\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxOTc1LCJlbmQiOjIyMTgsImV4YWN0IjoiL2JpbmRpbmcvbmFwaS12My9iY3J5cHRfbGliLm5vZGUsIDB4MDAwMSk6IHRyaWVkOiAnL1VzZXJzL3ZpZGdydWppYy9Eb2N1bWVudHMvVW9mVC9Db3Vyc2VzL0VDRTE3NzkvUHJvamVjdC9SZXBvL2VjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2xpYi9iaW5kaW5nL25hcGktdjMvYmNyeXB0X2xpYi5ub2RlJyAobm90IGEgbWFjaC1vIGZpbGUpLCAnL1N5c3RlbS9Wb2x1bWVzL1ByZWJvb3QvQ3J5cHRlIiwicHJlZml4IjoiNzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2xpYiIsInN1ZmZpeCI6Inhlcy9PUy9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ28ifQ==-->	{"end": 2218, "kind": "text", "exact": "/binding/napi-v3/bcrypt_lib.node, 0x0001): tried: '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (not a mach-o file), '/System/Volumes/Preboot/Crypte", "start": 1975, "prefix": "79-final-project/node_modules/bcrypt/lib", "suffix": "xes/OS/Users/vidgrujic/Documents/UofT/Co"}	f	2025-11-19 02:01:52.333+00	2025-11-19 02:02:04.647+00
148b3aec-6bad-4428-945b-cfa10311d9d4	f4c3c4c9-961c-44fe-9483-9168d3e4c79c	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	s\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjYsImV4YWN0IjoiVGVzdCAxIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	{"end": 6, "kind": "text", "exact": "Test 1", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 03:29:44.384+00	2025-11-19 03:29:44.384+00
3f96e30a-430e-4e33-87f8-c9cf5f10ce59	9b3ad567-4bda-4d27-b43c-cf6b9a83b89f	1	\N	29c3825f-a664-46b5-8c80-2ca8f8c47679	Hello!\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiRmluYWwgUHJvamVjdCBEZWxpdmVyYWJsZSIsInByZWZpeCI6IiIsInN1ZmZpeCI6IiJ9-->	\N	f	2025-11-12 22:10:17.219+00	2025-11-12 22:10:17.219+00
e0328c8e-d853-4e1c-923c-3f0c59790fe0	9b3ad567-4bda-4d27-b43c-cf6b9a83b89f	1	\N	29c3825f-a664-46b5-8c80-2ca8f8c47679	hi\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiRmluYWwgUHJvamVjdCBEZWxpdmVyYWJsZSIsInByZWZpeCI6IiIsInN1ZmZpeCI6IiJ9-->	\N	f	2025-11-12 22:10:48.1+00	2025-11-12 22:10:48.1+00
af4d0bef-b93a-4e41-9e5e-4dc07e440f97	9b3ad567-4bda-4d27-b43c-cf6b9a83b89f	1	\N	29c3825f-a664-46b5-8c80-2ca8f8c47679	sadasd\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiYWNjb3VudGluZyBmb3IgNTAlIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	\N	f	2025-11-12 22:14:54.653+00	2025-11-12 22:14:54.653+00
7700e846-c3b8-481f-b94e-ad1d62799498	9b3ad567-4bda-4d27-b43c-cf6b9a83b89f	1	\N	29c3825f-a664-46b5-8c80-2ca8f8c47679	hi\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiUHJvamVjdCBQcm9wb3NhbCAoZHVlIE1vbmRheSwgT2N0b2JlciAyMCwgMjAyNSwgMTE6NTkgUE0pIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	\N	f	2025-11-12 22:17:31.638+00	2025-11-12 22:17:31.638+00
8864b688-8012-4359-8a29-74167368b6b1	9b3ad567-4bda-4d27-b43c-cf6b9a83b89f	1	\N	29c3825f-a664-46b5-8c80-2ca8f8c47679	dasdsad\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiJSBvZiB5b3VyIGYiLCJwcmVmaXgiOiIiLCJzdWZmaXgiOiIifQ==-->	\N	f	2025-11-12 23:13:24.021+00	2025-11-12 23:13:24.021+00
c268f8f9-3f52-4c96-9a28-755fcac02fc3	9b3ad567-4bda-4d27-b43c-cf6b9a83b89f	1	\N	29c3825f-a664-46b5-8c80-2ca8f8c47679	sadsdasdasd\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoibXMgb2YgMiB0byA0IHN0dWRlbnRzXG50byBhcHBseSBhbmQgZXhwYW5kIHVwb24gY29uY2VwdHMgZnJvbSBsZWN0dXJlcyBieSBidWlsZGluZyBhbmQgZGVwbG95aW5nIGEgc3RhdGVmdWxcbmNsb3VkLW5hdGl2ZSBhcHBsaWNhdGlvbi4gVGhpcyBwcm9qZWN0IGVtcGhhc2l6ZXMgY2xvdWQgYW5kIGVkZ2UgY29tcHV0aW5nXG50ZWNobm9sb2dpZXMgY292ZXJlZCBpbiBjbGFzcywgaW5jbHVkaW5nIGNvbnRhaW5lcml6YXRpb24sIG9yY2hlc3RyYXRpb24sIHBlcnNpc3RlbnQgc3RvcmFnZSwiLCJwcmVmaXgiOiIiLCJzdWZmaXgiOiIifQ==-->	{"end": 0, "kind": "text", "exact": "ms of 2 to 4 students\\nto apply and expand upon concepts from lectures by building and deploying a stateful\\ncloud-native application. This project emphasizes cloud and edge computing\\ntechnologies covered in class, including containerization, orchestration, persistent storage,", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-12 23:19:43.834+00	2025-11-12 23:19:43.834+00
7f73ade2-183c-4cd6-9eb4-807ae1183295	9b3ad567-4bda-4d27-b43c-cf6b9a83b89f	1	\N	29c3825f-a664-46b5-8c80-2ca8f8c47679	hello!\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiYWNjb3VudGluZyBmb3IgNTAlIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	{"end": 0, "kind": "text", "exact": "accounting for 50%", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-15 19:20:16.396+00	2025-11-15 19:20:16.396+00
221ef77d-a9d4-4488-91ac-b4822a17f4ad	12880eaa-7c04-4d6a-b0b1-ebf49ec41283	1	\N	a5f4de57-bc22-42c0-ad62-3cdd375742fe	hi\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiZm9yIDUwJSBvZiB5b3UiLCJwcmVmaXgiOiIiLCJzdWZmaXgiOiIifQ==-->	{"end": 0, "kind": "text", "exact": "for 50% of you", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-17 19:57:23.823+00	2025-11-17 19:57:23.823+00
3f77880a-e990-415a-bc5c-2ff07af70f27	12880eaa-7c04-4d6a-b0b1-ebf49ec41283	1	\N	a5f4de57-bc22-42c0-ad62-3cdd375742fe	hhhhh\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiLCBvcmNoZXN0cmF0aW9uLCBwZXJzIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	{"end": 0, "kind": "text", "exact": ", orchestration, pers", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-17 19:57:37.372+00	2025-11-17 19:57:37.372+00
40f22c01-e12c-44b8-a8a2-ebe1151fa8a3	64e80e21-c659-455b-827d-4cd9c33c02f7	5	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	hhh\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0Ijo5NDUsImVuZCI6OTY5LCJleGFjdCI6IjE3NzktZmluYWwtcHJvamVjdC9ub2RlXyIsInByZWZpeCI6InRzL1VvZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UiLCJzdWZmaXgiOiJtb2R1bGVzL2JjcnlwdC9saWIvYmluZGluZy9uYXBpLXYzL2JjcnlwIn0=-->	{"end": 969, "kind": "text", "exact": "1779-final-project/node_", "start": 945, "prefix": "ts/UofT/Courses/ECE1779/Project/Repo/ece", "suffix": "modules/bcrypt/lib/binding/napi-v3/bcryp"}	f	2025-11-18 22:40:23.608+00	2025-11-18 22:40:23.608+00
6da7a75d-4399-490e-a425-43d504d8b6f2	f03acb33-e37e-474d-a67c-05ce8580c578	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	aa\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoyMjkzLCJlbmQiOjI1MjEsImV4YWN0IjoiZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2xpYi9iaW5kaW5nL25hcGktdjMvYmNyeXB0X2xpYi5ub2RlJyAobm8gc3VjaCBmaWxlKSwgJy9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL2JjcnlwdC9saWIvYmluZGluZy9uYXBpLXYzL2JjcnlwdF9saWIubm9kZScgIiwicHJlZml4IjoiZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LSIsInN1ZmZpeCI6Iihub3QgYSBtYWNoLW8gZmlsZSlcbmBgYCJ9-->	{"end": 2521, "kind": "text", "exact": "final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (no such file), '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' ", "start": 2293, "prefix": "fT/Courses/ECE1779/Project/Repo/ece1779-", "suffix": "(not a mach-o file)\\n```"}	f	2025-11-19 01:25:48.254+00	2025-11-19 01:25:48.254+00
92a717c5-af8f-4a65-ab29-4e7a34b6279a	5ace37fc-a84a-4313-93c8-8b9d7ab561a7	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	hi\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxOTgyLCJlbmQiOjI0NzYsImV4YWN0IjoiZy9uYXBpLXYzL2JjcnlwdF9saWIubm9kZSwgMHgwMDAxKTogdHJpZWQ6ICcvVXNlcnMvdmlkZ3J1amljL0RvY3VtZW50cy9Vb2ZUL0NvdXJzZXMvRUNFMTc3OS9Qcm9qZWN0L1JlcG8vZWNlMTc3OS1maW5hbC1wcm9qZWN0L25vZGVfbW9kdWxlcy9iY3J5cHQvbGliL2JpbmRpbmcvbmFwaS12My9iY3J5cHRfbGliLm5vZGUnIChub3QgYSBtYWNoLW8gZmlsZSksICcvU3lzdGVtL1ZvbHVtZXMvUHJlYm9vdC9DcnlwdGV4ZXMvT1MvVXNlcnMvdmlkZ3J1amljL0RvY3VtZW50cy9Vb2ZUL0NvdXJzZXMvRUNFMTc3OS9Qcm9qZWN0L1JlcG8vZWNlMTc3OS1maW5hbC1wcm9qZWN0L25vZGVfbW9kdWxlcy9iY3J5cHQvbGliL2JpbmRpbmcvbmFwaS12My9iY3J5cHRfbGliLm5vZGUnIChubyBzdWNoIGZpbGUpLCAnL1VzZXJzL3ZpZGdydWppYy9Eb2N1bWVudHMvVW9mVC9Db3Vyc2VzL0VDRTE3NzkvUHJvamVjdC9SZXBvL2VjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMiLCJwcmVmaXgiOiJsLXByb2plY3Qvbm9kZV9tb2R1bGVzL2JjcnlwdC9saWIvYmluZGluIiwic3VmZml4IjoiL2JjcnlwdC9saWIvYmluZGluZy9uYXBpLXYzL2JjcnlwdF9saWIubiJ9-->	{"end": 2476, "kind": "text", "exact": "g/napi-v3/bcrypt_lib.node, 0x0001): tried: '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (not a mach-o file), '/System/Volumes/Preboot/Cryptexes/OS/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (no such file), '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules", "start": 1982, "prefix": "l-project/node_modules/bcrypt/lib/bindin", "suffix": "/bcrypt/lib/binding/napi-v3/bcrypt_lib.n"}	f	2025-11-19 01:22:00.23+00	2025-11-19 01:22:00.23+00
946b4596-3e29-4cbb-a193-a661ef9a74ff	5ace37fc-a84a-4313-93c8-8b9d7ab561a7	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	ll\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxMjI5LCJlbmQiOjEyNDgsImV4YWN0IjoiL2xpYi9ob29rLmpzOjYzOjEzKSIsInByZWZpeCI6IjktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvdHMtbm9kZS1kZXYiLCJzdWZmaXgiOiJcbiAgICBhdCBNb2R1bGUubG9hZCAobm9kZTppbnRlcm5hbC9tb2R1bCJ9-->	{"end": 1248, "kind": "text", "exact": "/lib/hook.js:63:13)", "start": 1229, "prefix": "9-final-project/node_modules/ts-node-dev", "suffix": "\\n    at Module.load (node:internal/modul"}	f	2025-11-19 01:22:16.118+00	2025-11-19 01:22:16.118+00
e2ee1bc2-4780-4046-8584-066ec3b7f1ae	5ace37fc-a84a-4313-93c8-8b9d7ab561a7	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	hello\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxNjIyLCJlbmQiOjE3NjgsImV4YWN0IjoiXG4gICAgYXQgT2JqZWN0Ljxhbm9ueW1vdXM+ICgvVXNlcnMvdmlkZ3J1amljL0RvY3VtZW50cy9Vb2ZUL0NvdXJzZXMvRUNFMTc3OS9Qcm9qZWN0L1JlcG8vZWNlMTc3OS1maW5hbC1wcm9qZWN0L25vZGVfbW9kdWxlcy9iY3J5cHQvYmNyeXB0LmpzOjY6MTYpIiwicHJlZml4IjoiZSAobm9kZTppbnRlcm5hbC9tb2R1bGVzL2hlbHBlcnM6MTUyOjE2KSIsInN1ZmZpeCI6IlxuICAgIGF0IE1vZHVsZS48YW5vbnltb3VzPiAobm9kZTppbnRlcm5hIn0=-->	{"end": 1768, "kind": "text", "exact": "\\n    at Object.<anonymous> (/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/bcrypt.js:6:16)", "start": 1622, "prefix": "e (node:internal/modules/helpers:152:16)", "suffix": "\\n    at Module.<anonymous> (node:interna"}	f	2025-11-19 01:22:31.904+00	2025-11-19 01:22:31.904+00
317e75aa-bd25-4c8a-b700-a412ae398960	5ace37fc-a84a-4313-93c8-8b9d7ab561a7	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	dd\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxMjIzLCJlbmQiOjEyNDgsImV4YWN0IjoiZGUtZGV2L2xpYi9ob29rLmpzOjYzOjEzKSIsInByZWZpeCI6ImVjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvdHMtbm8iLCJzdWZmaXgiOiJcbiAgICBhdCBNb2R1bGUubG9hZCAobm9kZTppbnRlcm5hbC9tb2R1bCJ9-->	{"end": 1248, "kind": "text", "exact": "de-dev/lib/hook.js:63:13)", "start": 1223, "prefix": "ece1779-final-project/node_modules/ts-no", "suffix": "\\n    at Module.load (node:internal/modul"}	f	2025-11-19 01:22:43.622+00	2025-11-19 01:22:43.622+00
53db4e0c-a737-4bef-a472-3d19d19130b5	5ace37fc-a84a-4313-93c8-8b9d7ab561a7	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	hello\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxMDgzLCJlbmQiOjEyNDgsImV4YWN0IjoiXG4gICAgYXQgT2JqZWN0Lm5vZGVEZXZIb29rIFthcyAubm9kZV0gKC9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL3RzLW5vZGUtZGV2L2xpYi9ob29rLmpzOjYzOjEzKSIsInByZWZpeCI6Im5vZGU6aW50ZXJuYWwvbW9kdWxlcy9janMvbG9hZGVyOjE5MjA6MTgiLCJzdWZmaXgiOiJcbiAgICBhdCBNb2R1bGUubG9hZCAobm9kZTppbnRlcm5hbC9tb2R1bCJ9-->	{"end": 1248, "kind": "text", "exact": "\\n    at Object.nodeDevHook [as .node] (/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/ts-node-dev/lib/hook.js:63:13)", "start": 1083, "prefix": "node:internal/modules/cjs/loader:1920:18", "suffix": "\\n    at Module.load (node:internal/modul"}	f	2025-11-19 01:23:01.389+00	2025-11-19 01:23:01.389+00
94ee4180-2334-495f-8310-0ba49607b0b3	16097ecf-b809-4f07-ad40-84e101734817	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	joke\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxMDM1LCJlbmQiOjEzMTAsImV4YWN0IjoiXG4gICAgYXQgbm9kZTppbnRlcm5hbC9tb2R1bGVzL2Nqcy9sb2FkZXI6MTkyMDoxOFxuICAgIGF0IE9iamVjdC5ub2RlRGV2SG9vayBbYXMgLm5vZGVdICgvVXNlcnMvdmlkZ3J1amljL0RvY3VtZW50cy9Vb2ZUL0NvdXJzZXMvRUNFMTc3OS9Qcm9qZWN0L1JlcG8vZWNlMTc3OS1maW5hbC1wcm9qZWN0L25vZGVfbW9kdWxlcy90cy1ub2RlLWRldi9saWIvaG9vay5qczo2MzoxMylcbiAgICBhdCBNb2R1bGUubG9hZCAobm9kZTppbnRlcm5hbC9tb2R1bGVzL2Nqcy9sb2FkZXI6MTQ4MTozMikiLCJwcmVmaXgiOiItdjMvYmNyeXB0X2xpYi5ub2RlJyAobm90IGEgbWFjaC1vIGZpbGUpIiwic3VmZml4IjoiXG4gICAgYXQgTW9kdWxlLl9sb2FkIChub2RlOmludGVybmFsL21vZHUifQ==-->	{"end": 1310, "kind": "text", "exact": "\\n    at node:internal/modules/cjs/loader:1920:18\\n    at Object.nodeDevHook [as .node] (/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/ts-node-dev/lib/hook.js:63:13)\\n    at Module.load (node:internal/modules/cjs/loader:1481:32)", "start": 1035, "prefix": "-v3/bcrypt_lib.node' (not a mach-o file)", "suffix": "\\n    at Module._load (node:internal/modu"}	f	2025-11-19 01:23:16.059+00	2025-11-19 01:23:16.059+00
08574c1c-7189-4eff-ac12-bd12ed5234f9	16097ecf-b809-4f07-ad40-84e101734817	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	lol\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxNTY4LCJlbmQiOjE3NjgsImV4YWN0IjoiXG4gICAgYXQgcmVxdWlyZSAobm9kZTppbnRlcm5hbC9tb2R1bGVzL2hlbHBlcnM6MTUyOjE2KVxuICAgIGF0IE9iamVjdC48YW5vbnltb3VzPiAoL1VzZXJzL3ZpZGdydWppYy9Eb2N1bWVudHMvVW9mVC9Db3Vyc2VzL0VDRTE3NzkvUHJvamVjdC9SZXBvL2VjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2JjcnlwdC5qczo2OjE2KSIsInByZWZpeCI6Im9kZTppbnRlcm5hbC9tb2R1bGVzL2Nqcy9sb2FkZXI6MTUwNDoxMikiLCJzdWZmaXgiOiJcbiAgICBhdCBNb2R1bGUuPGFub255bW91cz4gKG5vZGU6aW50ZXJuYSJ9-->	{"end": 1768, "kind": "text", "exact": "\\n    at require (node:internal/modules/helpers:152:16)\\n    at Object.<anonymous> (/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/bcrypt.js:6:16)", "start": 1568, "prefix": "ode:internal/modules/cjs/loader:1504:12)", "suffix": "\\n    at Module.<anonymous> (node:interna"}	f	2025-11-19 01:23:45.37+00	2025-11-19 01:23:45.37+00
e3ca5cc4-eef2-4342-9938-fd920b5b4529	16097ecf-b809-4f07-ad40-84e101734817	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	lol\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxMDgzLCJlbmQiOjEyNDYsImV4YWN0IjoiXG4gICAgYXQgT2JqZWN0Lm5vZGVEZXZIb29rIFthcyAubm9kZV0gKC9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL3RzLW5vZGUtZGV2L2xpYi9ob29rLmpzOjYzOjEiLCJwcmVmaXgiOiJub2RlOmludGVybmFsL21vZHVsZXMvY2pzL2xvYWRlcjoxOTIwOjE4Iiwic3VmZml4IjoiMylcbiAgICBhdCBNb2R1bGUubG9hZCAobm9kZTppbnRlcm5hbC9tb2QifQ==-->	{"end": 1246, "kind": "text", "exact": "\\n    at Object.nodeDevHook [as .node] (/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/ts-node-dev/lib/hook.js:63:1", "start": 1083, "prefix": "node:internal/modules/cjs/loader:1920:18", "suffix": "3)\\n    at Module.load (node:internal/mod"}	f	2025-11-19 01:24:18.911+00	2025-11-19 01:24:18.911+00
9a790a1a-a4ab-4cde-86e0-68bd26855fee	f4c3c4c9-961c-44fe-9483-9168d3e4c79c	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	s\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0Ijo0LCJlbmQiOjYsImV4YWN0IjoiIDEiLCJwcmVmaXgiOiJUZXN0Iiwic3VmZml4IjoiIn0=-->	{"end": 6, "kind": "text", "exact": " 1", "start": 4, "prefix": "Test", "suffix": ""}	f	2025-11-19 03:29:52.561+00	2025-11-19 03:29:52.561+00
8d5d02d8-9001-461f-bd4e-ed5cbac18a44	97ced9a3-59e8-4fdf-b07a-29a264a58756	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	hi\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxODM3LCJlbmQiOjI1NDAsImV4YWN0IjoiXG5bRVJST1JdIDE1OjA1OjM1IEVycm9yOiBkbG9wZW4oL1VzZXJzL3ZpZGdydWppYy9Eb2N1bWVudHMvVW9mVC9Db3Vyc2VzL0VDRTE3NzkvUHJvamVjdC9SZXBvL2VjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2xpYi9iaW5kaW5nL25hcGktdjMvYmNyeXB0X2xpYi5ub2RlLCAweDAwMDEpOiB0cmllZDogJy9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL2JjcnlwdC9saWIvYmluZGluZy9uYXBpLXYzL2JjcnlwdF9saWIubm9kZScgKG5vdCBhIG1hY2gtbyBmaWxlKSwgJy9TeXN0ZW0vVm9sdW1lcy9QcmVib290L0NyeXB0ZXhlcy9PUy9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL2JjcnlwdC9saWIvYmluZGluZy9uYXBpLXYzL2JjcnlwdF9saWIubm9kZScgKG5vIHN1Y2ggZmlsZSksICcvVXNlcnMvdmlkZ3J1amljL0RvY3VtZW50cy9Vb2ZUL0NvdXJzZXMvRUNFMTc3OS9Qcm9qZWN0L1JlcG8vZWNlMTc3OS1maW5hbC1wcm9qZWN0L25vZGVfbW9kdWxlcy9iY3J5cHQvbGliL2JpbmRpbmcvbmFwaS12My9iY3J5cHRfbGliLm5vZGUnIChub3QgYSBtYWNoLW8gZmlsZSkiLCJwcmVmaXgiOiJvZGU6aW50ZXJuYWwvbW9kdWxlcy9janMvbG9hZGVyOjE3NjE6MTQpIiwic3VmZml4IjoiXG5gYGAifQ==-->	{"end": 2540, "kind": "text", "exact": "\\n[ERROR] 15:05:35 Error: dlopen(/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node, 0x0001): tried: '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (not a mach-o file), '/System/Volumes/Preboot/Cryptexes/OS/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (no such file), '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (not a mach-o file)", "start": 1837, "prefix": "ode:internal/modules/cjs/loader:1761:14)", "suffix": "\\n```"}	f	2025-11-19 01:27:33.401+00	2025-11-19 01:27:33.401+00
aea46283-6c85-483a-8065-cb376c849667	ec338d1e-6653-47a9-a582-ebebcb9d5657	4	\N	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	unbelievable\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjEwLCJleGFjdCI6IlRlc3QgMSB2MlxuIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	{"end": 10, "kind": "text", "exact": "Test 1 v2\\n", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 01:27:45.949+00	2025-11-19 01:27:45.949+00
75a3036b-6510-4950-a9b4-058f8d33fe82	3bab31b4-972b-4b66-88e9-f7dff8d72349	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	ssssssss\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoyNDUwLCJlbmQiOjI0NzEsImV4YWN0IjoiZmluYWwtcHJvamVjdC9ub2RlX21vIiwicHJlZml4IjoiZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LSIsInN1ZmZpeCI6ImR1bGVzL2JjcnlwdC9saWIvYmluZGluZy9uYXBpLXYzL2JjcnlwdF8ifQ==-->	{"end": 2471, "kind": "text", "exact": "final-project/node_mo", "start": 2450, "prefix": "fT/Courses/ECE1779/Project/Repo/ece1779-", "suffix": "dules/bcrypt/lib/binding/napi-v3/bcrypt_"}	f	2025-11-19 02:31:29.11+00	2025-11-19 02:31:29.11+00
c4a42f7a-ae12-4e39-bded-13f7f53c9679	ec338d1e-6653-47a9-a582-ebebcb9d5657	4	\N	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	okoeoewq\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjEwLCJleGFjdCI6IlRlc3QgMSB2MlxuIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	{"end": 10, "kind": "text", "exact": "Test 1 v2\\n", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 01:27:39.637+00	2025-11-19 01:27:52.364+00
6d099960-70f3-44c5-899c-b6ac28c7a7f6	97ced9a3-59e8-4fdf-b07a-29a264a58756	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	dd\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0Ijo5MjgsImVuZCI6MTEyMSwiZXhhY3QiOiJlY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL2JjcnlwdC9saWIvYmluZGluZy9uYXBpLXYzL2JjcnlwdF9saWIubm9kZScgKG5vdCBhIG1hY2gtbyBmaWxlKVxuICAgIGF0IG5vZGU6aW50ZXJuYWwvbW9kdWxlcy9janMvbG9hZGVyOjE5MjA6MThcbiAgICBhdCBPYmplY3Qubm9kZURldkhvb2sgW2FzIC5ub2RlXSAiLCJwcmVmaXgiOiJ1amljL0RvY3VtZW50cy9Vb2ZUL0NvdXJzZXMvRUNFMTc3OS9Qcm9qIiwic3VmZml4IjoiKC9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ291cnNlcyJ9-->	{"end": 1121, "kind": "text", "exact": "ect/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (not a mach-o file)\\n    at node:internal/modules/cjs/loader:1920:18\\n    at Object.nodeDevHook [as .node] ", "start": 928, "prefix": "ujic/Documents/UofT/Courses/ECE1779/Proj", "suffix": "(/Users/vidgrujic/Documents/UofT/Courses"}	f	2025-11-19 01:27:59.605+00	2025-11-19 01:27:59.605+00
c47cd4cd-d25d-433f-89d7-55ab459539bc	97ced9a3-59e8-4fdf-b07a-29a264a58756	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	klasdnfklsdf\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxNTUwLCJlbmQiOjI1NDAsImV4YWN0IjoianMvbG9hZGVyOjE1MDQ6MTIpXG4gICAgYXQgcmVxdWlyZSAobm9kZTppbnRlcm5hbC9tb2R1bGVzL2hlbHBlcnM6MTUyOjE2KVxuICAgIGF0IE9iamVjdC48YW5vbnltb3VzPiAoL1VzZXJzL3ZpZGdydWppYy9Eb2N1bWVudHMvVW9mVC9Db3Vyc2VzL0VDRTE3NzkvUHJvamVjdC9SZXBvL2VjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2JjcnlwdC5qczo2OjE2KVxuICAgIGF0IE1vZHVsZS48YW5vbnltb3VzPiAobm9kZTppbnRlcm5hbC9tb2R1bGVzL2Nqcy9sb2FkZXI6MTc2MToxNClcbltFUlJPUl0gMTU6MDU6MzUgRXJyb3I6IGRsb3BlbigvVXNlcnMvdmlkZ3J1amljL0RvY3VtZW50cy9Vb2ZUL0NvdXJzZXMvRUNFMTc3OS9Qcm9qZWN0L1JlcG8vZWNlMTc3OS1maW5hbC1wcm9qZWN0L25vZGVfbW9kdWxlcy9iY3J5cHQvbGliL2JpbmRpbmcvbmFwaS12My9iY3J5cHRfbGliLm5vZGUsIDB4MDAwMSk6IHRyaWVkOiAnL1VzZXJzL3ZpZGdydWppYy9Eb2N1bWVudHMvVW9mVC9Db3Vyc2VzL0VDRTE3NzkvUHJvamVjdC9SZXBvL2VjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2xpYi9iaW5kaW5nL25hcGktdjMvYmNyeXB0X2xpYi5ub2RlJyAobm90IGEgbWFjaC1vIGZpbGUpLCAnL1N5c3RlbS9Wb2x1bWVzL1ByZWJvb3QvQ3J5cHRleGVzL09TL1VzZXJzL3ZpZGdydWppYy9Eb2N1bWVudHMvVW9mVC9Db3Vyc2VzL0VDRTE3NzkvUHJvamVjdC9SZXBvL2VjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2xpYi9iaW5kaW5nL25hcGktdjMvYmNyeXB0X2xpYi5ub2RlJyAobm8gc3VjaCBmaWxlKSwgJy9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL2JjcnlwdC9saWIvYmluZGluZy9uYXBpLXYzL2JjcnlwdF9saWIubm9kZScgKG5vdCBhIG1hY2gtbyBmaWxlKSIsInByZWZpeCI6IiBNb2R1bGUucmVxdWlyZSAobm9kZTppbnRlcm5hbC9tb2R1bGVzL2MiLCJzdWZmaXgiOiJcbmBgYCJ9-->	{"end": 2540, "kind": "text", "exact": "js/loader:1504:12)\\n    at require (node:internal/modules/helpers:152:16)\\n    at Object.<anonymous> (/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/bcrypt.js:6:16)\\n    at Module.<anonymous> (node:internal/modules/cjs/loader:1761:14)\\n[ERROR] 15:05:35 Error: dlopen(/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node, 0x0001): tried: '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (not a mach-o file), '/System/Volumes/Preboot/Cryptexes/OS/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (no such file), '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (not a mach-o file)", "start": 1550, "prefix": " Module.require (node:internal/modules/c", "suffix": "\\n```"}	f	2025-11-19 01:29:18.355+00	2025-11-19 01:29:18.355+00
3c7ff2c7-4f65-4705-aed7-5b1f0cd52c77	ec338d1e-6653-47a9-a582-ebebcb9d5657	1	\N	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	test\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjYsImV4YWN0IjoiVGVzdCAxIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	{"end": 6, "kind": "text", "exact": "Test 1", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 01:29:57.756+00	2025-11-19 01:30:01.701+00
8516c272-6508-483c-9d0c-d1f6a8f20379	ec338d1e-6653-47a9-a582-ebebcb9d5657	4	\N	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	comment\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjksImV4YWN0IjoiVGVzdCAxIHYyIiwicHJlZml4IjoiIiwic3VmZml4IjoiXG4ifQ==-->	{"end": 9, "kind": "text", "exact": "Test 1 v2", "start": 0, "prefix": "", "suffix": "\\n"}	f	2025-11-19 01:30:38.461+00	2025-11-19 01:30:38.461+00
ca9f3885-e284-4ee3-8ab0-98bb37aecc88	ec338d1e-6653-47a9-a582-ebebcb9d5657	4	\N	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	oops\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjEwLCJleGFjdCI6IlRlc3QgMSB2MlxuIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	{"end": 10, "kind": "text", "exact": "Test 1 v2\\n", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 01:30:56.334+00	2025-11-19 01:30:56.334+00
320f074e-ff40-4ae9-9770-210e50cbea6a	3bab31b4-972b-4b66-88e9-f7dff8d72349	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	ss\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxNDE5LCJlbmQiOjE1NjgsImV4YWN0IjoidGljc19jaGFubmVsOjMyODoxNClcbiAgICBhdCB3cmFwTW9kdWxlTG9hZCAobm9kZTppbnRlcm5hbC9tb2R1bGVzL2Nqcy9sb2FkZXI6MjQ1OjI0KVxuICAgIGF0IE1vZHVsZS5yZXF1aXJlIChub2RlOmludGVybmFsL21vZHVsZXMvY2pzL2xvYWRlcjoxNTA0OjEyKSIsInByZWZpeCI6InQgVHJhY2luZ0NoYW5uZWwudHJhY2VTeW5jIChub2RlOmRpYWdub3MiLCJzdWZmaXgiOiJcbiAgICBhdCByZXF1aXJlIChub2RlOmludGVybmFsL21vZHVsZXMvaCJ9-->	{"end": 1568, "kind": "text", "exact": "tics_channel:328:14)\\n    at wrapModuleLoad (node:internal/modules/cjs/loader:245:24)\\n    at Module.require (node:internal/modules/cjs/loader:1504:12)", "start": 1419, "prefix": "t TracingChannel.traceSync (node:diagnos", "suffix": "\\n    at require (node:internal/modules/h"}	f	2025-11-19 02:31:16.856+00	2025-11-19 02:31:16.856+00
62f5fc29-4f85-4012-9d46-1b92a076f7d7	7f962da3-67ec-4723-93a7-90350104cfbc	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	hell\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxOTc4LCJlbmQiOjI1NDQsImV4YWN0IjoibmRpbmcvbmFwaS12My9iY3J5cHRfbGliLm5vZGUsIDB4MDAwMSk6IHRyaWVkOiAnL1VzZXJzL3ZpZGdydWppYy9Eb2N1bWVudHMvVW9mVC9Db3Vyc2VzL0VDRTE3NzkvUHJvamVjdC9SZXBvL2VjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2xpYi9iaW5kaW5nL25hcGktdjMvYmNyeXB0X2xpYi5ub2RlJyAobm90IGEgbWFjaC1vIGZpbGUpLCAnL1N5c3RlbS9Wb2x1bWVzL1ByZWJvb3QvQ3J5cHRleGVzL09TL1VzZXJzL3ZpZGdydWppYy9Eb2N1bWVudHMvVW9mVC9Db3Vyc2VzL0VDRTE3NzkvUHJvamVjdC9SZXBvL2VjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2xpYi9iaW5kaW5nL25hcGktdjMvYmNyeXB0X2xpYi5ub2RlJyAobm8gc3VjaCBmaWxlKSwgJy9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL2JjcnlwdC9saWIvYmluZGluZy9uYXBpLXYzL2JjcnlwdF9saWIubm9kZScgKG5vdCBhIG1hY2gtbyBmaWxlKVxuYGBgIiwicHJlZml4IjoiZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2xpYi9iaSIsInN1ZmZpeCI6IiJ9-->	{"end": 2544, "kind": "text", "exact": "nding/napi-v3/bcrypt_lib.node, 0x0001): tried: '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (not a mach-o file), '/System/Volumes/Preboot/Cryptexes/OS/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (no such file), '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (not a mach-o file)\\n```", "start": 1978, "prefix": "final-project/node_modules/bcrypt/lib/bi", "suffix": ""}	f	2025-11-19 01:31:26.532+00	2025-11-19 01:31:40.81+00
5436303d-177e-4cd5-8947-cfa438c03ff4	7f962da3-67ec-4723-93a7-90350104cfbc	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	lol\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxMTYwLCJlbmQiOjE0MzksImV4YWN0Ijoicy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL3RzLW5vZGUtZGV2L2xpYi9ob29rLmpzOjYzOjEzKVxuICAgIGF0IE1vZHVsZS5sb2FkIChub2RlOmludGVybmFsL21vZHVsZXMvY2pzL2xvYWRlcjoxNDgxOjMyKVxuICAgIGF0IE1vZHVsZS5fbG9hZCAobm9kZTppbnRlcm5hbC9tb2R1bGVzL2Nqcy9sb2FkZXI6MTMwMDoxMilcbiAgICBhdCBUcmFjaW5nQ2hhbm5lbC50cmFjZVN5bmMgKG5vZGU6ZGlhZ25vc3RpY3NfY2hhbm5lbDozMjg6MTQpIiwicHJlZml4IjoiICgvVXNlcnMvdmlkZ3J1amljL0RvY3VtZW50cy9Vb2ZUL0NvdXJzZSIsInN1ZmZpeCI6IlxuICAgIGF0IHdyYXBNb2R1bGVMb2FkIChub2RlOmludGVybmFsL21vIn0=-->	{"end": 1439, "kind": "text", "exact": "s/ECE1779/Project/Repo/ece1779-final-project/node_modules/ts-node-dev/lib/hook.js:63:13)\\n    at Module.load (node:internal/modules/cjs/loader:1481:32)\\n    at Module._load (node:internal/modules/cjs/loader:1300:12)\\n    at TracingChannel.traceSync (node:diagnostics_channel:328:14)", "start": 1160, "prefix": " (/Users/vidgrujic/Documents/UofT/Course", "suffix": "\\n    at wrapModuleLoad (node:internal/mo"}	f	2025-11-19 01:31:55.954+00	2025-11-19 01:31:55.954+00
cb7ff47c-0fe1-43c8-b31a-bade9a36b6f6	85db5920-f827-4aea-90e9-216c02ef5b8d	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	lol\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxNzY4LCJlbmQiOjE4NjIsImV4YWN0IjoiXG4gICAgYXQgTW9kdWxlLjxhbm9ueW1vdXM+IChub2RlOmludGVybmFsL21vZHVsZXMvY2pzL2xvYWRlcjoxNzYxOjE0KVxuW0VSUk9SXSAxNTowNTozNSBFcnJvcjogIiwicHJlZml4IjoiamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2JjcnlwdC5qczo2OjE2KSIsInN1ZmZpeCI6ImRsb3BlbigvVXNlcnMvdmlkZ3J1amljL0RvY3VtZW50cy9Vb2ZUL0MifQ==-->	{"end": 1862, "kind": "text", "exact": "\\n    at Module.<anonymous> (node:internal/modules/cjs/loader:1761:14)\\n[ERROR] 15:05:35 Error: ", "start": 1768, "prefix": "ject/node_modules/bcrypt/bcrypt.js:6:16)", "suffix": "dlopen(/Users/vidgrujic/Documents/UofT/C"}	f	2025-11-19 01:33:52.613+00	2025-11-19 01:33:52.613+00
f796ffc5-84e3-4f68-8754-793623dbdb0e	85db5920-f827-4aea-90e9-216c02ef5b8d	2	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	plplpl\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoxMjI0LCJlbmQiOjEyNDgsImV4YWN0IjoiZS1kZXYvbGliL2hvb2suanM6NjM6MTMpIiwicHJlZml4IjoiY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL3RzLW5vZCIsInN1ZmZpeCI6IlxuICAgIGF0IE1vZHVsZS5sb2FkIChub2RlOmludGVybmFsL21vZHVsIn0=-->	{"end": 1248, "kind": "text", "exact": "e-dev/lib/hook.js:63:13)", "start": 1224, "prefix": "ce1779-final-project/node_modules/ts-nod", "suffix": "\\n    at Module.load (node:internal/modul"}	f	2025-11-19 01:35:26.238+00	2025-11-19 01:35:26.238+00
14b83e43-59d0-4a38-a4a6-656bbe1cf106	85db5920-f827-4aea-90e9-216c02ef5b8d	2	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	crash\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0Ijo3MjAsImVuZCI6OTczLCJleGFjdCI6IlVzZXJzL3ZpZGdydWppYy9Eb2N1bWVudHMvVW9mVC9Db3Vyc2VzL0VDRTE3NzkvUHJvamVjdC9SZXBvL2VjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2xpYi9iaW5kaW5nL25hcGktdjMvYmNyeXB0X2xpYi5ub2RlJyAobm8gc3VjaCBmaWxlKSwgJy9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL2IiLCJwcmVmaXgiOiIsICcvU3lzdGVtL1ZvbHVtZXMvUHJlYm9vdC9DcnlwdGV4ZXMvT1MvIiwic3VmZml4IjoiY3J5cHQvbGliL2JpbmRpbmcvbmFwaS12My9iY3J5cHRfbGliLm5vZCJ9-->	{"end": 973, "kind": "text", "exact": "Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (no such file), '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/b", "start": 720, "prefix": ", '/System/Volumes/Preboot/Cryptexes/OS/", "suffix": "crypt/lib/binding/napi-v3/bcrypt_lib.nod"}	f	2025-11-19 01:36:03.947+00	2025-11-19 01:36:03.947+00
ba3c6d6b-679b-4d9a-9e7e-29425dade88e	c8c64c29-9ba7-423a-9c07-df0fa94ae3b5	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	ho\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoibnQ6IChpKSBkYXRhIGNsZWFuaW5nIGFuZCBlbmNvZGluZywgKGlpKSBleHBsb3JhdG9yeSBkYXRhIGFuYWx5c2lzIGFuZFxyXG5mZWF0dXJlIHNlbGVjdGlvbiwgKGlpaSkgaW1wbGVtZW50YXRpb24gb2YgYW4gb3JkaW5hbCBsb2dpc3RpYyByZWdyZXNzaW9uIG1vIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	{"end": 0, "kind": "text", "exact": "nt: (i) data cleaning and encoding, (ii) exploratory data analysis and\\r\\nfeature selection, (iii) implementation of an ordinal logistic regression mo", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 01:37:01.543+00	2025-11-19 01:37:01.543+00
48eb1aaf-8b94-4aef-8e8f-00003388d341	c8c64c29-9ba7-423a-9c07-df0fa94ae3b5	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	ss\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoicHV0YXRpb24sIGFsbCBzaW5nbGUtbGFiZWwgY2F0ZWdvcmljYWwgdmFyaWFibGVzIHdlcmVcclxuY29udmVydGVkIHRvIG51bWVyaWNhbCBmb3JtIHVzaW5nIG9uZS1ob3QgZW5jb2RpbmcuIE9uZS1ob3QgZW5jb2RpIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	{"end": 0, "kind": "text", "exact": "putation, all single-label categorical variables were\\r\\nconverted to numerical form using one-hot encoding. One-hot encodi", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 01:37:20.888+00	2025-11-19 01:37:20.888+00
6b051bd7-8f6a-4536-9fe9-2d6e1533c938	b338d05d-7cb8-4cec-8abe-80d67eae7c4b	1	\N	5c10d854-cac4-4ba2-ac11-7805035e5cce	barbara	\N	f	2025-11-19 01:38:42.622+00	2025-11-19 01:38:42.622+00
dad70176-7b4d-449c-ae49-3ff5b31457d1	a50372cc-53ae-441f-a8f7-29a407b7581c	1	\N	a5f4de57-bc22-42c0-ad62-3cdd375742fe	hhh\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiZmlsZSIsInByZWZpeCI6IiIsInN1ZmZpeCI6IiJ9-->	{"end": 0, "kind": "text", "exact": "file", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 02:12:11.728+00	2025-11-19 02:12:11.728+00
bd5f93e7-223c-4af6-b9fa-d5d59adb864d	a50372cc-53ae-441f-a8f7-29a407b7581c	1	\N	a5f4de57-bc22-42c0-ad62-3cdd375742fe	sdad\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiVGhpcyIsInByZWZpeCI6IiIsInN1ZmZpeCI6IiJ9-->	{"end": 0, "kind": "text", "exact": "This", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 02:12:18.968+00	2025-11-19 02:12:18.968+00
d4dd8140-0e99-42ed-9ec7-14c157042a3b	c33d0841-aef5-4699-bb83-431130defba1	1	\N	a5f4de57-bc22-42c0-ad62-3cdd375742fe	hhhh\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoidCBmaWxlIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	{"end": 0, "kind": "text", "exact": "t file", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 02:13:29.456+00	2025-11-19 02:13:29.456+00
13fb9b21-d99f-48ad-84fe-d02865327606	c33d0841-aef5-4699-bb83-431130defba1	1	\N	a5f4de57-bc22-42c0-ad62-3cdd375742fe	hghg\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiVGhpcyIsInByZWZpeCI6IiIsInN1ZmZpeCI6IiJ9-->	{"end": 0, "kind": "text", "exact": "This", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 02:13:41.611+00	2025-11-19 02:13:41.611+00
29c4e252-4052-4ed4-aab9-0f4b01264c35	14d814af-dec6-41a6-ba4c-767c4b030c76	1	\N	29c3825f-a664-46b5-8c80-2ca8f8c47679	dsadasd\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiZXJpemF0aW9uLCBvcmNoZXN0ciIsInByZWZpeCI6IiIsInN1ZmZpeCI6IiJ9-->	{"end": 0, "kind": "text", "exact": "erization, orchestr", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 18:15:26.176+00	2025-11-19 18:15:26.176+00
356bebd7-41ef-4b99-bcdd-627c9296e1bd	14d814af-dec6-41a6-ba4c-767c4b030c76	1	\N	29c3825f-a664-46b5-8c80-2ca8f8c47679	zzzz\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0Ijoib25kYXksIERlY2VtYiIsInByZWZpeCI6IiIsInN1ZmZpeCI6IiJ9-->	{"end": 0, "kind": "text", "exact": "onday, Decemb", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 18:18:23.857+00	2025-11-19 18:18:23.857+00
5ed1c94b-052b-414c-8086-9370ccfa337d	14d814af-dec6-41a6-ba4c-767c4b030c76	1	\N	29c3825f-a664-46b5-8c80-2ca8f8c47679	bhbh\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoiZGVsaXZlcmVkXG5hcyBhIFJFQURNRS5tZCBmaWxlIGluIHlvdXIgR2l0IHJlcG9zaXRvcnkuXG5WaWRlbyBEZW1vOiBBIHZpZGVvIGRlbW9uc3RyYXRpb24gb2YgeW91ciBwcm9qZWN0LCBsYXN0aW5nIGJldHdlZW4gMSBhbmQgNVxubWludXRlcy4gVGhlIGRlbW8gc2hvdWxkIGhpZ2hsaWdodCB0aGUga2V5IGZlYXR1cmVzIGFuZCBmdW5jdGlvbmFsaXR5IG9mIHlvdXJcbmFwcGxpY2F0aW9uLiBJbmNsdWRlIHRoZSB2aWRlbyBVUkwgaW4gdGhlICMjIFZpZGVvIERlbW8gc2VjdGlvbiBvZiB5b3VyIGZpbmFsIHJlcG9ydFxuKHRoZSBSRUFETUUubWQgZmlsZSkuIiwicHJlZml4IjoiIiwic3VmZml4IjoiIn0=-->	{"end": 0, "kind": "text", "exact": "delivered\\nas a README.md file in your Git repository.\\nVideo Demo: A video demonstration of your project, lasting between 1 and 5\\nminutes. The demo should highlight the key features and functionality of your\\napplication. Include the video URL in the ## Video Demo section of your final report\\n(the README.md file).", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 18:18:33.792+00	2025-11-19 18:18:33.792+00
f0ccb4d9-b7f1-48b2-9f3d-d316db82ad50	14d814af-dec6-41a6-ba4c-767c4b030c76	1	\N	29c3825f-a664-46b5-8c80-2ca8f8c47679	hibbbb\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjowLCJlbmQiOjAsImV4YWN0IjoidCBvZiB0aGlzIGNvdXJzZSwgYWNjb3UiLCJwcmVmaXgiOiIiLCJzdWZmaXgiOiIifQ==-->	{"end": 0, "kind": "text", "exact": "t of this course, accou", "start": 0, "prefix": "", "suffix": ""}	f	2025-11-19 18:15:18.926+00	2025-11-19 18:18:45.722+00
5e8194ea-d5e2-4737-88ab-77e56108f0aa	712d94c4-4deb-41a2-9ef2-8a4b9525cae2	1	\N	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	h\n\n<!--ANCHOR:eyJraW5kIjoidGV4dCIsInN0YXJ0IjoyMTY0LCJlbmQiOjI1NDAsImV4YWN0IjoiJyAobm90IGEgbWFjaC1vIGZpbGUpLCAnL1N5c3RlbS9Wb2x1bWVzL1ByZWJvb3QvQ3J5cHRleGVzL09TL1VzZXJzL3ZpZGdydWppYy9Eb2N1bWVudHMvVW9mVC9Db3Vyc2VzL0VDRTE3NzkvUHJvamVjdC9SZXBvL2VjZTE3NzktZmluYWwtcHJvamVjdC9ub2RlX21vZHVsZXMvYmNyeXB0L2xpYi9iaW5kaW5nL25hcGktdjMvYmNyeXB0X2xpYi5ub2RlJyAobm8gc3VjaCBmaWxlKSwgJy9Vc2Vycy92aWRncnVqaWMvRG9jdW1lbnRzL1VvZlQvQ291cnNlcy9FQ0UxNzc5L1Byb2plY3QvUmVwby9lY2UxNzc5LWZpbmFsLXByb2plY3Qvbm9kZV9tb2R1bGVzL2JjcnlwdC9saWIvYmluZGluZy9uYXBpLXYzL2JjcnlwdF9saWIubm9kZScgKG5vdCBhIG1hY2gtbyBmaWxlKSIsInByZWZpeCI6InJ5cHQvbGliL2JpbmRpbmcvbmFwaS12My9iY3J5cHRfbGliLm5vZGUiLCJzdWZmaXgiOiJcbmBgYCJ9-->	{"end": 2540, "kind": "text", "exact": "' (not a mach-o file), '/System/Volumes/Preboot/Cryptexes/OS/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (no such file), '/Users/vidgrujic/Documents/UofT/Courses/ECE1779/Project/Repo/ece1779-final-project/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' (not a mach-o file)", "start": 2164, "prefix": "rypt/lib/binding/napi-v3/bcrypt_lib.node", "suffix": "\\n```"}	f	2025-11-19 21:17:25.573+00	2025-11-19 21:17:25.573+00
\.


--
-- Data for Name: file_permissions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.file_permissions (file_id, user_id, can_read, can_write, can_delete, granted_at) FROM stdin;
287890dc-4d5e-409b-a20f-3c0619104d17	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	t	t	t	2025-11-19 02:41:24.382502
873ab459-5a5a-4f59-91a0-af4e851585ba	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	t	t	t	2025-11-19 02:48:25.813888
e1260b97-d586-4f10-a974-07de78a2181b	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	t	t	t	2025-11-19 02:50:52.185092
fbe2915c-4912-4133-9fce-b383fc8fc529	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	t	t	t	2025-11-19 02:58:51.458321
f4c3c4c9-961c-44fe-9483-9168d3e4c79c	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	t	t	t	2025-11-19 03:26:46.79472
f4c3c4c9-961c-44fe-9483-9168d3e4c79c	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	t	f	f	2025-11-19 03:29:36.350507
14d814af-dec6-41a6-ba4c-767c4b030c76	29c3825f-a664-46b5-8c80-2ca8f8c47679	t	t	t	2025-11-19 18:14:24.359513
80de405a-4675-43f6-b4ac-6e509471970a	5c10d854-cac4-4ba2-ac11-7805035e5cce	t	t	t	2025-11-11 06:28:49.109298
c91dd257-9bb2-4586-918d-2dbc7ffdb82a	5c10d854-cac4-4ba2-ac11-7805035e5cce	t	t	t	2025-11-11 06:28:57.823028
6d9effb9-bca4-48ad-80b8-94aef957f70d	5c10d854-cac4-4ba2-ac11-7805035e5cce	t	t	t	2025-11-11 06:29:05.697537
b338d05d-7cb8-4cec-8abe-80d67eae7c4b	a0bbb034-6d79-427f-bc0f-3733dcc964f2	t	t	t	2025-11-11 06:30:46.01162
6d9effb9-bca4-48ad-80b8-94aef957f70d	a0bbb034-6d79-427f-bc0f-3733dcc964f2	t	t	f	2025-11-11 06:43:36.029438
b338d05d-7cb8-4cec-8abe-80d67eae7c4b	5c10d854-cac4-4ba2-ac11-7805035e5cce	t	f	f	2025-11-11 06:46:08.999678
b65dced8-cd45-4dc5-87bf-16ee87d90c08	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	t	t	t	2025-11-19 20:51:18.439757
804dad33-7b9b-463e-bc25-dc3fd3cca8b9	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	t	t	t	2025-11-19 21:04:51.84494
719db122-1777-43ea-be2e-5fd31460dfdf	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	t	t	t	2025-11-19 21:16:39.212039
719db122-1777-43ea-be2e-5fd31460dfdf	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	t	t	f	2025-11-19 21:16:50.083103
712d94c4-4deb-41a2-9ef2-8a4b9525cae2	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	t	t	t	2025-11-19 21:17:19.203296
cb6029fd-2d40-420e-8be2-1b47cef8a458	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	t	t	t	2025-11-19 21:41:59.311118
7eec9715-9217-4f43-ba65-aafd1cdf6be0	b246bb0b-ae40-48c1-afc1-94ade4908e2e	t	t	t	2025-11-17 20:02:33.573916
ec338d1e-6653-47a9-a582-ebebcb9d5657	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	t	t	t	2025-11-18 23:04:19.373709
f8d93f11-7622-4253-83ad-ff35fcf0cf79	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	t	t	t	2025-11-19 01:31:21.940822
a50372cc-53ae-441f-a8f7-29a407b7581c	a5f4de57-bc22-42c0-ad62-3cdd375742fe	t	t	t	2025-11-19 02:11:57.705581
c33d0841-aef5-4699-bb83-431130defba1	a5f4de57-bc22-42c0-ad62-3cdd375742fe	t	t	t	2025-11-19 02:13:16.474319
\.


--
-- Data for Name: file_versions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.file_versions (file_id, version_no, name, size_bytes, uploaded_by, uploaded_at) FROM stdin;
287890dc-4d5e-409b-a20f-3c0619104d17	1	message (6).txt	2548	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 02:41:24.379597
873ab459-5a5a-4f59-91a0-af4e851585ba	1	digits.png	721129	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 02:48:25.811987
e1260b97-d586-4f10-a974-07de78a2181b	1	message (6).txt	2548	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 02:50:52.183029
fbe2915c-4912-4133-9fce-b383fc8fc529	1	digits.png	721129	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 02:58:51.455651
f4c3c4c9-961c-44fe-9483-9168d3e4c79c	1	test1.txt	6	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-19 03:26:46.793388
14d814af-dec6-41a6-ba4c-767c4b030c76	1	Course Project Guidelines.pdf	503465	29c3825f-a664-46b5-8c80-2ca8f8c47679	2025-11-19 18:14:24.357119
80de405a-4675-43f6-b4ac-6e509471970a	1	integer.txt	5708	5c10d854-cac4-4ba2-ac11-7805035e5cce	2025-11-11 06:28:49.098097
c91dd257-9bb2-4586-918d-2dbc7ffdb82a	1	salary.txt	13262	5c10d854-cac4-4ba2-ac11-7805035e5cce	2025-11-11 06:28:57.816476
6d9effb9-bca4-48ad-80b8-94aef957f70d	1	shakespeare-1.txt	2555806	5c10d854-cac4-4ba2-ac11-7805035e5cce	2025-11-11 06:29:05.6904
b338d05d-7cb8-4cec-8abe-80d67eae7c4b	1	Assignment 2.pdf	152431	a0bbb034-6d79-427f-bc0f-3733dcc964f2	2025-11-11 06:30:46.003741
6d9effb9-bca4-48ad-80b8-94aef957f70d	2	version_2.txt	21	5c10d854-cac4-4ba2-ac11-7805035e5cce	2025-11-11 18:38:57.729472
b65dced8-cd45-4dc5-87bf-16ee87d90c08	1	ChatGPT Image Nov 19, 2025, 11_30_41 AM.png	866184	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 20:51:18.437239
6d9effb9-bca4-48ad-80b8-94aef957f70d	4	rollback_from_v2.txt	21	5c10d854-cac4-4ba2-ac11-7805035e5cce	2025-11-11 18:46:01.418747
b65dced8-cd45-4dc5-87bf-16ee87d90c08	2	ChatGPT Image Nov 19, 2025, 11_30_41 AM.png_v1.txt	1545378	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 20:57:15.972459
804dad33-7b9b-463e-bc25-dc3fd3cca8b9	1	love.gif	311094	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 21:04:51.842854
719db122-1777-43ea-be2e-5fd31460dfdf	1	Screenshot 2025-11-10 at 11.18.00â¯PM-modified.png	30621	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-19 21:16:39.20974
712d94c4-4deb-41a2-9ef2-8a4b9525cae2	1	message (6).txt	2548	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 21:17:19.200795
712d94c4-4deb-41a2-9ef2-8a4b9525cae2	2	message (6).txt_v1.txt	2548	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 21:17:53.42639
712d94c4-4deb-41a2-9ef2-8a4b9525cae2	3	message (6).txt_v1.txt_v2.txt	2548	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 21:18:15.836736
f4c3c4c9-961c-44fe-9483-9168d3e4c79c	2	test1.txt_v1.txt	6	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-19 21:40:44.374318
cb6029fd-2d40-420e-8be2-1b47cef8a458	1	Lecture 7.pdf	465489	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-19 21:41:59.308988
7eec9715-9217-4f43-ba65-aafd1cdf6be0	1	Controllable Text Generation with Residual Memory.pdf	520972	b246bb0b-ae40-48c1-afc1-94ade4908e2e	2025-11-17 20:02:33.571759
ec338d1e-6653-47a9-a582-ebebcb9d5657	1	test1.txt	6	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-18 23:04:19.372438
ec338d1e-6653-47a9-a582-ebebcb9d5657	2	version_2.txt	10	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-18 23:05:03.419655
ec338d1e-6653-47a9-a582-ebebcb9d5657	3	test1.txt_v1.txt	6	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-18 23:05:19.547881
ec338d1e-6653-47a9-a582-ebebcb9d5657	4	version_2.txt_v2.txt	10	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-18 23:05:48.619858
f8d93f11-7622-4253-83ad-ff35fcf0cf79	1	test1.txt	6	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-19 01:31:21.939565
a50372cc-53ae-441f-a8f7-29a407b7581c	1	test.pdf	20650	a5f4de57-bc22-42c0-ad62-3cdd375742fe	2025-11-19 02:11:57.703641
a50372cc-53ae-441f-a8f7-29a407b7581c	2	test.pdf_v1.txt	31863	a5f4de57-bc22-42c0-ad62-3cdd375742fe	2025-11-19 02:12:40.650334
c33d0841-aef5-4699-bb83-431130defba1	1	test.pdf	20650	a5f4de57-bc22-42c0-ad62-3cdd375742fe	2025-11-19 02:13:16.473107
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.files (file_id, name, latest_version, owner_id, created_at, tag) FROM stdin;
287890dc-4d5e-409b-a20f-3c0619104d17	message (6).txt	1	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 02:41:24.375664	\N
7eec9715-9217-4f43-ba65-aafd1cdf6be0	Controllable Text Generation with Residual Memory.pdf	1	b246bb0b-ae40-48c1-afc1-94ade4908e2e	2025-11-17 20:02:33.568684	\N
873ab459-5a5a-4f59-91a0-af4e851585ba	digits.png	1	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 02:48:25.807867	\N
e1260b97-d586-4f10-a974-07de78a2181b	message (6).txt	1	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 02:50:52.179836	\N
fbe2915c-4912-4133-9fce-b383fc8fc529	digits.png	1	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 02:58:51.449988	\N
80de405a-4675-43f6-b4ac-6e509471970a	integer.txt	1	5c10d854-cac4-4ba2-ac11-7805035e5cce	2025-11-11 06:28:49.086093	document
c91dd257-9bb2-4586-918d-2dbc7ffdb82a	salary.txt	1	5c10d854-cac4-4ba2-ac11-7805035e5cce	2025-11-11 06:28:57.810268	document
b338d05d-7cb8-4cec-8abe-80d67eae7c4b	Assignment 2.pdf	1	a0bbb034-6d79-427f-bc0f-3733dcc964f2	2025-11-11 06:30:45.995017	Assignment
14d814af-dec6-41a6-ba4c-767c4b030c76	Course Project Guidelines.pdf	1	29c3825f-a664-46b5-8c80-2ca8f8c47679	2025-11-19 18:14:24.352738	hi
6d9effb9-bca4-48ad-80b8-94aef957f70d	shakespeare-1.txt	4	5c10d854-cac4-4ba2-ac11-7805035e5cce	2025-11-11 06:29:05.683668	document
b65dced8-cd45-4dc5-87bf-16ee87d90c08	ChatGPT Image Nov 19, 2025, 11_30_41 AM.png	2	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 20:51:18.432031	\N
804dad33-7b9b-463e-bc25-dc3fd3cca8b9	love.gif	1	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 21:04:51.839484	\N
719db122-1777-43ea-be2e-5fd31460dfdf	Screenshot 2025-11-10 at 11.18.00â¯PM-modified.png	1	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-19 21:16:39.20589	\N
712d94c4-4deb-41a2-9ef2-8a4b9525cae2	message (6).txt	3	02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	2025-11-19 21:17:19.197615	\N
f4c3c4c9-961c-44fe-9483-9168d3e4c79c	test1.txt	2	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-19 03:26:46.790838	\N
cb6029fd-2d40-420e-8be2-1b47cef8a458	Lecture 7.pdf	1	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-19 21:41:59.304912	\N
ec338d1e-6653-47a9-a582-ebebcb9d5657	test1.txt	4	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-18 23:04:19.369919	test tag
f8d93f11-7622-4253-83ad-ff35fcf0cf79	test1.txt	1	87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	2025-11-19 01:31:21.937525	\N
a50372cc-53ae-441f-a8f7-29a407b7581c	test.pdf	2	a5f4de57-bc22-42c0-ad62-3cdd375742fe	2025-11-19 02:11:57.700876	\N
c33d0841-aef5-4699-bb83-431130defba1	test.pdf	1	a5f4de57-bc22-42c0-ad62-3cdd375742fe	2025-11-19 02:13:16.470904	\N
\.


--
-- Data for Name: test; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.test (id, name) FROM stdin;
1	DigitalOcean is running!
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, email, password_hash, role, created_at) FROM stdin;
5802ec6a-ec8a-48c9-973b-5f27feb1639b	beck@test.com	$2b$10$FqnIQwBWytUJwBvaqBfaNehoUWrHHGphNWWAy9PQ.yCaqS7Q0w0He	OWNER	2025-11-09 21:47:17.248486
5c10d854-cac4-4ba2-ac11-7805035e5cce	barbara	$2b$10$UZfOEaiMihpYHZhLh2XsxO0Xx5vbsicxOQMK/r6mZ0ZLPTLEeIC5G	OWNER	2025-11-09 22:12:12.574616
80e4be56-3ac1-412d-be8a-e9828d5865f9	leonliang@gmail.com	$2b$10$DCBd2HYeTTEkGEUgXUK2l.frQFGSZOt/2BrzHZeYaU9MyaF5ZKYvW	OWNER	2025-11-10 01:39:24.421523
a5f4de57-bc22-42c0-ad62-3cdd375742fe	liangzifeng1007@gmail.com	$2b$10$EPaeGkXjxDOc81dQaovwOeR/WfLMkKzu2J3.S7eHuuovyrl/wao1m	OWNER	2025-11-11 02:39:16.73864
a0bbb034-6d79-427f-bc0f-3733dcc964f2	Beck	$2b$10$2quq6xXvofKVkmnJjnlHk.jvHNn54.ammi5yd2N3yMw5DH2wE69Z2	OWNER	2025-11-11 06:29:53.455037
29c3825f-a664-46b5-8c80-2ca8f8c47679	liangzifeng1007@163.com	$2b$10$Q0JDkX8N0Lv565FFhYYiEe5doKq/s6pAJE0vzA1RVhsWSGOQvp3FW	OWNER	2025-11-11 20:49:00.974735
02ec1cf0-6e62-494a-8eb9-93a7cdf7f5c9	stefan1nonly@hotmail.com	$2b$10$q5ncI.Jg8DiJe2L7W2MvE./sPvMWKToHGW6gVRR67SMZsUbXDvHum	OWNER	2025-11-15 19:40:21.535131
87fe9fe6-6eaa-4c6d-b1e9-177e0e84aa50	vid.grujic@mail.utoronto.ca	$2b$10$H.516rq8Fo3Mw705/KSAaOZOsLrFp/Arsg7Pr7JC2kepaoE2uen9W	OWNER	2025-11-15 20:39:38.1263
b246bb0b-ae40-48c1-afc1-94ade4908e2e	123@12.com	$2b$10$1iSJ9A184MugdEgiNgNeduNboAOFd4bqGdQa1iTxASnrjTYccz2Z6	OWNER	2025-11-17 20:01:09.911339
\.


--
-- Name: test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.test_id_seq', 1, true);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: file_permissions file_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.file_permissions
    ADD CONSTRAINT file_permissions_pkey PRIMARY KEY (file_id, user_id);


--
-- Name: file_versions file_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_pkey PRIMARY KEY (file_id, version_no);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (file_id);


--
-- Name: test test_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.test
    ADD CONSTRAINT test_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_comments_file_ver; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_comments_file_ver ON public.comments USING btree (file_id, version_no);


--
-- Name: idx_comments_parent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_comments_parent ON public.comments USING btree (parent_id);


--
-- Name: file_permissions file_permissions_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.file_permissions
    ADD CONSTRAINT file_permissions_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(file_id) ON DELETE CASCADE;


--
-- Name: file_permissions file_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.file_permissions
    ADD CONSTRAINT file_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: file_versions file_versions_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(file_id) ON DELETE CASCADE;


--
-- Name: file_versions file_versions_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: files files_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict GAb7w5MQ3ZMTmc341qQt2OMBqkyyxF3bo9b6y1qi1IwoULWulFJMirNptYBkCnR


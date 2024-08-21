create table
  public.acc_portal_pettycash_accounts (
    id serial not null,
    admin_id text not null,
    branch_id integer null,
    userid integer null,
    account_type character varying(50) not null,
    balance numeric(10, 2) null default 0,
    currency character varying(3) null default 'USD'::character varying,
    status character varying(20) null default 'Active'::character varying,
    created_date timestamp without time zone null default current_timestamp,
    account_number character varying(50) null,
    min_amount numeric(10, 2) null,
    max_amount numeric(10, 2) null,
    constraint acc_portal_pettycash_accounts_pkey primary key (id),
    constraint acc_portal_pettycash_accounts_account_number_key unique (account_number),
    constraint acc_portal_pettycash_accounts_branch_id_fkey foreign key (branch_id) references acc_portal_pettycash_branches (id),
    constraint acc_portal_pettycash_accounts_userid_fkey foreign key (userid) references acc_portal_pettycash_users (id)
  ) tablespace pg_default;


  create table
  public.acc_portal_pettycash_branches (
    id serial not null,
    userid text not null,
    branch_name character varying(255) not null,
    location character varying(255) null,
    manager_name character varying(255) null,
    contact_number character varying(50) null,
    email character varying(255) null,
    created_date timestamp without time zone null default current_timestamp,
    constraint acc_portal_pettycash_branches_pkey primary key (id)
  ) tablespace pg_default;

  create table
  public.acc_portal_pettycash_categories (
    id serial not null,
    admin_id uuid not null default gen_random_uuid (),
    type character varying(50) not null,
    name character varying(100) not null,
    created_date timestamp without time zone null default current_timestamp,
    constraint acc_portal_pettycash_categories_pkey primary key (id)
  ) tablespace pg_default;

  create table
  public.acc_portal_pettycash_entries (
    id serial not null,
    userid text null,
    amount numeric(10, 2) not null,
    invoice_number character varying(50) null,
    invoice_date date null,
    description text null,
    receipt_url text null,
    expense_type character varying(100) null,
    payment_type character varying(50) null,
    checked_by character varying(255) null,
    approved_by character varying(255) null,
    created_date timestamp without time zone null default current_timestamp,
    account_type text null,
    branch_name text null,
    user_name text null,
    user_id text null,
    branch_id text null,
    created_at timestamp without time zone not null default now(),
    constraint acc_portal_pettycash_entries_pkey primary key (id)
  ) tablespace pg_default;

  create table
  public.acc_portal_pettycash_reports (
    id serial not null,
    admin_id uuid not null,
    report_type character varying(50) not null,
    start_date date not null,
    end_date date not null,
    generated_date timestamp without time zone null default current_timestamp,
    report_data jsonb null,
    constraint acc_portal_pettycash_reports_pkey primary key (id)
  ) tablespace pg_default;

  create view
  public.acc_portal_pettycash_user_account_count as
select
  u.id as user_id,
  count(a.id) as account_count
from
  acc_portal_pettycash_users u
  left join acc_portal_pettycash_accounts a on u.id = a.userid
group by
  u.id;


  create table
  public.acc_portal_pettycash_user_limits (
    id serial not null,
    admin_id uuid not null,
    user_id integer null,
    account_type character varying(50) not null,
    limit_amount numeric(10, 2) not null,
    created_date timestamp without time zone null default current_timestamp,
    constraint acc_portal_pettycash_user_limits_pkey primary key (id),
    constraint acc_portal_pettycash_user_limits_user_id_fkey foreign key (user_id) references acc_portal_pettycash_users (id)
  ) tablespace pg_default;


  create table
  public.acc_portal_pettycash_users (
    id serial not null,
    admin_id text not null,
    name character varying(255) not null,
    email character varying(255) not null,
    role character varying(50) not null,
    branch_id integer null,
    created_date timestamp without time zone null default current_timestamp,
    last_spent_amount numeric(10, 2) null,
    last_spent_date timestamp without time zone null,
    cash_balance numeric(10, 2) null default 0,
    credit_balance numeric(10, 2) null default 0,
    mpesa_balance numeric(10, 2) null default 0,
    constraint acc_portal_pettycash_users_pkey primary key (id),
    constraint acc_portal_pettycash_users_email_key unique (email),
    constraint acc_portal_pettycash_users_branch_id_fkey foreign key (branch_id) references acc_portal_pettycash_branches (id)
  ) tablespace pg_default;

  
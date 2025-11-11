export const tableArray = [
  {
    tableName: 'product_category',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS product_category(id INTEGER PRIMARY KEY, branch VARCHAR(20), combination VARCHAR(20), combo_qty_limit VARCHAR(100), cr_discount VARCHAR(100), discount VARCHAR(100), pr_cat_code VARCHAR(100), pr_cat_id VARCHAR(100), pr_cat_name VARCHAR(100), status VARCHAR(100))',
  },
  {
    tableName: 'products',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS  products(id INTEGER PRIMARY KEY , pr_id VARCHAR(20), product_name VARCHAR(255), hsn_code VARCHAR(255), product_no VARCHAR(20), product_code VARCHAR(20), sorting_order VARCHAR(20),uom VARCHAR(100), basic_rate VARCHAR(100), basic_tax_percent VARCHAR(100), basic_tax_amount VARCHAR(100), sgst_tax VARCHAR(100), sgst_tax_amount VARCHAR(20), cgst_tax VARCHAR(20), cgst_tax_amount VARCHAR(20), price VARCHAR(255), discount_perc VARCHAR(20),product_stock VARCHAR(20), product_status VARCHAR(20), pr_cat_id VARCHAR(30), branch VARCHAR(255), token VARCHAR(20), tokengroup VARCHAR(30), social_order VARCHAR(30), sales_item_type VARCHAR(40), combination VARCHAR(30), product_type VARCHAR(30), qty_sales_type VARCHAR(40), stock_limit VARCHAR(30), barcode_number VARCHAR(50),product_image_path VARCHAR(20))',
  },
  {
    tableName: 'application_settings',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS application_settings (app_setting_id INTEGER PRIMARY KEY, setting_name VARCHAR(100), setting_access INTEGER, setting_type VARCHAR(20), setting_title VARCHAR(100), status VARCHAR(20), branch VARCHAR(20))',
  },
  {
    tableName: 'masters_creation',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS masters_creation (masterId INTEGER PRIMARY KEY, masters_status VARCHAR(50), master_details VARCHAR(100), branch VARCHAR(20), status VARCHAR(20), master_image_path VARCHAR(255))',
  },
  {
    tableName: 'Santhe_products',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS  Santhe_products(id INTEGER PRIMARY KEY AUTOINCREMENT, pr_id VARCHAR(20), product_name VARCHAR(255), hsn_code VARCHAR(255), product_no VARCHAR(20), product_code VARCHAR(20), sorting_order VARCHAR(20),uom VARCHAR(100), basic_rate VARCHAR(100), basic_tax_percent VARCHAR(100), basic_tax_amount VARCHAR(100), sgst_tax VARCHAR(100), sgst_tax_amount VARCHAR(20), cgst_tax VARCHAR(20), cgst_tax_amount VARCHAR(20), price VARCHAR(255), discount_perc VARCHAR(20),product_stock VARCHAR(20), product_status VARCHAR(20), pr_cat_id VARCHAR(30), branch VARCHAR(255), token VARCHAR(20), tokengroup VARCHAR(30), social_order VARCHAR(30), sales_item_type VARCHAR(40), combination VARCHAR(30), product_type VARCHAR(30), qty_sales_type VARCHAR(40), stock_limit VARCHAR(30), barcode_number VARCHAR(50),product_image_path VARCHAR(20))',
  },
  {
    tableName: 'credit_customers',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS credit_customers (cust_id INTEGER PRIMARY KEY, cust_name VARCHAR(100), phone_number VARCHAR(15), gst_no VARCHAR(15), cust_address VARCHAR(255), branch VARCHAR(20), status VARCHAR(20))',
  },
  {
    tableName: 'outlet_details',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS outlet_details (outId VARCHAR(20), branch_title VARCHAR(100), branch_slno VARCHAR(20), invoice_prefix VARCHAR(20), org_name VARCHAR(255), land_no VARCHAR(20), mobile VARCHAR(20), email_id VARCHAR(255), gstin_no VARCHAR(20), address1 VARCHAR(255), address2 VARCHAR(255), website_name VARCHAR(255), branch VARCHAR(20), cin_no VARCHAR(20), userId VARCHAR(20), status VARCHAR(20)) ',
  },
  {
    tableName: 'users',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS users (userId VARCHAR(20), email VARCHAR(255), password VARCHAR(255), name VARCHAR(100), mobile VARCHAR(20), roleId VARCHAR(20), branch VARCHAR(20), branch_id VARCHAR(20), santhe_branch VARCHAR(20), prime_id VARCHAR(20), status VARCHAR(20))',
  },
  {
    tableName: 'counter_bills',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS counter_bills (bill_id INTEGER, bno INTEGER, bill_no TEXT, bill_date TEXT, bill_time TEXT, in_no INTEGER, invoice_no TEXT, invoice_date TEXT, invoice_time TEXT, edit_date TEXT, edit_time TEXT, cust_name TEXT, cust_phone TEXT, cust_gst TEXT, cust_address TEXT, album_no TEXT, shape TEXT, remarks TEXT, ord_taken_by TEXT, ord_edited_by TEXT, total_basic_price REAL, disc_total_amt REAL, basic_aft_disc REAL, tax_aft_disc REAL, disc_given_by TEXT, disc_given_to TEXT, total_amount REAL, advance_amount REAL, balance_amount REAL, paid_amt REAL, total_paid_amount REAL, refunded_amt REAL, mop TEXT, final_mop TEXT, multi_paytm REAL, multi_card REAL, multi_cash REAL, multi_phonepay REAL, nc_cust_name TEXT, nc_cust_phone TEXT, nc_approved_by TEXT, cheque_no TEXT, cheque_date TEXT, cheque_bank TEXT, neft_trans_no TEXT, neft_date TEXT, neft_amount REAL, credit_cust_name TEXT, credit_cust_phone TEXT, delivery_date TEXT, delivery_time TEXT, delivery_day TEXT, delivery_mode TEXT, picked_up_name TEXT, picked_up_id TEXT, msg TEXT, ord_remarks TEXT, cancelled_date TEXT, refunded_date INTEGER, status TEXT, stlmnt_status TEXT, stlmnt_date TEXT, branch TEXT, re_print REAL, sync_status TEXT, user_id TEXT, order_type TEXT, callback_status TEXT, record_delete TEXT, max_postpone_date TEXT)',
  },
  {
    tableName: 'counter_items',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS counter_items (item_id INTEGER, cat_name TEXT, product_name TEXT, hsn_code TEXT, uom TEXT, basic_rate REAL, tax_percentage REAL, sgst_tax REAL, sgst_base_tax_amt REAL, cgst_tax REAL, cgst_base_tax_amt REAL, basic_price REAL, pc_qty REAL, quantity REAL, price REAL, disc_per REAL, disc_amount REAL, item_taxable_amt REAL, sgst_tax_amount REAL, cgst_tax_amount REAL, item_tax_amt REAL, total_price REAL, bill_status TEXT, sd_status TEXT, bill_id INTEGER, pr_id INTEGER, edit_status REAL, disc_type TEXT, sales_type TEXT, product_no TEXT, Isprinted REAL)',
  },
  {
    tableName: 'counter_payments',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS counter_payments (payment_id INTEGER , payment_date TEXT, payment_types TEXT, multi_payment TEXT, branch TEXT, bill_id INTEGER, user_name TEXT, payment_status TEXT, paid_amount TEXT)',
  },

  {
    tableName: 'sante_bills',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS sante_bills (bill_id INTEGER PRIMARY KEY AUTOINCREMENT, bill_no TEXT  NOT NULL, bill_date TEXT NOT NULL, bill_time TEXT NOT NULL, total_basic REAL NOT NULL, total_qty INTEGER NOT NULL, discount_amount REAL NOT NULL, taxable_amount REAL NOT NULL, tax_amount REAL NOT NULL, cgst_price REAL NOT NULL, sgst_price REAL NOT NULL, grand_total_amount REAL NOT NULL, payment_type TEXT NOT NULL, branch_name TEXT NOT NULL,sync_status TEXT) ',
  },
  {
    tableName: 'sante_items',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS sante_items (item_id INTEGER PRIMARY KEY AUTOINCREMENT , item_name TEXT NOT NULL, item_tax_percent REAL NOT NULL, item_basic REAL NOT NULL, basic_tax REAL NOT NULL, cat_id INTEGER NOT NULL, item_qty INTEGER NOT NULL, item_price REAL NOT NULL, item_discount REAL NOT NULL, item_taxable REAL NOT NULL, item_discount_tax_amount REAL NOT NULL, bill_id INTEGER NOT NULL, bill_date TEXT NOT NULL, branch_name TEXT NOT NULL)',
  },
  {
    tableName: 'sante_discounts',
    tableCreateSchema:
      'CREATE TABLE IF NOT EXISTS sante_discounts (item_id INTEGER NOT NULL, item_qty INTEGER NOT NULL, bill_id INTEGER NOT NULL, branch_name TEXT NOT NULL);',
  },
];

export const insertQuerry = {
  InsertProductCategory:
    'INSERT INTO product_category (branch, combination, combo_qty_limit, cr_discount, discount, pr_cat_code, pr_cat_id, pr_cat_name, status) VALUES (?,?,?,?,?,?,?,?,?)',
  InsertProductsList:
    'INSERT INTO products (pr_id, product_name, hsn_code, product_no, product_code, sorting_order, uom, basic_rate, basic_tax_percent,sgst_tax, sgst_tax_amount, cgst_tax, cgst_tax_amount, price, discount_perc, product_stock, product_status, pr_cat_id, branch, token, tokengroup, social_order, sales_item_type, combination, product_type, qty_sales_type, stock_limit, barcode_number, product_image_path ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
  InsertAppSettings:
    'INSERT INTO application_settings (app_setting_id, setting_name, setting_access, setting_type, setting_title, status, branch) VALUES (?, ?, ?, ?, ?, ?, ?)',
  InsertMaster:
    'INSERT INTO masters_creation (masterId, masters_status, master_details, branch, status, master_image_path) VALUES (?,?,?,?,?, ?)',
  InsertSanteProducts:
    'INSERT INTO Santhe_products (pr_id, product_name, hsn_code, product_no, product_code, sorting_order, uom, basic_rate, basic_tax_percent,sgst_tax, sgst_tax_amount, cgst_tax, cgst_tax_amount, price, discount_perc, product_stock, product_status, pr_cat_id, branch, token, tokengroup, social_order, sales_item_type, combination, product_type, qty_sales_type, stock_limit, barcode_number, product_image_path ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
  InsertCustomers:
    'INSERT INTO credit_customers (cust_id, cust_name, phone_number, gst_no, cust_address, branch, status) VALUES (?,?,?,?,?,?,?)',
  InserOutlets:
    'INSERT INTO outlet_details (outId, branch_title, branch_slno, invoice_prefix, org_name, land_no, mobile, email_id, gstin_no, address1, address2, website_name, branch, cin_no, userId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  InsertUsers:
    'INSERT INTO user_details (userId, email, password, name, mobile, roleId, branch, branch_id, santhe_branch, prime_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  InsertCounterBills:
    'INSERT INTO counter_bills (bill_id, bno, bill_no, bill_date, bill_time, invoice_no, invoice_date, invoice_time, edit_date, edit_time, cust_name, cust_phone, cust_gst, cust_address, album_no, shape, remarks, ord_taken_by, ord_edited_by, total_basic_price, disc_total_amt, basic_aft_disc, tax_aft_disc, disc_given_by, disc_given_to, total_amount, advance_amount, balance_amount, paid_amt, total_paid_amount, refunded_amt, mop, final_mop, multi_paytm, multi_card, multi_cash, multi_phonepay, nc_cust_name, nc_cust_phone, nc_approved_by, cheque_no, cheque_date, cheque_bank, neft_trans_no, neft_date, neft_amount, credit_cust_name, credit_cust_phone, delivery_date, delivery_time, delivery_day, delivery_mode, picked_up_name, picked_up_id, msg, ord_remarks, cancelled_date, refunded_date, status, stlmnt_status, stlmnt_date, branch, re_print, sync_status, user_id, order_type, callback_status, record_delete, max_postpone_date,in_no) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)',
  InsertCounterPayments:
    'INSERT INTO counter_payments (payment_id, payment_date, payment_types, multi_payment, branch, bill_id, user_name, payment_status, paid_amount) VALUES (?,?,?,?,?,?,?,?,?)',
  InsertSanteBills: `INSERT INTO sante_bills (bill_id, bill_no, bill_date, bill_time, total_basic, total_qty, discount_amount, taxable_amount, tax_amount, cgst_price, sgst_price, grand_total_amount, payment_type, branch_name,sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
  InsertSanteItems: `INSERT INTO sante_items (item_id, item_name, item_tax_percent, item_basic, basic_tax, cat_id, item_qty, item_price, item_discount, item_taxable, item_discount_tax_amount, bill_id, bill_date, branch_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  InsertSanteDiscounts:
    'INSERT INTO sante_discounts (item_id, item_qty, bill_id, branch_name) VALUES (?, ?, ?, ?)',
  InsertCounterItems:
    'INSERT INTO counter_items (item_id, cat_name, product_name, hsn_code, uom, basic_rate, tax_percentage, sgst_tax, sgst_base_tax_amt, cgst_tax, cgst_base_tax_amt, basic_price, pc_qty, quantity, price, disc_per, disc_amount, item_taxable_amt, sgst_tax_amount, cgst_tax_amount, item_tax_amt, total_price, bill_status, sd_status, bill_id, pr_id, edit_status, disc_type, sales_type, product_no, Isprinted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
};

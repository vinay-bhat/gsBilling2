import {Alert} from 'react-native';
import {db} from './Sqlitecreation';
import {insertQuerry} from './SqlliteTable';

export const inserData = async (tableName: string, value: any) => {
  let data: any[] = [];
  let querry: string = '';
  let bii_id: any;

  switch (tableName) {
    case 'product_category':
      querry = insertQuerry.InsertProductCategory;
      data = [
        value.branch,
        value.combination,
        value.combo_qty_limit,
        value.cr_discount,
        value.discount,
        value.pr_cat_code,
        value.pr_cat_id,
        value.pr_cat_name,
        value.status,
      ];
      break;
    case 'products':
      querry = insertQuerry.InsertProductsList;
      data = [
        value.pr_id,
        value.product_name,
        value.hsn_code,
        value.product_no,
        value.product_code,
        value.sorting_order,
        value.uom,
        value.basic_rate,
        value.basic_tax_percent,
        value.sgst_tax,
        value.sgst_tax_amount,
        value.cgst_tax,
        value.cgst_tax_amount,
        value.price,
        value.discount_perc,
        value.product_stock,
        value.product_status,
        value.pr_cat_id,
        value.branch,
        value.token,
        value.tokengroup,
        value.social_order,
        value.sales_item_type,
        value.combination,
        value.product_type,
        value.qty_sales_type,
        value.stock_limit,
        value.barcode_number,
        value.product_image_path,
      ];
      break;
    case 'application_settings':
      querry = insertQuerry.InsertAppSettings;
      data = [
        value.app_setting_id,
        value.setting_name,
        value.setting_access,
        value.setting_type,
        value.setting_title,
        value.status,
        value.branch,
      ];
      break;
    case 'masters_creation':
      querry = insertQuerry.InsertMaster;
      data = [
        value.masterId,
        value.masters_status,
        value.master_details,
        value.branch,
        value.status,
        value.master_image_path,
      ];
      break;
    case 'Santhe_products':
      querry = insertQuerry.InsertSanteProducts;
      data = [
        value.pr_id,
        value.product_name,
        value.hsn_code,
        value.product_no,
        value.product_code,
        value.sorting_order,
        value.uom,
        value.basic_rate,
        value.basic_tax_percent,
        value.sgst_tax,
        value.sgst_tax_amount,
        value.cgst_tax,
        value.cgst_tax_amount,
        value.price,
        value.discount_perc,
        value.product_stock,
        value.product_status,
        value.pr_cat_id,
        value.branch,
        value.token,
        value.tokengroup,
        value.social_order,
        value.sales_item_type,
        value.combination,
        value.product_type,
        value.qty_sales_type,
        value.stock_limit,
        value.barcode_number,
        value.product_image_path,
      ];
      break;
    case 'credit_customers':
      querry = insertQuerry.InsertCustomers;
      data = [
        value.cust_id,
        value.cust_name,
        value.phone_number,
        value.gst_no,
        value.cust_address,
        value.branch,
        value.status,
      ];
      break;

    case 'outlet_details':
      querry = insertQuerry.InserOutlets;
      data = [
        value.outId,
        value.branch_title,
        value.branch_slno,
        value.invoice_prefix,
        value.org_name,
        value.land_no,
        value.mobile,
        value.email_id,
        value.gstin_no,
        value.address1,
        value.address2,
        value.website_name,
        value.branch,
        value.cin_no,
        value.userId,
        value.status,
      ];
      break;
    case 'user':
      querry = insertQuerry.InsertUsers;
      data = [
        value.userId,
        value.email,
        value.password,
        value.name,
        value.mobile,
        value.roleId,
        value.branch,
        value.branch_id,
        value.santhe_branch,
        value.prime_id,
        value.status,
      ];
      break;

    case 'counter_bills':
      querry = insertQuerry.InsertCounterBills;
      data = [
        value.bill_id,
        value.bno,
        value.bill_no,
        value.bill_date,
        value.bill_time,
        value.invoice_no,
        value.invoice_date,
        value.invoice_time,
        value.edit_date,
        value.edit_time,
        value.cust_name,
        value.cust_phone,
        value.cust_gst,
        value.cust_address,
        value.album_no,
        value.shape,
        value.remarks,
        value.ord_taken_by,
        value.ord_edited_by,
        value.total_basic_price,
        value.disc_total_amt,
        value.basic_aft_disc,
        value.tax_aft_disc,
        value.disc_given_by,
        value.disc_given_to,
        value.total_amount,
        value.advance_amount,
        value.balance_amount,
        value.paid_amt,
        value.total_paid_amount,
        value.refunded_amt,
        value.mop,
        value.final_mop,
        value.multi_paytm,
        value.multi_card,
        value.multi_cash,
        value.multi_phonepay,
        value.nc_cust_name,
        value.nc_cust_phone,
        value.nc_approved_by,
        value.cheque_no,
        value.cheque_date,
        value.cheque_bank,
        value.neft_trans_no,
        value.neft_date,
        value.neft_amount,
        value.credit_cust_name,
        value.credit_cust_phone,
        value.delivery_date,
        value.delivery_time,
        value.delivery_day,
        value.delivery_mode,
        value.picked_up_name,
        value.picked_up_id,
        value.msg,
        value.ord_remarks,
        value.cancelled_date,
        value.refunded_date,
        value.status,
        value.stlmnt_status,
        value.stlmnt_date,
        value.branch,
        value.re_print,
        value.sync_status,
        value.user_id,
        value.order_type,
        value.callback_status,
        value.record_delete,
        value.max_postpone_date,
        value.in_no,
      ];

      break;
    case 'counter_items':
      querry = insertQuerry.InsertCounterItems;
      data = [
        value.item_id,
        value.cat_name,
        value.product_name,
        value.hsn_code,
        value.uom,
        value.basic_rate,
        value.tax_percentage,
        value.sgst_tax,
        value.sgst_base_tax_amt,
        value.cgst_tax,
        value.cgst_base_tax_amt,
        value.basic_price,
        value.pc_qty,
        value.quantity,
        value.price,
        value.disc_per,
        value.disc_amount,
        value.item_taxable_amt,
        value.sgst_tax_amount,
        value.cgst_tax_amount,
        value.item_tax_amt,
        value.total_price,
        value.bill_status,
        value.sd_status,
        value.bill_id,
        value.pr_id,
        value.edit_status,
        value.disc_type,
        value.sales_type,
        value.product_no,
        value.Isprinted,
      ];

      break;
    case 'counter_payments':
      querry = insertQuerry.InsertCounterPayments;
      data = [
        value.payment_id,
        value.payment_date,
        value.payment_types,
        value.multi_payment,
        value.branch,
        value.bill_id,
        value.user_name,
        value.payment_status,
        value.paid_amount,
      ];
      break;
    case 'sante_bills':
      querry = insertQuerry.InsertSanteBills;
      data = [
        value.bill_id,
        value.bill_no,
        value.bill_date,
        value.bill_time,
        value.total_basic,
        value.total_qty,
        value.discount_amount,
        value.taxable_amount,
        value.tax_amount,
        value.cgst_price,
        value.sgst_price,
        value.grand_total_amount,
        value.payment_type,
        value.branch_name,
        value.sync_status,
      ];
      break;
    case 'sante_items':
      querry = insertQuerry.InsertSanteItems;
      data = [
        value.item_id,
        value.item_name,
        value.item_tax_percent,
        value.item_basic,
        value.basic_tax,
        value.cat_id,
        value.item_qty,
        value.item_price,
        value.item_discount,
        value.item_taxable,
        value.item_discount_tax_amount,
        value.bill_id,
        value.bill_date,
        value.branch_name,
      ];
      break;
    case 'sante_discounts':
      querry = insertQuerry.InsertSanteDiscounts;
      data = [value.item_id, value.item_qty, value.bill_id, value.branch_name];
      break;
    default:
      console.log('Default action performed!');
  }
  // console.log("SQL INSERT", tableName,data);
  try {
    await new Promise<void>((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql(
          querry,
          data,
          (tx: any, results: any) => {
            if (results.rowsAffected > 0) {
              console.log('SQL INSERT', tableName, data);
              if (tableName === 'counter_bills' || tableName == 'sante_items') {
                bii_id = results.insertId;
                console.log('results.insertId', results.insertId);
                console.log('results.insertId', results);

                resolve(bii_id);
              } else {
                resolve();
              }
            } else {
              reject(new Error('Registration Failed'));
            }
          },
          (error: any) => {
            reject(error);
          },
        );
      });
    });
  } catch (error) {
    console.error('store sql err', tableName, error);
  }

  if (
    tableName === 'counter_bills' ||
    tableName === 'sante_bills' ||
    tableName == 'sante_items'
  ) {
    return bii_id;
  }
};

export const updateData = async (
  tableName: string,
  value: any,
): Promise<void> => {
  let query = '';
  let data: any[] = [];

  switch (tableName) {
    case 'product_category':
      query = `UPDATE product_category SET branch = ?, combination = ?, combo_qty_limit = ?, cr_discount = ?, discount = ?, pr_cat_code = ?, pr_cat_name = ?, status = ? WHERE pr_cat_id = ?`;
      data = [
        value.branch,
        value.combination,
        value.combo_qty_limit,
        value.cr_discount,
        value.discount,
        value.pr_cat_code,
        value.pr_cat_name,
        value.status,
        value.pr_cat_id,
      ];
      break;
    case 'products':
      query = `UPDATE products SET product_name = ?, hsn_code = ?, product_no = ?, product_code = ?, sorting_order = ?, uom = ?, basic_rate = ?, basic_tax_percent = ?, sgst_tax = ?, sgst_tax_amount = ?, cgst_tax = ?, cgst_tax_amount = ?, price = ?, discount_perc = ?, product_stock = ?, product_status = ?, pr_cat_id = ?, branch = ?, token = ?, tokengroup = ?, social_order = ?, sales_item_type = ?, combination = ?, product_type = ?, qty_sales_type = ?, stock_limit = ?, barcode_number = ?, product_image_path = ? WHERE pr_id = ?`;
      data = [
        value.product_name,
        value.hsn_code,
        value.product_no,
        value.product_code,
        value.sorting_order,
        value.uom,
        value.basic_rate,
        value.basic_tax_percent,
        value.sgst_tax,
        value.sgst_tax_amount,
        value.cgst_tax,
        value.cgst_tax_amount,
        value.price,
        value.discount_perc,
        value.product_stock,
        value.product_status,
        value.pr_cat_id,
        value.branch,
        value.token,
        value.tokengroup,
        value.social_order,
        value.sales_item_type,
        value.combination,
        value.product_type,
        value.qty_sales_type,
        value.stock_limit,
        value.barcode_number,
        value.product_image_path,
        value.pr_id,
      ];
      break;
    case 'application_settings':
      query = `UPDATE application_settings SET setting_name = ?, setting_access = ?, setting_type = ?, setting_title = ?, status = ?, branch = ? WHERE app_setting_id = ?`;
      data = [
        value.setting_name,
        value.setting_access,
        value.setting_type,
        value.setting_title,
        value.status,
        value.branch,
        value.app_setting_id,
      ];
      break;
    case 'outlet_details':
      query = `UPDATE outlet_details SET branch_title = ?, branch_slno = ?, invoice_prefix = ?, org_name = ?, land_no = ?, mobile = ?, email_id = ?, gstin_no = ?, address1 = ?, address2 = ?, website_name = ?, branch = ?, cin_no = ?, userId = ?, status = ? WHERE outId = ?`;
      data = [
        value.branch_title,
        value.branch_slno,
        value.invoice_prefix,
        value.org_name,
        value.land_no,
        value.mobile,
        value.email_id,
        value.gstin_no,
        value.address1,
        value.address2,
        value.website_name,
        value.branch,
        value.cin_no,
        value.userId,
        value.status,
        value.outId,
      ];
      break;
    default:
      console.warn(`updateData: unsupported table ${tableName}`);
      return;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql(
          query,
          data,
          (_tx: any, results: any) => {
            if (results.rowsAffected > 0) {
              resolve();
            } else {
              reject(new Error(`Update Failed: No rows affected in ${tableName}`));
            }
          },
          (_tx: any, error: any) => {
            reject(error);
          },
        );
      });
    });
  } catch (error) {
    console.error(`updateData failed for ${tableName}`, error);
    throw error;
  }
};

export const updateStatusById = async (
  tableName: string,
  id: number,
  newStatus: string = 'Done',
): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql(
          `UPDATE ${tableName} SET sync_status = ? WHERE bill_id = ?`,
          [newStatus, id],
          (tx: any, results: any) => {
            if (results.rowsAffected > 0) {
              console.log(
                `SQL UPDATE ${tableName}`,
                `Updated status to ${newStatus} for ID ${id}`,
              );
              resolve();
            } else {
              reject(new Error('Update Failed: No rows affected'));
            }
          },
          (error: any) => {
            reject(error);
          },
        );
      });
    });
  } catch (error) {
    console.error(`Update status in ${tableName} failed for ID ${id}`, error);
  }
};

export async function batchUpdateStatusById(
  tableName: string,
  billIds: any,
  newStatus: string,
) {
  try {
    if (!billIds || billIds.length === 0) {
      console.warn('No bill IDs provided for batch update');
      return {success: false, updated: 0};
    }

    // Create placeholders for parameterized query
    const placeholders = billIds.map(() => '?').join(',');
    console.log(placeholders, 'placeholders');
    const query = `
      UPDATE ${tableName} 
      SET sync_status = ?
      WHERE bill_id IN (${placeholders})
    `;

    const params = [newStatus, ...billIds];

    // Execute the query (adjust based on your database client)
    // const result = await db.query(query, params);

    const result: any = await new Promise<void>((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql(
          `
      UPDATE ${tableName} 
      SET sync_status = ?
      WHERE bill_id IN (${placeholders})
    `,
          [newStatus, ...billIds],
          (tx: any, results: any) => {
            if (results.rowsAffected > 0) {
              console.log(
                `SQL UPDATE ${tableName}`,
                `Updated status to ${newStatus} for ID ${[...billIds]}`,
              );
              resolve();
            } else {
              reject(new Error('Update Failed: No rows affected'));
            }
          },
          (error: any) => {
            reject(error);
          },
        );
      });
    });

    // console.log(
    //   `Batch updated ${result.affectedRows} bills to status: ${newStatus}`
    // );

    return {
      success: true,
      updated: result,
      billIds: billIds,
    };
  } catch (error: any) {
    console.error('Batch update failed:', error);
    return {
      success: false,
      error: error.message,
      updated: 0,
    };
  }
}

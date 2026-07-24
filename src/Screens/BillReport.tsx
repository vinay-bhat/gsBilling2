import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
//@ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {fonts} from '../constants/constants';
import useStore from '../Redux/Store';
import {syncCounterBill} from '../Utils/synch';
import {useIsFocused} from '@react-navigation/native';
import NCModal from '../Modals/NC';
import {db} from '../Utils/sqlite/Sqlitecreation';
import {isSettingEnabled} from '../Utils/Common';

const {width} = Dimensions.get('window');

interface BillData {
  bill_id: number;
  invoice_no: string;
  invoice_date: string;
  invoice_time: string;
  total_amount: number;
  mop: string;
  final_mop: string;
  status: string;
  branch: string;
  nc_cust_name?: string;
  nc_cust_phone?: string;
  nc_approved_by?: string;
  counter_items: any[];
  counter_payments: any[];
}

const BillReport: React.FC = () => {
  const navigation = useNavigation();
  const [billData, setBillData] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('');
  const [counterBills, setCounterBills] = useState<any[]>([]);
  const [santeBills, setSantheBills] = useState<any[]>([]);
  const [ncModal, setNcModal] = useState(false);
  const [paymentType, setPaymentType] = useState<any>({});
  const isFocused = useIsFocused();

  const {paymentList, ncModalData, setNcModalData} = useStore();
  const appSettings = useStore(state => state.appSettings);
  const isSantheEnabled = isSettingEnabled(
    'SANTHE_MODULE_BUTTON',
    appSettings || [],
  );
  const paymentModes = paymentList.map((item: any) => item.setting_name);

  const handleEditPayment = (bill: BillData) => {
    setSelectedBill(bill);
    setSelectedPaymentMode(bill.final_mop || bill.mop);
    setEditModalVisible(true);
  };

  const handleSavePayment = async () => {
    if (selectedBill && selectedPaymentMode) {
      try {
        // Update local state first
        setBillData(prevData =>
          prevData.map(bill =>
            bill.bill_id === selectedBill.bill_id
              ? {
                  ...bill,
                  final_mop: selectedPaymentMode,
                  mop: selectedPaymentMode,
                }
              : bill,
          ),
        );

        // Update counterBills state for UI
        setCounterBills(prevData =>
          prevData.map(bill =>
            bill.bill_id === selectedBill.bill_id
              ? {
                  ...bill,
                  final_mop: selectedPaymentMode,
                  mop: selectedPaymentMode,
                }
              : bill,
          ),
        );

        // Update counter_bills table
        await new Promise<void>((resolve, reject) => {
          db.transaction((tx: any) => {
            tx.executeSql(
              `UPDATE counter_bills 
               SET final_mop = ?, mop = ? 
               WHERE bill_id = ?`,
              [selectedPaymentMode, selectedPaymentMode, selectedBill.bill_id],
              (tx: any, results: any) => {
                if (results.rowsAffected > 0) {
                  console.log(
                    `Updated counter_bills for bill_id: ${selectedBill.bill_id}`,
                  );
                  resolve();
                } else {
                  reject(
                    new Error(
                      'Update Failed: No rows affected in counter_bills',
                    ),
                  );
                }
              },
              (error: any) => {
                console.error('Error updating counter_bills:', error);
                reject(error);
              },
            );
          });
        });

        // Update counter_payments table
        await new Promise<void>((resolve, reject) => {
          db.transaction((tx: any) => {
            tx.executeSql(
              `UPDATE counter_payments 
               SET payment_types = ? 
               WHERE bill_id = ?`,
              [selectedPaymentMode, selectedBill.bill_id],
              (tx: any, results: any) => {
                if (results.rowsAffected > 0) {
                  console.log(
                    `Updated counter_payments for bill_id: ${selectedBill.bill_id}`,
                  );
                  resolve();
                } else {
                  reject(
                    new Error(
                      'Update Failed: No rows affected in counter_payments',
                    ),
                  );
                }
              },
              (error: any) => {
                console.error('Error updating counter_payments:', error);
                reject(error);
              },
            );
          });
        });

        console.log(
          `Successfully updated payment mode to ${selectedPaymentMode} for bill ${selectedBill.bill_id}`,
        );

        // Close modal and reset states
        setEditModalVisible(false);
        setSelectedBill(null);
        setSelectedPaymentMode('');
      } catch (error) {
        console.error('Error updating payment mode:', error);
        Alert.alert(
          'Error',
          'Failed to update payment mode. Please try again.',
        );
      }
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setSelectedBill(null);
    setSelectedPaymentMode('');
  };

  const handlePaymentModeSelect = (mode: string) => {
    if (mode === 'NC') {
      // Open NC modal directly when NC is selected
      setNcModal(true);
      setPaymentType({
        billId: selectedBill?.bill_id,
        amount: selectedBill?.total_amount,
      });
      // Keep edit modal open, don't close it
      setSelectedPaymentMode(mode);
    } else {
      // For other payment modes, just update the selection
      setSelectedPaymentMode(mode);
    }
  };

  const onNcDone = async (ncData: any) => {
    console.log('NC Data:', ncData);
    setNcModalData(ncData);

    // Update the payment mode to NC after NC modal is completed
    if (selectedBill && ncData) {
      try {
        // Update local state with NC data
        setBillData(prevData =>
          prevData.map(bill =>
            bill.bill_id === selectedBill.bill_id
              ? {
                  ...bill,
                  final_mop: 'NC',
                  mop: 'NC',
                  nc_cust_name: ncData.nc_cust_name || '',
                  nc_cust_phone: ncData.nc_cust_phone || '',
                  nc_approved_by: ncData.nc_approved_by || '',
                }
              : bill,
          ),
        );

        // Update counterBills state for UI with NC data
        setCounterBills(prevData =>
          prevData.map(bill =>
            bill.bill_id === selectedBill.bill_id
              ? {
                  ...bill,
                  final_mop: 'NC',
                  mop: 'NC',
                  nc_cust_name: ncData.nc_cust_name || '',
                  nc_cust_phone: ncData.nc_cust_phone || '',
                  nc_approved_by: ncData.nc_approved_by || '',
                }
              : bill,
          ),
        );

        // Update counter_bills table with NC data
        await new Promise<void>((resolve, reject) => {
          db.transaction((tx: any) => {
            tx.executeSql(
              `UPDATE counter_bills 
               SET final_mop = ?, mop = ?, nc_cust_name = ?, nc_cust_phone = ?, nc_approved_by = ? 
               WHERE bill_id = ?`,
              [
                'NC',
                'NC',
                ncData.nc_cust_name || '',
                ncData.nc_cust_phone || '',
                ncData.nc_approved_by || '',
                selectedBill.bill_id,
              ],
              (tx: any, results: any) => {
                if (results.rowsAffected > 0) {
                  console.log(
                    `Updated counter_bills to NC for bill_id: ${selectedBill.bill_id} with customer data`,
                  );
                  resolve();
                } else {
                  reject(
                    new Error(
                      'Update Failed: No rows affected in counter_bills',
                    ),
                  );
                }
              },
              (error: any) => {
                console.error('Error updating counter_bills for NC:', error);
                reject(error);
              },
            );
          });
        });

        // Update counter_payments table
        await new Promise<void>((resolve, reject) => {
          db.transaction((tx: any) => {
            tx.executeSql(
              `UPDATE counter_payments 
               SET payment_types = ? 
               WHERE bill_id = ?`,
              ['NC', selectedBill.bill_id],
              (tx: any, results: any) => {
                if (results.rowsAffected > 0) {
                  console.log(
                    `Updated counter_payments to NC for bill_id: ${selectedBill.bill_id}`,
                  );
                  resolve();
                } else {
                  reject(
                    new Error(
                      'Update Failed: No rows affected in counter_payments',
                    ),
                  );
                }
              },
              (error: any) => {
                console.error('Error updating counter_payments for NC:', error);
                reject(error);
              },
            );
          });
        });

        console.log(
          `Successfully updated payment mode to NC for bill ${selectedBill.bill_id}`,
        );
      } catch (error) {
        console.error('Error updating NC payment mode:', error);
        Alert.alert(
          'Error',
          'Failed to update NC payment mode. Please try again.',
        );
      }
    }

    // Close only NC modal, keep edit modal open
    setNcModal(false);
    setPaymentType({});
  };

  useEffect(() => {
    if (isFocused) {
      async function fetchSantheBills() {
        const fetchedSantheBills = await syncCounterBill(
          'sante_bills',
          'sante_items',
          'sante_discounts',
        );
        setSantheBills(fetchedSantheBills);
        setBillData(fetchedSantheBills);
        setLoading(false);
      }

      async function fetchMyAPI() {
        setLoading(true);
        const counterBills = await syncCounterBill(
          'counter_bills',
          'counter_items',
          'counter_payments',
        );
        // console.log(JSON.stringify(counterBills), 'counterBills');
        setCounterBills(counterBills);
        setBillData(counterBills);
        setLoading(false);
      }

      if (isSantheEnabled) {
        fetchSantheBills();
      } else {
        fetchMyAPI();
      }
    }
  }, [isFocused]);

  const formatAmount = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '0') return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPaymentModeIcon = (mode: string) => {
    // console.log(mode, 'mode');
    switch (mode.toLowerCase()) {
      case 'cash':
        return 'cash';
      case 'card':
        return 'credit-card';
      case 'upi':
        return 'bank';
      default:
        return 'currency-usd';
    }
  };

  const getPaymentModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'cash':
        return '#4CAF50';
      case 'card':
        return '#2196F3';
      case 'upi':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const sortBillsByLatest = (bills: any[], idKey: 'bill_id' = 'bill_id') =>
    [...bills].sort(
      (a, b) => Number(b?.[idKey] ?? 0) - Number(a?.[idKey] ?? 0),
    );

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={[styles.headerCell, styles.billNumberHeader]}>
        <Text style={styles.headerText}>Bill Number</Text>
      </View>
      <View style={[styles.headerCell, styles.billDateHeader]}>
        <Text style={styles.headerText}>Bill Date</Text>
      </View>
      <View style={[styles.headerCell, styles.amountHeader]}>
        <Text style={styles.headerText}>Amount</Text>
      </View>
      <View style={[styles.headerCell, styles.paymentModeHeader]}>
        <Text style={styles.headerText}>Payment Mode</Text>
      </View>
      {!isSantheEnabled && (
        <View style={[styles.headerCell, styles.editHeader]}>
          <Text style={styles.headerText}>Edit</Text>
        </View>
      )}
    </View>
  );

  const renderTableRow = (item: BillData, index: number) => {
    return (
      <View
        key={item.bill_id}
        style={[
          styles.tableRow,
          {backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8F9FA'},
        ]}>
        <View style={[styles.dataCell, styles.billNumberCell]}>
          <Text style={styles.billNumberText}>{item.invoice_no}</Text>
          {item?.counter_items?.map((item: any) => (
            <Text key={item.item_id} style={styles.productText}>
              {item.product_name
                .toLowerCase()
                .replace(/\b\w/g, (letter: any) => letter.toUpperCase())}{' '}
              - {item.quantity} x {item.basic_price} = {item.total_price}
            </Text>
          ))}
        </View>
        <View style={[styles.dataCell, styles.billDateCell]}>
          <Text style={styles.dataText}>{formatDate(item.invoice_date)}</Text>
          <Text style={styles.dataText}>{item.invoice_time}</Text>
        </View>
        <View style={[styles.dataCell, styles.amountCell]}>
          <Text style={styles.amountText}>
            {formatAmount(item.total_amount)}
          </Text>
        </View>
        <View style={[styles.dataCell, styles.paymentModeCell]}>
          <View style={styles.paymentModeContainer}>
            <MaterialCommunityIcons
              name={getPaymentModeIcon(item.final_mop || item.mop)}
              size={16}
              color={getPaymentModeColor(item.final_mop || item.mop)}
            />
            <Text style={styles.paymentModeText}>
              {item.final_mop || item.mop}
            </Text>
          </View>
        </View>
        <View style={[styles.dataCell, styles.editCell]}>
          <TouchableOpacity
            onPress={() => handleEditPayment(item)}
            style={styles.editButton}>
            <MaterialCommunityIcons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSantheTableRow = (item: any, index: number) => {
    return (
      <View
        key={item.bill_no}
        style={[
          styles.tableRow,
          {backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8F9FA'},
        ]}>
        <View style={[styles.dataCell, styles.billNumberCell]}>
          <Text style={styles.billNumberText}>{item.bill_no}</Text>
          {item?.counter_items?.map((item: any) => (
            <Text key={item.item_id} style={styles.productText}>
              {item.item_name
                .toLowerCase()
                .replace(/\b\w/g, (letter: any) => letter.toUpperCase())}{' '}
              - {item.item_qty} x {item.item_basic} = {item.item_price}
            </Text>
          ))}
        </View>
        <View style={[styles.dataCell, styles.billDateCell]}>
          <Text style={styles.dataText}>{formatDate(item.bill_date)}</Text>
          <Text style={styles.dataText}>{item.bill_time}</Text>
        </View>
        <View style={[styles.dataCell, styles.amountCell]}>
          <Text style={styles.amountText}>
            {formatAmount(item.grand_total_amount)}
          </Text>
        </View>
        <View style={[styles.dataCell, styles.paymentModeCell]}>
          <View style={styles.paymentModeContainer}>
            <MaterialCommunityIcons
              name={getPaymentModeIcon(item.payment_type || item.mop)}
              size={16}
              color={getPaymentModeColor(item.payment_type || item.mop)}
            />
            <Text style={styles.paymentModeText}>
              {item.payment_type || item.mop}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="loading" size={40} color="#007AFF" />
          <Text style={styles.loadingText}>Loading bills...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          {counterBills.length > 0 ? (
            sortBillsByLatest(counterBills)
              .slice(0, 10)
              .map((item, index) => renderTableRow(item, index))
          ) : santeBills.length > 0 ? (
            sortBillsByLatest(santeBills)
              .slice(0, 10)
              .map((item, index) => renderSantheTableRow(item, index))
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={48}
                color="#9E9E9E"
              />
              <Text style={styles.noDataText}>No bills found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {ncModal && (
        <View style={styles.ncModalContainer}>
          <NCModal
            visible={ncModal}
            onClose={() => {
              setNcModal(false);
              setPaymentType({});
            }}
            setNcModalData={setNcModalData}
            onNcDone={onNcDone}
            ncModalData={ncModalData}
            isPortrait={true}
          />
        </View>
      )}

      {/* Edit Payment Mode Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Payment Mode</Text>
              <TouchableOpacity onPress={handleCancelEdit}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.billInfoText}>
                Bill: {selectedBill?.invoice_no}
              </Text>
              <Text style={styles.billInfoText}>
                Amount:{' '}
                {selectedBill ? formatAmount(selectedBill.total_amount) : ''}
              </Text>

              <Text style={styles.paymentModeLabel}>Select Payment Mode:</Text>
              {paymentModes.map((mode: any) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.paymentModeOption,
                    selectedPaymentMode === mode && styles.selectedPaymentMode,
                  ]}
                  onPress={() => handlePaymentModeSelect(mode)}>
                  <MaterialCommunityIcons
                    name={getPaymentModeIcon(mode)}
                    size={20}
                    color={getPaymentModeColor(mode)}
                  />
                  <Text
                    style={[
                      styles.paymentModeOptionText,
                      selectedPaymentMode === mode &&
                        styles.selectedPaymentModeText,
                    ]}>
                    {mode}
                  </Text>
                  {selectedPaymentMode === mode && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color="#007AFF"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSavePayment}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
  },
  filterButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 50,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
  },
  headerCell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  billNumberHeader: {
    flex: 1.2,
  },
  billDateHeader: {
    flex: 1.6,
  },
  amountHeader: {
    flex: 1,
  },
  paymentModeHeader: {
    flex: 1.2,
  },
  editHeader: {
    flex: 0.8,
  },
  headerText: {
    fontSize: 12,
    fontFamily: fonts.NunitoSansBold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dataCell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  billNumberCell: {
    flex: 1.6,
  },
  billDateCell: {
    flex: 1,
  },
  amountCell: {
    flex: 1,
  },
  paymentModeCell: {
    flex: 1.2,
  },
  editCell: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#F0F8FF',
  },
  billNumberText: {
    fontSize: 12,
    fontFamily: fonts.NunitoSansBold,
    color: '#007AFF',
    textAlign: 'center',
  },
  dataText: {
    fontSize: 12,
    fontFamily: fonts.NunitoSansRegular,
    color: '#333333',
    textAlign: 'center',
  },
  productText: {
    fontSize: 10,
    fontFamily: fonts.NunitoSansRegular,
    color: '#333333',
    textAlign: 'left',
  },
  amountText: {
    fontSize: 12,
    fontFamily: fonts.NunitoSansBold,
    color: '#4CAF50',
    textAlign: 'center',
  },
  paymentModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentModeText: {
    fontSize: 12,
    fontFamily: fonts.NunitoSansRegular,
    color: '#333333',
    marginLeft: 4,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansRegular,
    color: '#9E9E9E',
    marginTop: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
  },
  modalContent: {
    padding: 16,
  },
  billInfoText: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
    marginBottom: 8,
  },
  paymentModeLabel: {
    fontSize: 16,
    fontFamily: fonts.NunitoSansBold,
    color: '#333333',
    marginTop: 16,
    marginBottom: 12,
  },
  paymentModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  selectedPaymentMode: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  paymentModeOptionText: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansRegular,
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  selectedPaymentModeText: {
    fontFamily: fonts.NunitoSansBold,
    color: '#007AFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansRegular,
    color: '#666666',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: fonts.NunitoSansBold,
    color: '#FFFFFF',
  },
  ncModalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
});

export default BillReport;

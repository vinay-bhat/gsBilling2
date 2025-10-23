const API_BASE_URL = "https://api.razorpay.com/v1/payments";
//Test Credentials
// const customer_id = "cust_QiZyFVoggo0M6S";
// const key_secret = "tHYP0lmDRNWNqEhKlliPJFRb";
// const key_id = "rzp_test_Du0Xey5fSJDqEB";
//Live Credentials
// const customer_id = "cust_QjOFpfmlKWqulh";
// const key_secret = "6QxCaIRQKFtMCylbiXzJH9Rd";
// const key_id = "rzp_live_Vz98dK4TH6eJJH";

// class PaymentService {
//   static async createOrder(amount, currency = 'INR', description = '') {
//     try {
//       const response = await fetch(`${API_BASE_URL}/create-order.php`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           amount,
//           currency,
//           description,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to create order');
//       }

//       return data;
//     } catch (error) {
//       console.error('Error creating order:', error);
//       throw error;
//     }
//   }

//   static async checkPaymentStatus(orderId) {
//     try {
//       const response = await fetch(
//         `${API_BASE_URL}/check-payment-status.php?order_id=${orderId}`,
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to check payment status');
//       }

//       return data;
//     } catch (error) {
//       console.error('Error checking payment status:', error);
//       throw error;
//     }
//   }
// }

// export default PaymentService;

class PaymentService {
  static base64Encode(str) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    let i = 0;

    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;

      const bitmap = (a << 16) | (b << 8) | c;

      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : "=";
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : "=";
    }

    console.log("result", result);

    return result;
  }

  static async createUpiQR(
    amount,
    currency = "INR",
    description = "",
    qrType = "upi_direct",
    customer_id,
    key_id,
    key_secret
  ) {
    try {
      // console.log('API URL:', apiUrl);
      console.log("Creating UPI QR with:", {
        amount,
        currency,
        description,
        qrType,
        customer_id,
        key_id,
        key_secret,
      });

      const requestBody = {
        type: "upi_qr",
        name: "Store_1",
        usage: "single_use",
        fixed_amount: true,
        payment_amount: amount * 100,
        description: "For Store 1",
        customer_id: customer_id,
        close_by: Math.floor(Date.now() / 1000) + 150,
        notes: {
          purpose: "Test UPI QR code notes",
        },
      };

      console.log("Request body:", JSON.stringify(requestBody));

      // Use the UPI QR endpoint
      // const endpoint = 'https://api.razorpay.com/v1/payments/qr_codes';
      const response = await fetch(`${API_BASE_URL}/qr_codes`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${this.base64Encode(
            key_id + ":" + key_secret
          )}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log("Parsed response:", data);

      // if (!data.success) {
      //   throw new Error(data.error || 'Failed to create UPI QR code');
      // }

      return data;
    } catch (error) {
      console.error("Error creating UPI QR code:", error);
      throw error;
    }
  }

  static async checkPaymentStatus(paymentData, key_id, key_secret) {
    try {
      // Extract payment information
      const qr_id = paymentData.id;

      console.log("Checking payment status with data:", {
        qr_id,
      });

      // Validate that we have at least one identifier
      if (!qr_id) {
        throw new Error("Missing payment identifier. Need qr_id");
      }

      const url = `${API_BASE_URL}/qr_codes/${qr_id}/payments`;
      console.log("Status check URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${this.base64Encode(
            key_id + ":" + key_secret
          )}`,
        },
      });

      console.log("Status check response status:", response.status);

      // if (!response.ok) {
      //   const errorText = await response.text();
      //   console.error('Status check error:', errorText);
      //   throw new Error(
      //     `HTTP error! status: ${response.status}, body: ${errorText}`,
      //   );
      // }

      const responseText = await response.text();
      console.log("Status check raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log("Status check parsed response:", data);

      // if (!data.success) {
      //   throw new Error(data.error || 'Failed to check payment status');
      // }

      return data;
    } catch (error) {
      console.error("Error checking payment status:", error);
      throw error;
    }
  }

  static async cancelPayment(paymentData, key_id, key_secret) {
    try {
      const qr_id = paymentData.id;
      const response = await fetch(`${API_BASE_URL}/qr_codes/${qr_id}/close`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${this.base64Encode(
            key_id + ":" + key_secret
          )}`,
        },
      });

      console.log("Response status:", response.status);

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log("Parsed response:", data);

      // if (!data.success) {
      //   throw new Error(data.error || 'Failed to create UPI QR code');
      // }

      return data;
    } catch (error) {
      console.error("Error canceling payment:", error);
      throw error;
    }
  }
}

export default PaymentService;

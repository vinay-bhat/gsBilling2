package com.gsbilling;

public final class PrinterResult {

    private PrinterResult() {
        // Prevent instantiation
    }

    public static final int SDK_OK = 0;
    public static final int SDK_BASE_ERR = -1000;
    public static final int SDK_SENT_ERR = -1001;
    public static final int SDK_PARAM_ERR = -1002;
    public static final int SDK_TIMEOUT = -1003;
    public static final int SDK_RECV_ERR = -1004;
    public static final int SDK_UNKNOWN_ERR = -1005;
    public static final int SDK_CMD_ERR = -1006;
    public static final int SDK_UNKNOWN_CMD = -1015;
    public static final int SDK_FEATURE_NOT_SUPPORT = -1099;
    public static final int SDK_SERVICE_NOT_BIND = -1098;

    // Device connection
    public static final int DEVICE_NOT_CONNECT = -1100;
    public static final int DEVICE_DISCONNECT = -1101;
    public static final int DEVICE_CONNECTED = -1102;
    public static final int DEVICE_CONN_ERR = -1103;
    public static final int DEVICE_NOT_SUPPORT = -1104;
    public static final int DEVICE_NOT_FOUND = -1105;
    public static final int DEVICE_OPEN_ERR = -1106;
    public static final int DEVICE_NO_PERMISSION = -1107;

    // Printer
    public static final int PRN_BASE_ERR = -1200;
    public static final int PRN_COVER_OPEN = PRN_BASE_ERR - 1;
    public static final int PRN_PARAM_ERR = PRN_BASE_ERR - 2;
    public static final int PRN_NO_PAPER = PRN_BASE_ERR - 3;
    public static final int PRN_OVERHEAT = PRN_BASE_ERR - 4;
    public static final int PRN_UNKNOWN_ERR = PRN_BASE_ERR - 5;
    public static final int PRN_PRINTING = PRN_BASE_ERR - 6;
    public static final int PRN_NO_NFC = PRN_BASE_ERR - 7;
    public static final int PRN_NFC_NO_PAPER = PRN_BASE_ERR - 8;
    public static final int PRN_LOW_BATTERY = PRN_BASE_ERR - 9;
    public static final int PRN_LBL_LOCATE_ERR = PRN_BASE_ERR - 90;
    public static final int PRN_LBL_DETECT_ERR = PRN_BASE_ERR - 91;
    public static final int PRN_LBL_NO_DETECT = PRN_BASE_ERR - 92;

    public static String msg(Integer code) {
        if (code == null) return "unknown error";

        switch (code) {
            case SDK_OK:
                return "Success";
            case SDK_SERVICE_NOT_BIND:
                return "Printer service not bind";
            case SDK_SENT_ERR:
                return "Send error";
            case SDK_PARAM_ERR:
                return "Params error";
            case SDK_TIMEOUT:
                return "Timeout";
            case SDK_RECV_ERR:
                return "Receive error";
            case SDK_CMD_ERR:
                return "Cmd error";
            case SDK_UNKNOWN_CMD:
                return "Unknown cmd";
            case SDK_FEATURE_NOT_SUPPORT:
                return "Feature not support";

            case DEVICE_NOT_CONNECT:
                return "Device not connected";
            case DEVICE_DISCONNECT:
                return "Device disconnected";
            case DEVICE_CONNECTED:
                return "Device connected";
            case DEVICE_CONN_ERR:
                return "Device connect error";
            case DEVICE_NOT_SUPPORT:
                return "Device not support";
            case DEVICE_NOT_FOUND:
                return "Device not found";
            case DEVICE_OPEN_ERR:
                return "Device open error";
            case DEVICE_NO_PERMISSION:
                return "No permission";

            case PRN_COVER_OPEN:
                return "Printer cover open";
            case PRN_PARAM_ERR:
                return "Printer params error";
            case PRN_NO_PAPER:
                return "Printer no paper";
            case PRN_OVERHEAT:
                return "Printer overheat";
            case PRN_UNKNOWN_ERR:
                return "Printer unknown error";
            case PRN_PRINTING:
                return "Printer is printing";
            case PRN_NO_NFC:
                return "Printer no NFC";
            case PRN_NFC_NO_PAPER:
                return "Printer NFC no paper";
            case PRN_LOW_BATTERY:
                return "Printer low battery";
            case PRN_LBL_LOCATE_ERR:
                return "Printer label locate error";
            case PRN_LBL_DETECT_ERR:
                return "Printer label detect error";
            case PRN_LBL_NO_DETECT:
                return "Printer label not detected";

            default:
                return "unknown error";
        }
    }
}
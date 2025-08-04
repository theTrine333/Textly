package com.tesla254.Textly;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";
    private ReactApplicationContext reactContext;

    public SmsReceiver(ReactApplicationContext reactContext) {
        this.reactContext = reactContext;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        
                        WritableMap params = Arguments.createMap();
                        params.putString("address", smsMessage.getDisplayOriginatingAddress());
                        params.putString("body", smsMessage.getDisplayMessageBody());
                        params.putDouble("date", smsMessage.getTimestampMillis());
                        params.putInt("simSlot", getSimSlot(smsMessage));
                        
                        // Send event to React Native
                        sendEvent("onSmsReceived", params);
                        
                        Log.d(TAG, "SMS received from: " + smsMessage.getDisplayOriginatingAddress());
                    }
                }
            }
        }
    }

    private int getSimSlot(SmsMessage smsMessage) {
        try {
            // Try to get SIM slot from message
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP_MR1) {
                return smsMessage.getSubId();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting SIM slot", e);
        }
        return 0; // Default to SIM 1
    }

    private void sendEvent(String eventName, WritableMap params) {
        if (reactContext != null) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }
} 
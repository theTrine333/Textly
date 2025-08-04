package com.tesla254.Textly;

import android.Manifest;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.SmsManager;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;
import android.provider.Telephony;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;

public class SmsModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SmsModule";
    private static final int SMS_PERMISSION_REQUEST = 123;
    private static final String SMS_SENT = "SMS_SENT";
    private static final String SMS_DELIVERED = "SMS_DELIVERED";

    private final ReactApplicationContext reactContext;
    private BroadcastReceiver smsSentReceiver;
    private BroadcastReceiver smsDeliveredReceiver;

    public SmsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        setupSmsReceivers();
    }

    @Override
    public String getName() {
        return "SmsModule";
    }

    private void setupSmsReceivers() {
        // SMS Sent Receiver
        smsSentReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String messageId = intent.getStringExtra("message_id");
                int resultCode = getResultCode();
                
                WritableMap params = Arguments.createMap();
                params.putString("messageId", messageId);
                
                switch (resultCode) {
                    case Activity.RESULT_OK:
                        params.putString("status", "sent");
                        break;
                    default:
                        params.putString("status", "failed");
                        break;
                }
                
                sendEvent("onSmsSent", params);
            }
        };

        // SMS Delivered Receiver
        smsDeliveredReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String messageId = intent.getStringExtra("message_id");
                
                WritableMap params = Arguments.createMap();
                params.putString("messageId", messageId);
                params.putString("status", "delivered");
                
                sendEvent("onSmsDelivered", params);
            }
        };

        // Register receivers
        reactContext.registerReceiver(smsSentReceiver, new IntentFilter(SMS_SENT));
        reactContext.registerReceiver(smsDeliveredReceiver, new IntentFilter(SMS_DELIVERED));
    }

    @ReactMethod
    public void sendSMS(String phoneNumber, String message, int simSlot, Promise promise) {
        try {
            // Check permissions
            if (!hasSmsPermission()) {
                promise.reject("PERMISSION_DENIED", "SMS permission not granted");
                return;
            }

            // Get SMS Manager
            SmsManager smsManager;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                // For Android 12+ (API 31+), use subscription-based SMS manager
                if (simSlot >= 0) {
                    SubscriptionManager subscriptionManager = (SubscriptionManager) 
                        reactContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
                    if (subscriptionManager != null) {
                        int subscriptionId = getSubscriptionId(simSlot);
                        if (subscriptionId != -1) {
                            smsManager = reactContext.getSystemService(SmsManager.class)
                                .createForSubscriptionId(subscriptionId);
                        } else {
                            smsManager = SmsManager.getDefault();
                        }
                    } else {
                        smsManager = SmsManager.getDefault();
                    }
                } else {
                    smsManager = SmsManager.getDefault();
                }
            } else {
                // For older Android versions
                smsManager = SmsManager.getDefault();
            }

            // Create pending intents for delivery status
            String messageId = "sms_" + System.currentTimeMillis();
            
            Intent sentIntent = new Intent(SMS_SENT);
            sentIntent.putExtra("message_id", messageId);
            android.app.PendingIntent sentPI = android.app.PendingIntent.getBroadcast(
                reactContext, 0, sentIntent, 
                android.app.PendingIntent.FLAG_IMMUTABLE | android.app.PendingIntent.FLAG_UPDATE_CURRENT
            );

            Intent deliveredIntent = new Intent(SMS_DELIVERED);
            deliveredIntent.putExtra("message_id", messageId);
            android.app.PendingIntent deliveredPI = android.app.PendingIntent.getBroadcast(
                reactContext, 0, deliveredIntent, 
                android.app.PendingIntent.FLAG_IMMUTABLE | android.app.PendingIntent.FLAG_UPDATE_CURRENT
            );

            // Send SMS
            if (message.length() > 160) {
                // Split long messages
                ArrayList<String> parts = smsManager.divideMessage(message);
                ArrayList<android.app.PendingIntent> sentIntents = new ArrayList<>();
                ArrayList<android.app.PendingIntent> deliveredIntents = new ArrayList<>();
                
                for (int i = 0; i < parts.size(); i++) {
                    sentIntents.add(sentPI);
                    deliveredIntents.add(deliveredPI);
                }
                
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, sentIntents, deliveredIntents);
            } else {
                // Send single SMS
                smsManager.sendTextMessage(phoneNumber, null, message, sentPI, deliveredPI);
            }

            promise.resolve(messageId);
        } catch (Exception e) {
            promise.reject("SMS_SEND_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isDefaultSMSApp(Promise promise) {
        try {
            String defaultSmsApp = Telephony.Sms.getDefaultSmsPackage(reactContext);
            String currentPackage = reactContext.getPackageName();
            boolean isDefault = defaultSmsApp != null && defaultSmsApp.equals(currentPackage);
            promise.resolve(isDefault);
        } catch (Exception e) {
            promise.reject("DEFAULT_SMS_CHECK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestDefaultSMSApp(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                Intent intent = new Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT);
                intent.putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, reactContext.getPackageName());
                
                Activity currentActivity = getCurrentActivity();
                if (currentActivity != null) {
                    currentActivity.startActivityForResult(intent, SMS_PERMISSION_REQUEST);
                    promise.resolve(true);
                } else {
                    promise.reject("ACTIVITY_ERROR", "No current activity available");
                }
            } else {
                promise.reject("API_LEVEL_ERROR", "Default SMS app request not supported on this API level");
            }
        } catch (Exception e) {
            promise.reject("DEFAULT_SMS_REQUEST_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestSmsPermissions(Promise promise) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (currentActivity != null) {
                String[] permissions = {
                    Manifest.permission.SEND_SMS,
                    Manifest.permission.READ_SMS,
                    Manifest.permission.RECEIVE_SMS
                };
                
                ActivityCompat.requestPermissions(currentActivity, permissions, SMS_PERMISSION_REQUEST);
                promise.resolve(true);
            } else {
                promise.reject("ACTIVITY_ERROR", "No current activity available");
            }
        } catch (Exception e) {
            promise.reject("PERMISSION_REQUEST_ERROR", e.getMessage());
        }
    }

    private boolean hasSmsPermission() {
        return ContextCompat.checkSelfPermission(reactContext, Manifest.permission.SEND_SMS) 
            == PackageManager.PERMISSION_GRANTED;
    }

    private int getSubscriptionId(int simSlot) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                SubscriptionManager subscriptionManager = (SubscriptionManager) 
                    reactContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
                if (subscriptionManager != null) {
                    for (android.telephony.SubscriptionInfo subscriptionInfo : 
                         subscriptionManager.getActiveSubscriptionInfoList()) {
                        if (subscriptionInfo.getSimSlotIndex() == simSlot) {
                            return subscriptionInfo.getSubscriptionId();
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return -1;
    }

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        if (smsSentReceiver != null) {
            reactContext.unregisterReceiver(smsSentReceiver);
        }
        if (smsDeliveredReceiver != null) {
            reactContext.unregisterReceiver(smsDeliveredReceiver);
        }
    }
} 
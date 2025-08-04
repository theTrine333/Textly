package com.tesla254.Textly

import android.Manifest
import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import android.provider.Telephony

import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "SmsModule"
        private const val SMS_PERMISSION_REQUEST = 123
        private const val SMS_SENT = "SMS_SENT"
        private const val SMS_DELIVERED = "SMS_DELIVERED"
    }

    private var smsSentReceiver: BroadcastReceiver? = null
    private var smsDeliveredReceiver: BroadcastReceiver? = null

    init {
        setupSmsReceivers()
    }

    override fun getName(): String {
        return "SmsModule"
    }

    private fun setupSmsReceivers() {
        // SMS Sent Receiver
        smsSentReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                val messageId = intent.getStringExtra("message_id")
                val resultCode = resultCode
                
                val params: WritableMap = Arguments.createMap()
                params.putString("messageId", messageId)
                
                when (resultCode) {
                    Activity.RESULT_OK -> params.putString("status", "sent")
                    else -> params.putString("status", "failed")
                }
                
                sendEvent("onSmsSent", params)
            }
        }

        // SMS Delivered Receiver
        smsDeliveredReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                val messageId = intent.getStringExtra("message_id")
                
                val params: WritableMap = Arguments.createMap()
                params.putString("messageId", messageId)
                params.putString("status", "delivered")
                
                sendEvent("onSmsDelivered", params)
            }
        }

        // Register receivers
        reactContext.registerReceiver(smsSentReceiver, IntentFilter(SMS_SENT))
        reactContext.registerReceiver(smsDeliveredReceiver, IntentFilter(SMS_DELIVERED))
    }

    @ReactMethod
    fun sendSMS(phoneNumber: String, message: String, simSlot: Int, promise: Promise) {
        try {
            // Check permissions
            if (!hasSmsPermission()) {
                promise.reject("PERMISSION_DENIED", "SMS permission not granted")
                return
            }

            // Get SMS Manager
            val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                // For Android 12+ (API 31+), use subscription-based SMS manager
                if (simSlot >= 0) {
                    val subscriptionManager = reactContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager?
                    if (subscriptionManager != null) {
                        val subscriptionId = getSubscriptionId(simSlot)
                        if (subscriptionId != -1) {
                            reactContext.getSystemService(SmsManager::class.java)
                                .createForSubscriptionId(subscriptionId)
                        } else {
                            SmsManager.getDefault()
                        }
                    } else {
                        SmsManager.getDefault()
                    }
                } else {
                    SmsManager.getDefault()
                }
            } else {
                // For older Android versions
                SmsManager.getDefault()
            }

            // Create pending intents for delivery status
            val messageId = "sms_${System.currentTimeMillis()}"
            
            val sentIntent = Intent(SMS_SENT).apply {
                putExtra("message_id", messageId)
            }
            val sentPI = android.app.PendingIntent.getBroadcast(
                reactContext, 0, sentIntent, 
                android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT
            )

            val deliveredIntent = Intent(SMS_DELIVERED).apply {
                putExtra("message_id", messageId)
            }
            val deliveredPI = android.app.PendingIntent.getBroadcast(
                reactContext, 0, deliveredIntent, 
                android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT
            )

            // Send SMS
            if (message.length > 160) {
                // Split long messages
                val parts = smsManager.divideMessage(message)
                val sentIntents = ArrayList<android.app.PendingIntent>()
                val deliveredIntents = ArrayList<android.app.PendingIntent>()
                
                repeat(parts.size) {
                    sentIntents.add(sentPI)
                    deliveredIntents.add(deliveredPI)
                }
                
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, sentIntents, deliveredIntents)
            } else {
                // Send single SMS
                smsManager.sendTextMessage(phoneNumber, null, message, sentPI, deliveredPI)
            }

            promise.resolve(messageId)
        } catch (e: Exception) {
            promise.reject("SMS_SEND_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isDefaultSMSApp(promise: Promise) {
        try {
            val defaultSmsApp = Telephony.Sms.getDefaultSmsPackage(reactContext)
            val currentPackage = reactContext.packageName
            val isDefault = defaultSmsApp != null && defaultSmsApp == currentPackage
            promise.resolve(isDefault)
        } catch (e: Exception) {
            promise.reject("DEFAULT_SMS_CHECK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestDefaultSMSApp(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                val intent = Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT).apply {
                    putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, reactContext.packageName)
                }
                
                val currentActivity = currentActivity
                if (currentActivity != null) {
                    currentActivity.startActivityForResult(intent, SMS_PERMISSION_REQUEST)
                    promise.resolve(true)
                } else {
                    promise.reject("ACTIVITY_ERROR", "No current activity available")
                }
            } else {
                promise.reject("API_LEVEL_ERROR", "Default SMS app request not supported on this API level")
            }
        } catch (e: Exception) {
            promise.reject("DEFAULT_SMS_REQUEST_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestSmsPermissions(promise: Promise) {
        try {
            val currentActivity = currentActivity
            if (currentActivity != null) {
                val permissions = arrayOf(
                    Manifest.permission.SEND_SMS,
                    Manifest.permission.READ_SMS,
                    Manifest.permission.RECEIVE_SMS
                )
                
                ActivityCompat.requestPermissions(currentActivity, permissions, SMS_PERMISSION_REQUEST)
                promise.resolve(true)
            } else {
                promise.reject("ACTIVITY_ERROR", "No current activity available")
            }
        } catch (e: Exception) {
            promise.reject("PERMISSION_REQUEST_ERROR", e.message)
        }
    }

    private fun hasSmsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(reactContext, Manifest.permission.SEND_SMS) 
            == PackageManager.PERMISSION_GRANTED
    }

    private fun getSubscriptionId(simSlot: Int): Int {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                val subscriptionManager = reactContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager?
                if (subscriptionManager != null) {
                    for (subscriptionInfo in subscriptionManager.activeSubscriptionInfoList) {
                        if (subscriptionInfo.simSlotIndex == simSlot) {
                            return subscriptionInfo.subscriptionId
                        }
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return -1
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        smsSentReceiver?.let { reactContext.unregisterReceiver(it) }
        smsDeliveredReceiver?.let { reactContext.unregisterReceiver(it) }
    }
} 